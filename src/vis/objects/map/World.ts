import {BaseObject} from '@q/pencil';
import * as THREE from 'three';
import worldGeojson from '@q/pencil/dist/geojson/countries.json';
import type {MeshLineMaterial} from '@q/pencil/dist/objects';
import type {geoProjection} from 'd3-geo';
import {bgTopMat, bgSideMat, bgLineMat} from './commonMaterial';
import Area, {IProps} from './Area';

interface Options {
  projection: ReturnType<typeof geoProjection>;
}

export default class World extends BaseObject {
  static options = {};

  areaMaterials: THREE.Material[];

  lineMaterial: MeshLineMaterial;

  options: Options;

  speed = 0.5;

  areas: Area[] = [];

  guiParams = {
    bgTopMat: {
      color: {
        value: '#082d4a',
        target: () => this.areaMaterials[0],
      },
    },
    bgSideMat: {
      color: {
        value: '#0f314d',
        target: () => this.areaMaterials[1],
      },
    },
    bgLineMat: {
      color: {
        value: '#2b6590',
        target: () => this.lineMaterial,
      },
      lightcolor: {
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
  }

  create() {
    this.createGroup();
    this.createMaterials();
    this.createAreas();
  }

  createMaterials() {
    const {width, height} = this.pencil.getSize();
    const areaMaterials = [bgTopMat, bgSideMat];
    bgLineMat.uniforms.resolution.value = new THREE.Vector2(width, height);
    this.areaMaterials = areaMaterials;
    this.lineMaterial = bgLineMat;
    this.setGuiTargetValueByParams();
  }

  createAreas() {
    const {projection} = this.options;
    worldGeojson.features.forEach((item) => {
      const props: IProps = {
        depth: THREE.MathUtils.randInt(2, 8),
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
      this.object3d.add(area);
      this.areas.push(area);
    });
  }

  findArea(name: string) {
    if (name === '新加坡') {
      return this.areas.find((area) => area.userData.NAME_CN === '马来西亚');
    }
    return this.areas.find((area) => area.userData.NAME_CN === name);
  }

  update() {
    this.lineMaterial.uniforms.time.value += this.speed;
  }

  dispose() {
    this.areas.forEach((area) => {
      area.dispose();
    });
    this.areas.length = 0;
    this.areaMaterials.length = 0;
    this.lineMaterial = null as unknown as any;
  }
}
