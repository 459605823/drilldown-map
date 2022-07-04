import Pencil from '@q/pencil';
import Base from '@/vis/Base';
import {
  makePromiseCreator,
  getElementViewLeft,
  getElementViewTop,
} from '@q/pencil/dist/utils';
import chinaGeojson from '@q/pencil/dist/geojson/china.json';
import * as THREE from 'three';
import {geoEquirectangular} from 'd3-geo';
import drawController, {Materials} from './objects';
import {animation} from './utils';

const IS_DEV = process.env.NODE_ENV === 'development';
const projection = geoEquirectangular()
  .center([103.5, 34.5])
  .scale(300)
  .translate([0, 0])
  .precision(0.1);

export default class extends Base {
  pencil?: Pencil;

  on(eventName: string | symbol, listener: (...args: any[]) => void) {
    this.pencil!.event.on(eventName, listener);
  }

  constructor(container: HTMLElement) {
    super(container);
    const pencil = new Pencil(
      {
        isdev: IS_DEV,
        stats: IS_DEV,
        gui: IS_DEV,
        axesHelper: IS_DEV,
        container: this.container,
        control: true,
        light: false,
        camera: {
          near: 5,
          far: 3000,
        },
      },
      drawController
    );
    this.pencil = pencil;
    this.setControlConfig();
  }

  setControlConfig() {
    const {camera, control} = this.pencil!;
    if (!camera || !control) return;
    // control.zoomSpeed = 1.5;
    control.enableDamping = false;
    control.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    control.minDistance = 10;
    control.enableRotate = IS_DEV;
    control.maxDistance = 1000;
    camera.position.set(0, -1000, 600);
  }

  async init() {
    const map = await drawController.draw('PlaneMap', {
      projection,
      geojson: chinaGeojson as any,
      level: 'country',
    });
    map.object3d.position.setZ(9);
    await drawController.draw('WorldBg', {
      projection,
    });
    await drawController.draw('Light');
    await drawController.draw('Ocean');
    // await drawController.draw('SpriteImage', {
    //   position: new THREE.Vector3(130, -50, 9),
    //   src: islandSign,
    //   scale: 0.12,
    // });
    await Promise.all(drawController.objectsPromise);
    this.pencil?.start();
  }

  async animateIn() {
    const {camera} = this.pencil!;
    if (!camera) return;
    this.container.animate([{opacity: 0}, {opacity: 1}], {
      duration: 1200,
      fill: 'both',
      delay: 150,
    });
    await animation(
      camera.position,
      {x: 14, y: -147, z: 241},
      1.25,
      undefined
      // () => {
      //   this.mapHistory.push({
      //     map: this.map,
      //     cameraPos: camera!.position.clone(),
      //     center: new THREE.Vector3(0),
      //   });
      // }
    );
    // this.drawLabels();
  }

  draw() {}

  dispose() {
    Materials.disposeAllMaterials();
    this.pencil!.dispose();

    this.removeAllListeners();

    this.pencil = undefined;
  }
}
