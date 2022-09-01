/* eslint-disable no-restricted-syntax */

import Pencil from '@q/pencil';
import Base from '@/vis/Base';
import chinaGeojson from '@q/pencil/dist/geojson/china.json';
import * as THREE from 'three';
import {geoEquirectangular} from 'd3-geo';
import {center as getCenter} from '@turf/turf';
import drawController, {
  Materials,
  type PlaneMap,
  type Area,
  type WorldBg,
} from './objects';
import {animation, fileLoader, getImage} from './utils';
import style from './styles/index.module.scss';

const IS_DEV = process.env.NODE_ENV === 'development';
const projection = geoEquirectangular()
  .center([104.0, 34.5])
  .scale(300)
  .translate([0, 0])
  .precision(0.1);

// const projection = geoEquirectangular()
//   .center([30, 30])
//   .scale(150)
//   .translate([0, 0])
//   .rotate([-160, 0])
//   .precision(0.1);

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
          near: 1,
          far: 3000,
        },
        scene: {
          background: new THREE.Color('#001928'),
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
    control.zoomSpeed = 1;
    control.enableDamping = false;
    control.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    control.minDistance = 0;
    control.enableRotate = IS_DEV;
    control.maxDistance = 1000;
    camera.position.set(0, -1000, 600);
  }

  async init() {
    const map = await drawController.draw('PlaneMap', {
      projection,
      geojson: chinaGeojson as any,
      level: 'country',
      outline: true,
    });
    map.object3d.position.setZ(9);
    this.map = map;
    this.world = await drawController.draw('WorldBg', {
      projection,
    });
    await drawController.draw('Light');
    // await drawController.draw('Ocean');
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
        el.className = style['map-label'];
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

  async handleDrillDown(area?: Area | string) {
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
      if (this.map?.oldArea) {
        this.map.oldArea.onmouseout();
        this.map.oldArea = null;
      }
      const res = await fileLoader(
        `${this.options.staticPath}/geojson/${level}/${adcode}.json`,
        () => console.log(`${name}的地图数据不存在`)
      );
      if (res) {
        this.adcodes.push(`${adcode}`);
        area.hide();
        this.map!.deactive();
        const mapIndex = this.mapHistory.length;
        const {cameraPos} = this.mapHistory[mapIndex - 1];
        const geojson = JSON.parse(res as string);
        const map = await drawController.draw('PlaneMap', {
          projection,
          geojson,
          level,
          outline: true,
        });
        map.object3d.position.setZ(this.map!.object3d.position.z);
        const {size: preSize} = this.map!.getSize();
        const {size} = map.getSize();
        const scale =
          size.x / size.y < preSize.x / preSize.y
            ? size.y / preSize.y
            : size.x / preSize.x;
        const absoluteCenter = getCenter(geojson).geometry.coordinates;
        const [cX, cY] = projection(absoluteCenter as [number, number]) as [
          number,
          number
        ];
        // 向上浮起后的z值
        const newZ = this.map!.object3d.position.z + map.depth / 4 / mapIndex;
        const newCenter = new THREE.Vector3(cX, -cY, newZ + map.depth);
        this.world!.speed =
          level === 'country' ? 0.5 : level === 'province' ? 0.15 : 0.06;
        Materials.changeLineAnimateParams(new THREE.Vector2(cX, -cY), level);
        this.emit('tooltip', {visible: false});
        light.group.position.copy(newCenter);
        drawController.erase('Css2dBind');
        const dest = new THREE.Vector3().lerpVectors(
          cameraPos,
          newCenter,
          1 - scale
        );
        await Promise.all([
          animation(control.target, newCenter.setZ(newZ + map.depth / 2)),
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
      this.emit('tooltip', {visible: false});
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
            await this.handleDrillDown(area);
          }
        }
        return;
      }
    }
    if (adcodes.length) {
      for await (const adcode of adcodes) {
        const area = this.findArea(adcode);
        if (area) {
          await this.handleDrillDown(area);
        }
      }
    }
  }

  trackMousePos(e: MouseEvent) {
    const {mouse, container} = this;
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
  }

  handlePopWindow() {
    if (this.isAnimating) return;
    const map = this.map!;
    const area = map!.handleMouseMove(this.mouse);
    if (area && typeof area !== 'string') {
      const [x, y] = projection(
        area.userData.centroid || area.userData.center
      ) as [number, number];
      const pos = new THREE.Vector3(x, -y, map.object3d.position.z + map.depth);
      pos.project(this.pencil!.camera!);
      const {width, height} = this.pencil!.getSize();
      const tx = (pos.x * 0.5 + 0.5) * width;
      const ty = (pos.y * -0.5 + 0.5) * height;
      this.emit('tooltip', {pos: {x: tx, y: ty}, visible: true});
    } else if (area === 'out') {
      this.emit('tooltip', {visible: false});
    }
  }

  createFlyPath(v0: THREE.Vector3, v3: THREE.Vector3) {
    const {x: x1, y: y1} = v0;
    const {x: x2, y: y2} = v3;
    const distance = v0.distanceTo(v3);
    let h = 40;
    if (distance > 400) {
      h = distance / 2.5;
    }
    const v1 = new THREE.Vector3(
      x1 + (x2 - x1) * 0.25,
      y1 + (y2 - y1) * 0.25,
      h
    );
    const v2 = new THREE.Vector3(
      x1 + (x2 - x1) * 0.75,
      y1 + (y2 - y1) * 0.75,
      h
    );
    // 三维三次贝塞尔曲线（v0起点，v1第一个控制点，v2第二个控制点，v3终点）
    return new THREE.CubicBezierCurve3(v0, v1, v2, v3);
  }

  async drawFlylines(
    from: {coord: [number, number]; geo: string},
    to: {coord: [number, number]; geo: string}
  ) {
    const map = this.map!;
    const world = this.world!;
    let fromDepth = map.object3d.position.z + map.depth;
    let toDepth = map.object3d.position.z + map.depth;
    if (from.geo !== '中国') {
      const area = world.findArea(from.geo);
      if (area) {
        fromDepth = area.userData.depth;
      }
    }
    if (to.geo !== '中国') {
      const area = world.findArea(to.geo);
      if (area) {
        toDepth = area.userData.depth;
      }
    }
    const [x0, y0] = projection(from.coord) as [number, number];
    const v0 = new THREE.Vector3(x0, -y0, fromDepth);
    const [x3, y3] = projection(to.coord) as [number, number];
    const v3 = new THREE.Vector3(x3, -y3, toDepth);
    await drawController.draw('Flyline', {
      nodes: this.createFlyPath(v0, v3).getPoints(500),
    });
  }

  handleMouseMove(e: MouseEvent) {
    if (this.isAnimating) return;
    this.trackMousePos(e);
    this.handlePopWindow();
  }

  registerEvents() {
    this.addListener(
      this.container,
      'mousemove',
      this.handleMouseMove.bind(this)
    );
    this.addListener(this.container, 'click', () => {
      const area = this.map!.pickArea(this.mouse);
      if (area && this.mapHistory.length < 3) {
        this.emit('adcodes', {
          adcodes: [...this.adcodes, `${area.userData.adcode}`],
        });
      } else if (!area && this.mapHistory.length > 1) {
        const adcodes = [...this.adcodes];
        adcodes.pop();
        this.emit('adcodes', {adcodes});
      }
    });
    if (IS_DEV) {
      this.addListener(document.body, 'keydown', (e) => {
        if ((e as unknown as KeyboardEvent).key === 'Escape') {
          const adcodes = [...this.adcodes];
          adcodes.pop();
          this.emit('adcodes', {adcodes});
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
    this.adcodes.length = 0;
  }
}
