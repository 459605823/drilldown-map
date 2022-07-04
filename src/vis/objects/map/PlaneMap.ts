/* eslint-disable no-shadow  */
/* eslint-disable no-restricted-syntax  */

import {BaseObject} from '@q/pencil';
import * as THREE from 'three';
import type {MeshLineMaterial} from '@q/pencil/dist/objects';
import type {geoProjection} from 'd3-geo';
import type {FeatureCollection, Polygon, MultiPolygon} from 'geojson';
import {disposeMesh} from '@q/pencil/dist/utils';
import {
  topMat,
  sideMat,
  lineMat,
  bgLineMat,
  bgSideMat,
  bgTopMat,
} from './commonMaterial';
import Area, {IProps} from './Area';

interface Options {
  projection: ReturnType<typeof geoProjection>;
  geojson: FeatureCollection<Polygon | MultiPolygon>;
  level: 'country' | 'province' | 'city';
}

export default class PlaneMap extends BaseObject {
  raycaster = new THREE.Raycaster();

  areaMap: Map<Area, string[]>;

  allAreas: THREE.Mesh[];

  areaMaterials: THREE.Material[];

  lineMaterial: MeshLineMaterial;

  options: Options;

  isActive = true;

  depth = 4;

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
    lineMat: {
      color: {
        value: '#e8fbff',
        target: () => this.lineMaterial,
      },
      lightcolor: {
        // value: '#4ae8f4',
        value: '#00a2ff',
        onChange: (val: any) => {
          this.lineMaterial.uniforms.lightColor.value = new THREE.Color(val);
        },
      },
      opacity: {
        value: 1,
        min: 0,
        max: 1,
        step: 0.01,
        target: () => this.lineMaterial,
      },
    },
  };

  constructor(options: Options) {
    super();
    this.options = options;
    this.level = options.level;
  }

  create() {
    this.createGroup();
    this.createMaterials();
    this.createAreas();
    if (this.level !== 'country') {
      this.speed = this.level === 'province' ? 0.15 : 0.06;
    }
  }

  createMaterials() {
    const {width, height} = this.pencil.getSize();
    const areaMaterials = [topMat, sideMat];
    lineMat.uniforms.resolution.value = new THREE.Vector2(width, height);
    this.areaMaterials = areaMaterials;
    this.lineMaterial = lineMat;
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
    this.object3d.children.forEach((child) => {
      if (child instanceof Area) {
        const {level} = child.userData;
        child.position.z =
          level === 'province'
            ? THREE.MathUtils.randFloat(-0.5, 0.5)
            : THREE.MathUtils.randFloat(-0.2, 0.2);
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
    this.object3d.children.forEach((child) => {
      if (child instanceof Area) {
        child.position.z = 0;
        child.mesh?.children.forEach((m) => {
          (m as THREE.Mesh).material = [topMat, sideMat];
        });
        child.line?.children.forEach((l) => {
          (l as THREE.Mesh).material = lineMat;
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
    this.allAreas.length = 0;
    this.areaMaterials.length = 0;
    // @ts-ignore
    this.lineMaterial = null;
    // @ts-ignore
    this.areaMap = null;
    // @ts-ignore
    this.raycaster = null;
  }
}
