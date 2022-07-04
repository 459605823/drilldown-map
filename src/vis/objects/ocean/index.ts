/* eslint-disable no-shadow  */
import * as THREE from 'three';
import {BaseObject} from '@q/pencil';
import {getTexture} from '@vis/utils';

interface Options {
  width: number;
  height: number;
  position: THREE.Vector3;
}

export default class Ocean extends BaseObject {
  options: Options;

  material: THREE.MeshBasicMaterial;

  guiParams = {
    ocean: {
      color: {
        value: '#368ace',
        target: () => this.material,
      },
    },
  };

  constructor(options: Options) {
    super();
    this.options = {
      ...Ocean.options,
      ...options,
    };
  }

  static options = {
    width: 1000,
    height: 1080,
    position: new THREE.Vector3(0, 0, 0),
  };

  create() {
    const {width, height, position} = this.options;
    const texture = getTexture('grid.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.repeat.set(4, 4);
    const plane = new THREE.PlaneBufferGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: new THREE.Color('#071f33'),
      transparent: false,
      depthWrite: false,
    });
    this.material = material;
    this.setGuiTargetValueByParams();
    this.createMesh(plane, material);
    this.object3d.position.copy(position);
  }
}
