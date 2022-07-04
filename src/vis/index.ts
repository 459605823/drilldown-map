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
import {center as getCenter} from '@turf/turf';
import drawController, {Materials} from './objects';
import type {PlaneMap, Area} from './objects';
import {animation, fileLoader} from './utils';

const IS_DEV = process.env.NODE_ENV === 'development';
const projection = geoEquirectangular()
  .center([103.5, 34.5])
  .scale(300)
  .translate([0, 0])
  .precision(0.1);

export default class extends Base {
  pencil?: Pencil;

  mouse = new THREE.Vector2();

  map: PlaneMap;

  mapHistory: {
    map: PlaneMap;
    cameraPos: THREE.Vector3;
    center: THREE.Vector3;
  }[] = [];

  adcodes: string[] = [];

  isAnimating = false;

  emitEvent(eventName: string | symbol, args: any) {
    this.pencil!.event.emit(eventName, args);
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
    this.map = map;
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
    this.registerEvents();
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
      undefined,
      () => {
        this.mapHistory.push({
          map: this.map,
          cameraPos: camera!.position.clone(),
          center: new THREE.Vector3(0),
        });
      }
    );
  }

  findArea(adcode: string) {
    const {areaMap} = this.map;
    if (areaMap) {
      const areas = [...areaMap.keys()];
      const area = areas.find((item) => adcode === `${item.userData.adcode}`);
      return area;
    }
  }

  async handleDrillDown(area?: Area | string, emitEvent = true) {
    const {camera, control} = this.pencil!;
    if (typeof area === 'string') {
      area = this.findArea(area);
    }
    area = area || this.map.pickArea(this.mouse);
    const light = drawController.getObject('Light');
    if (area && camera && control) {
      const {adcode, level, name} = area.userData;
      if (level === 'district') return;
      const res = await fileLoader(
        `${this.options.staticPath}/geojson/china/${level}/${adcode}.json`,
        () => console.log(`${name}的地图数据不存在`)
      );
      if (res) {
        this.adcodes.push(`${adcode}`);
        if (emitEvent) {
          this.emitEvent('drillDown', {adcode, name, level});
        }
        area.hide();
        this.map.deactive();
        const mapIndex = this.mapHistory.length;
        const {cameraPos} = this.mapHistory[mapIndex - 1];
        const geojson = JSON.parse(res as string);
        const map = await drawController.draw('PlaneMap', {
          projection,
          geojson,
          level,
        });
        map.object3d.position.setZ(this.map.object3d.position.z);
        const {size: preSize} = this.map.getSize();
        const {size} = map.getSize();
        const scale =
          size.x / size.y < preSize.x / preSize.y
            ? size.x / preSize.x
            : size.y / preSize.y;
        const absoluteCenter = getCenter(geojson).geometry.coordinates;
        const [cX, cY] = projection(absoluteCenter as [number, number]) as [
          number,
          number
        ];
        const newZ =
          this.map.object3d.position.z + (level === 'province' ? 1.5 : 0.4);
        const newCenter = new THREE.Vector3(cX, -cY, newZ);
        // this.world.speed =
        //   level === 'country' ? 0.5 : level === 'province' ? 0.15 : 0.06;
        Materials.changeLineAnimateParams(new THREE.Vector2(cX, -cY), level);
        light.group.position.copy(newCenter);
        const dest = new THREE.Vector3().lerpVectors(
          cameraPos,
          newCenter,
          1 - scale - 0.08 * mapIndex
        );
        await Promise.all([
          animation(
            control.target,
            newCenter.clone().add(new THREE.Vector3(0, 2, 2))
          ),
          animation(camera.position, new THREE.Vector3(cX, dest.y, dest.z)),
        ]);
        await animation(map.object3d.position, {z: newZ});
        this.map = map;
        this.mapHistory.push({
          map,
          cameraPos: camera.position.clone(),
          center: newCenter.clone(),
        });
      }
    }
  }

  async handleBack() {
    const {camera, control} = this.pencil!;
    const light = drawController.getObject('Light');
    if (this.mapHistory.length > 1 && camera && control && !this.isAnimating) {
      this.isAnimating = true;
      this.mapHistory.pop();
      this.adcodes.pop();
      drawController.erase(this.map);
      const {map, cameraPos, center} =
        this.mapHistory[this.mapHistory.length - 1];
      const hideArea = [...map.areaMap.keys()].find((obj) => !obj.visible);
      if (hideArea) {
        hideArea.show();
      }
      this.map = map;
      this.map.active();
      camera.lookAt(center);
      // this.world.speed =
      //   map.level === 'country' ? 0.5 : map.level === 'province' ? 0.15 : 0.06;
      Materials.changeLineAnimateParams(
        new THREE.Vector2(center.x, center.y),
        map.level
      );
      light.group.position.copy(center);
      await Promise.all([
        animation(camera.position, cameraPos),
        animation(control.target, center),
      ]);
      this.isAnimating = false;
    }
  }

  handleMouseMove(e: MouseEvent) {
    this.trackMousePos(e);
    this.map.handleMouseMove(this.mouse);
  }

  trackMousePos(e: MouseEvent) {
    const {mouse, container} = this;
    mouse.x =
      ((e.clientX - getElementViewLeft(container)) / container.clientWidth) *
        2 -
      1;
    mouse.y =
      -((e.clientY - getElementViewTop(container)) / container.clientHeight) *
        2 +
      1;
  }

  registerEvents() {
    this.addListener(
      this.container,
      'mousemove',
      this.handleMouseMove.bind(this)
    );
    const {camera} = this.pencil!;
    // let hide = false;
    // this?.addListener(this.container, 'wheel', () => {
    //   const level = this.mapHistory.length;
    //   const maxDis = level === 1 ? 1000 : level === 2 ? 100 : 50;
    //   const distance = camera!.position.distanceTo(
    //     this.mapHistory[level - 1].center
    //   );
    //   if (distance >= maxDis && !hide) {
    //     hide = true;
    //     drawController
    //       .getAllObject('Css2dBind')
    //       .filter((item) => item.key.includes('mapLabel'))
    //       .forEach((item) => item.hide());
    //   } else if (distance < maxDis && hide) {
    //     hide = false;
    //     drawController
    //       .getAllObject('Css2dBind')
    //       .filter((item) => item.key.includes('mapLabel'))
    //       .forEach((item) => item.show());
    //   }
    // });
    this.addListener(this.container, 'dblclick', () => {
      const area = this.map.pickArea(this.mouse);
      if (area && this.mapHistory.length < 3) {
        this.handleDrillDown(area);
      } else if (!area && this.mapHistory.length > 1) {
        this.handleBack();
      }
    });
    if (IS_DEV) {
      this.addListener(document.body, 'keydown', (e) => {
        if ((e as unknown as KeyboardEvent).key === 'Escape') {
          this.handleBack();
        }
      });
    }
  }

  dispose() {
    Materials.disposeAllMaterials();
    this.pencil!.dispose();

    this.removeAllListeners();

    this.pencil = undefined;
  }
}
