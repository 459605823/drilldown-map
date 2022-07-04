/* eslint-disable no-restricted-syntax */

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
import type {PlaneMap, Area, WorldBg} from './objects';
import {animation, fileLoader, getImage} from './utils';
import './styles/index.scss';

const IS_DEV = process.env.NODE_ENV === 'development';
const projection = geoEquirectangular()
  .center([103.5, 34.5])
  .scale(300)
  .translate([0, 0])
  .precision(0.1);

export default class extends Base {
  pencil?: Pencil;

  mouse = new THREE.Vector2();

  map?: PlaneMap;

  world?: WorldBg;

  mapHistory: {
    map: PlaneMap;
    cameraPos: THREE.Vector3;
    center: THREE.Vector3;
  }[] = [];

  adcodes: string[] = [];

  isAnimating = false;

  emit(eventName: string | symbol, args: any) {
    this.pencil!.event.emit(eventName, args);
  }

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
        css2DRenderer: true,
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
    this.world = await drawController.draw('WorldBg', {
      projection,
    });
    await drawController.draw('Light');
    await drawController.draw('Ocean');
    await drawController.draw('SpriteImage', {
      position: new THREE.Vector3(130, -50, 9),
      src: getImage('九段线.png'),
      scale: 0.12,
    });
    await Promise.all(drawController.objectsPromise);
    this.pencil?.start();
    this.registerEvents();
    if (IS_DEV) {
      // @ts-ignore
      window.setAdcode = this.setAdcode.bind(this);
    }
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
          map: this.map!,
          cameraPos: camera!.position.clone(),
          center: new THREE.Vector3(0),
        });
      }
    );
  }

  async drawLabels() {
    const map = this.map!;
    await Promise.all(
      [...map.areaMap.keys()].map((area) => {
        const {centroid, center, name} = area.userData;
        const [x, y] = projection(centroid || center) as [number, number];
        const el = document.createElement('p');
        el.className = 'map-label';
        el.textContent = name;
        return drawController.draw('Css2dBind', {
          position: new THREE.Vector3(
            x,
            -y,
            map.object3d.position.z + map.depth
          ),
          children: el,
          key: `mapLabel-${name}`,
        });
      })
    );
  }

  findArea(adcode: string) {
    const {areaMap} = this.map!;
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
    area = area || this.map!.pickArea(this.mouse);
    const light = drawController.getObject('Light');
    if (area && camera && control && !this.isAnimating) {
      const {adcode, level, name} = area.userData;
      if (level === 'district' || this.isAnimating) return;
      this.isAnimating = true;
      const res = await fileLoader(
        `${this.options.staticPath}/geojson/china/${level}/${adcode}.json`,
        () => console.log(`${name}的地图数据不存在`)
      );
      if (res) {
        this.adcodes.push(`${adcode}`);
        if (emitEvent) {
          this.emit('drillDown', {adcode, name, level});
        }
        area.hide();
        this.map!.deactive();
        const mapIndex = this.mapHistory.length;
        const {cameraPos} = this.mapHistory[mapIndex - 1];
        const geojson = JSON.parse(res as string);
        const map = await drawController.draw('PlaneMap', {
          projection,
          geojson,
          level,
        });
        map.object3d.position.setZ(this.map!.object3d.position.z);
        const {size: preSize} = this.map!.getSize();
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
          this.map!.object3d.position.z + (level === 'province' ? 1.5 : 0.4);
        const newCenter = new THREE.Vector3(cX, -cY, newZ);
        this.world!.speed =
          level === 'country' ? 0.5 : level === 'province' ? 0.15 : 0.06;
        Materials.changeLineAnimateParams(new THREE.Vector2(cX, -cY), level);
        light.group.position.copy(newCenter);
        drawController.erase('Css2dBind');
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
        this.drawLabels();
      }
    }
    this.isAnimating = false;
  }

  async handleBack() {
    const {camera, control} = this.pencil!;
    const light = drawController.getObject('Light');
    if (this.mapHistory.length > 1 && camera && control && !this.isAnimating) {
      this.isAnimating = true;
      this.mapHistory.pop();
      this.adcodes.pop();
      drawController.erase(this.map!);
      const {map, cameraPos, center} =
        this.mapHistory[this.mapHistory.length - 1];
      const hideArea = [...map.areaMap.keys()].find((obj) => !obj.visible);
      if (hideArea) {
        hideArea.show();
      }
      this.map = map;
      this.map.active();
      camera.lookAt(center);
      this.world!.speed =
        map.level === 'country' ? 0.5 : map.level === 'province' ? 0.15 : 0.06;
      Materials.changeLineAnimateParams(
        new THREE.Vector2(center.x, center.y),
        map.level
      );
      drawController.erase('Css2dBind');
      light.group.position.copy(center);
      await Promise.all([
        animation(camera.position, cameraPos),
        animation(control.target, center),
      ]);
      this.drawLabels();
      this.isAnimating = false;
    }
  }

  async setAdcode(adcodes: string[]) {
    const {adcodes: preAdcodes} = this;
    if (preAdcodes.length) {
      const [province, city] = adcodes;
      const [preProvince, preCity] = preAdcodes;
      if (province !== preProvince) {
        for await (const preAdcode of [...preAdcodes]) {
          await this.handleBack();
        }
        this.adcodes = [];
      } else {
        if (preCity && city !== preCity) {
          await this.handleBack();
        }
        if (city) {
          const area = this.findArea(city);
          if (area) {
            await this.handleDrillDown(area, false);
          }
        }
        return;
      }
    }
    if (adcodes.length) {
      for await (const adcode of adcodes) {
        const area = this.findArea(adcode);
        if (area) {
          await this.handleDrillDown(area, false);
        }
      }
    }
  }

  handleMouseMove(e: MouseEvent) {
    this.trackMousePos(e);
    this.map!.handleMouseMove(this.mouse);
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
    this.addListener(this.container, 'dblclick', () => {
      const area = this.map!.pickArea(this.mouse);
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
    this.map!.dispose();
    this.world!.dispose();

    this.removeAllListeners();
    this.map = undefined;
    this.world = undefined;
    this.pencil = undefined;
    this.mapHistory.length = 0;
  }
}
