/* eslint-disable no-shadow  */
/* eslint-disable no-restricted-syntax  */

import {BaseObject} from '@q/pencil';
import * as THREE from 'three';
import {MeshLine, MeshLineMaterial} from '@q/pencil/dist/objects';
import type {geoProjection} from 'd3-geo';
import type {FeatureCollection, Polygon, MultiPolygon} from 'geojson';
import {union} from '@turf/turf';
import {mergeBufferGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils';
import {disposeMesh} from '@q/pencil/dist/utils';
import {
  topMat,
  sideMat,
  bgLineMat,
  bgSideMat,
  bgTopMat,
} from './commonMaterial';
import Area, {IProps} from './Area';

interface Options {
  projection: ReturnType<typeof geoProjection>;
  geojson: FeatureCollection<Polygon | MultiPolygon>;
  level: 'country' | 'province' | 'city';
  depth?: number;
  outline?: boolean;
}

export default class PlaneMap extends BaseObject {
  raycaster = new THREE.Raycaster();

  areaMap: Map<Area, string[]>;

  allAreas: THREE.Mesh[];

  areaMaterials: THREE.Material[];

  lineMaterial: MeshLineMaterial;

  outlineMaterial?: MeshLineMaterial;

  outline?: THREE.Mesh;

  options: Options;

  isActive = true;

  depth = 2;

  speed = 0.5;

  level: 'country' | 'province' | 'city' = 'country';

  oldArea: Area | null;

  guiParams = {
    topMat: {
      color: {
        value: '#01233c',
        target: () => this.areaMaterials[0],
      },
      emssivecolor: {
        paramMap: 'emissive',
        value: '#09374e',
        target: () => this.areaMaterials[0],
      },
      emissiveIntensity: {
        value: 0.5,
        min: 0,
        max: 10,
        step: 0.01,
        target: () => this.areaMaterials[0],
      },
      shininess: {
        value: 50,
        min: 0,
        max: 100,
        step: 1,
        target: () => this.areaMaterials[0],
      },
      opacity: {
        value: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
        target: () => this.areaMaterials[0],
      },
    },
    sideMat: {
      color: {
        value: '#004078',
        target: () => this.areaMaterials[1],
      },
      shininess: {
        value: 80,
        min: 0,
        max: 100,
        step: 1,
        target: () => this.areaMaterials[1],
      },
      opacity: {
        value: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
        target: () => this.areaMaterials[1],
      },
    },
    // lineMat: {
    //   color: {
    //     value: '#e8fbff',
    //     target: () => this.lineMaterial,
    //   },
    //   lightcolor: {
    //     // value: '#4ae8f4',
    //     value: '#00a2ff',
    //     onChange: (val: any) => {
    //       this.lineMaterial.uniforms.lightColor.value = new THREE.Color(val);
    //     },
    //   },
    //   opacity: {
    //     value: 1,
    //     min: 0,
    //     max: 1,
    //     step: 0.01,
    //     target: () => this.lineMaterial,
    //   },
    // },
  };

  constructor(options: Options) {
    super();
    this.options = options;
    this.level = options.level;
    this.depth = options.depth ?? this.depth;
  }

  async create() {
    this.createGroup();
    await this.createMaterials();
    this.createAreas();
    if (this.options.outline) {
      this.createOutline();
    }
    if (this.level !== 'country') {
      this.speed = this.level === 'province' ? 0.15 : 0.06;
    }
  }

  async createMaterials() {
    const {width, height} = this.pencil.getSize();
    if (!this.pencil.cacheController!.get('lineMat')) {
      this.pencil.cacheController!.init('lineMat');
      const lineMat = new MeshLineMaterial({
        lineWidth: 4,
        sizeAttenuation: 0,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(width, height),
        color: new THREE.Color('#69a8c7'),
      });
      lineMat.uniforms.lightColor.value = new THREE.Color('#00a2ff');
      const outlineMat = new MeshLineMaterial({
        lineWidth: 6,
        sizeAttenuation: 0,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(width, height),
        color: new THREE.Color('red'),
      });
      this.pencil.cacheController!.set('lineMat', {lineMat, outlineMat});
    }
    const {lineMat, outlineMat} = await this.pencil.cacheController!.get(
      'lineMat'
    );
    const areaMaterials = [topMat, sideMat];
    this.areaMaterials = areaMaterials;
    this.lineMaterial = lineMat;
    if (this.options.outline) {
      this.outlineMaterial = outlineMat;
    }
    this.setGuiTargetValueByParams();
  }

  createAreas() {
    const {projection, geojson} = this.options;
    this.areaMap = new Map();
    this.allAreas = [];

    geojson.features.forEach((item) => {
      const props: IProps = {
        depth: this.depth,
        projection,
        coords: [],
        areaMaterials: this.areaMaterials,
        lineMaterial: this.lineMaterial,
        ...item.properties,
      };
      if (!item.geometry || (!props.name && !props.NAME)) return;
      const {type, coordinates} = item.geometry;
      if (type === 'Polygon') {
        props.coords.push(coordinates[0] as [number, number][]);
      } else if (type === 'MultiPolygon') {
        coordinates.forEach((coord) => {
          props.coords.push(coord[0] as [number, number][]);
        });
      }
      const area = new Area(props);
      if (area.name) {
        this.areaMap.set(
          area,
          area.mesh?.children.map((child) => child.uuid) as string[]
        );
        this.allAreas.push(...(area.mesh?.children as THREE.Mesh[]));
        this.object3d.add(area);
      }
    });
  }

  createOutline() {
    const {geojson, projection} = this.options;
    const {depth} = this;
    // @ts-ignore
    const outlineGeojson = geojson.features.slice(1).reduce((acc, item) => {
      return union(acc, item);
    }, geojson.features[0]);
    const {coordinates, type} = outlineGeojson.geometry;
    const geos: THREE.BufferGeometry[] = [];
    const arr = type === 'MultiPolygon' ? coordinates.flat(1) : coordinates;
    arr.forEach((coord) => {
      const vertices: THREE.Vector3[] = [];
      coord.forEach((position) => {
        const [x, y] = projection(position as [number, number]) as [
          number,
          number
        ];
        vertices.push(new THREE.Vector3(x, -y, depth));
      });
      const line = new THREE.BufferGeometry().setFromPoints(vertices);
      const meshline = new MeshLine();
      meshline.setGeometry(line);
      geos.push(meshline.geometry);
    });
    const line = new THREE.Mesh(
      mergeBufferGeometries(geos),
      this.outlineMaterial
    );
    this.outline = line;
    this.object3d.add(line);
  }

  pickArea(mouse: THREE.Vector2) {
    const {pencil, raycaster, allAreas} = this;
    const {camera} = pencil;
    raycaster.setFromCamera(mouse, camera as THREE.Camera);
    const intersectedObjects = raycaster.intersectObjects(allAreas, true);
    if (intersectedObjects.length) {
      const selectedObj = intersectedObjects[0].object;
      let selectedArea;
      for (const [area, uuids] of this.areaMap.entries()) {
        if (uuids.includes(selectedObj.uuid)) {
          selectedArea = area;
        }
      }
      return selectedArea;
    }
  }

  handleMouseMove(mouse: THREE.Vector2) {
    const newArea = this.pickArea(mouse);
    const {oldArea} = this;
    if (newArea) {
      if (newArea !== oldArea) {
        if (oldArea) {
          oldArea.onmouseout();
        }
        newArea?.onmouseover();
        this.oldArea = newArea;
        return newArea;
      }
    } else if (oldArea) {
      oldArea.onmouseout();
      this.oldArea = null;
      return 'out';
    }
  }

  update() {
    if (this.isActive) {
      this.lineMaterial.uniforms.time.value += this.speed;
    }
  }

  deactive() {
    if (!this.isActive) return;
    this.isActive = false;
    if (this.outline) {
      this.outline.visible = false;
    }
    this.object3d.children.forEach((child) => {
      if (child instanceof Area) {
        const {level} = child.userData;
        const randZ = level === 'province' ? this.depth / 4 : this.depth / 10;
        child.position.z = THREE.MathUtils.randFloat(-randZ, randZ);
        child.mesh?.children.forEach((m) => {
          (m as THREE.Mesh).material = [bgTopMat, bgSideMat];
        });
        child.line?.children.forEach((l) => {
          (l as THREE.Mesh).material = bgLineMat;
        });
      }
    });
  }

  active() {
    if (this.isActive) return;
    this.isActive = true;
    if (this.outline) {
      this.outline.visible = true;
    }
    this.object3d.children.forEach((child) => {
      if (child instanceof Area) {
        child.position.z = 0;
        child.mesh?.children.forEach((m) => {
          (m as THREE.Mesh).material = [topMat, sideMat];
        });
        child.line?.children.forEach((l) => {
          (l as THREE.Mesh).material = this.lineMaterial;
        });
      }
    });
  }

  dispose() {
    this.allAreas.forEach((mesh) => {
      disposeMesh(mesh);
    });
    Array.from(this.areaMap.keys()).forEach((area) => {
      area.dispose();
    });
    if (this.outline) {
      disposeMesh(this.outline);
    }
    this.oldArea = null;
    this.areaMap.clear();
    this.allAreas.length = 0;
    this.areaMaterials.length = 0;
    this.lineMaterial = null as unknown as any;
    this.raycaster = null as unknown as any;
    this.outlineMaterial = undefined;
    this.outline = undefined;
  }
}
