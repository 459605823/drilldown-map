import * as THREE from 'three';
import {disposeMesh} from '@q/pencil/dist/utils';
import {mergeBufferGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils';
import {MeshLine, MeshLineMaterial} from '@q/pencil/dist/objects';
import type {geoProjection} from 'd3-geo';
import {hoverMat} from './commonMaterial';

export type IProps = {
  depth: number;
  coords: [number, number][][];
  projection: ReturnType<typeof geoProjection>;
  areaMaterials: THREE.Material[];
  lineMaterial: MeshLineMaterial;
  [key: string]: any;
};

const bbMap = new Map();

const uvGenerator = {
  generateTopUV(
    geometry: any,
    vertices: number[],
    indexA: number,
    indexB: number,
    indexC: number
  ) {
    const ax = vertices[indexA * 3];
    const ay = vertices[indexA * 3 + 1];
    const bx = vertices[indexB * 3];
    const by = vertices[indexB * 3 + 1];
    const cx = vertices[indexC * 3];
    const cy = vertices[indexC * 3 + 1];
    let bb;
    if (bbMap.has(geometry)) {
      bb = bbMap.get(geometry);
    } else {
      const points = geometry.parameters.shapes.getPoints() as THREE.Vector2[];
      bb = {
        minX: Math.min(
          ...points.map(({x}) => {
            return x;
          })
        ),
        maxX: Math.max(
          ...points.map(({x}) => {
            return x;
          })
        ),
        minY: Math.min(
          ...points.map(({y}) => {
            return y;
          })
        ),
        maxY: Math.max(
          ...points.map(({y}) => {
            return y;
          })
        ),
      };
      bbMap.set(geometry, bb);
    }

    const bbx = bb.maxX - bb.minX;
    const bby = bb.maxY - bb.minY;

    return [
      new THREE.Vector2((ax - bb.minX) / bbx, 1 - (ay - bb.minY) / bby),
      new THREE.Vector2((bx - bb.minX) / bbx, 1 - (by - bb.minY) / bby),
      new THREE.Vector2((cx - bb.minX) / bbx, 1 - (cy - bb.minY) / bby),
    ];
  },
  generateSideWallUV(
    geometry: any,
    vertices: number[],
    indexA: number,
    indexB: number,
    indexC: number,
    indexD: number
  ) {
    const ax = vertices[indexA * 3];
    const ay = vertices[indexA * 3 + 1];
    const az = vertices[indexA * 3 + 2];
    const bx = vertices[indexB * 3];
    const by = vertices[indexB * 3 + 1];
    const bz = vertices[indexB * 3 + 2];
    const cx = vertices[indexC * 3];
    const cy = vertices[indexC * 3 + 1];
    const cz = vertices[indexC * 3 + 2];
    const dx = vertices[indexD * 3];
    const dy = vertices[indexD * 3 + 1];
    const dz = vertices[indexD * 3 + 2];
    if (Math.abs(ay - by) < 0.01) {
      return [
        new THREE.Vector2(ax, 1 - az),
        new THREE.Vector2(bx, 1 - bz),
        new THREE.Vector2(cx, 1 - cz),
        new THREE.Vector2(dx, 1 - dz),
      ];
    }
    return [
      new THREE.Vector2(ay, 1 - az),
      new THREE.Vector2(by, 1 - bz),
      new THREE.Vector2(cy, 1 - cz),
      new THREE.Vector2(dy, 1 - dz),
    ];
  },
};

type Mesh = THREE.Mesh<THREE.ExtrudeBufferGeometry, THREE.Material[]>;

export default class Area extends THREE.Object3D {
  _mesh: THREE.Group | undefined;

  _line: THREE.Group | undefined;

  constructor(props: IProps) {
    super();
    this.type = 'Area';
    this.name = props.name || props.NAME;
    Object.assign(this.userData, props);
    const {coords} = props;
    const area = this.getArea(coords);
    if (area) {
      const {line, mesh} = area;
      if (line && mesh) {
        this._line = line;
        this._mesh = mesh;
        this.add(this._mesh);
        this.add(this._line);
      }
    }
  }

  getArea(coords: [number, number][][]) {
    if (!coords.length) return;
    const lineGroup = new THREE.Group();
    const meshGroup = new THREE.Group();
    const lineGeos: THREE.BufferGeometry[] = [];
    const {projection} = this.userData;
    const rotate = projection.rotate();
    const center = projection.center();
    coords.forEach((coord) => {
      const pts = this.getAreaPoints(coord);
      if (
        (this.userData.NAME_CN === '冰岛' ||
          this.userData.NAME_CN === '格陵兰') &&
        rotate[0]
      ) {
        const offset = projection([180 - rotate[0] + center[0], 0]);
        pts.forEach((pt) => {
          if (pt.x < 0) {
            pt.x += Math.abs(offset[0]) * 2;
          }
        });
      }
      lineGeos.push(this.getLine(pts, this.userData.depth));
      meshGroup.add(this.getMesh(pts, this.userData.depth));
    });
    const lineGeo = mergeBufferGeometries(lineGeos);
    const line = new THREE.Mesh(lineGeo, this.userData.lineMaterial);
    lineGroup.add(line);
    return {line: lineGroup, mesh: meshGroup};
  }

  getLine(pts: THREE.Vector2[], depth: number) {
    const vertices = [];
    for (let i = 0, l = pts.length; i < l; i += 1) {
      vertices.push(new THREE.Vector3(pts[i].x, pts[i].y, depth));
    }
    const line = new THREE.BufferGeometry().setFromPoints(vertices);
    const meshline = new MeshLine();
    meshline.setGeometry(line);
    return meshline.geometry;
  }

  getMesh(pts: THREE.Vector2[], depth: number) {
    const geometry = this.getExtrudeGeometry(pts, depth);
    return new THREE.Mesh(geometry, this.userData.areaMaterials);
  }

  getAreaPoints(coords: [number, number][]) {
    const {projection} = this.userData;
    return coords.map(([lng, lat]) => {
      const [x, y] = projection([lng, lat]) as [number, number];
      return new THREE.Vector2(x, -y);
    });
  }

  getExtrudeGeometry(pts: THREE.Vector2[], depth: number) {
    return new THREE.ExtrudeBufferGeometry(new THREE.Shape(pts), {
      depth,
      bevelEnabled: false,
      UVGenerator: uvGenerator,
    });
  }

  get mesh() {
    return this._mesh;
  }

  get line() {
    return this._line;
  }

  hide() {
    this.visible = false;
    if (this.mesh) {
      this.mesh.visible = false;
    }
    if (this.line) {
      this.line.visible = false;
    }
  }

  show() {
    this.visible = true;
    if (this.mesh) {
      this.mesh.visible = true;
    }
    if (this.line) {
      this.line.visible = true;
    }
  }

  onmouseover() {
    this.mesh?.children.forEach((child) => {
      (child as Mesh).material = [hoverMat, hoverMat];
    });
  }

  onmouseout() {
    this.mesh?.children.forEach((child) => {
      (child as Mesh).material = this.userData.areaMaterials;
    });
  }

  dispose() {
    this.mesh?.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });
    this.line?.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        disposeMesh(child);
      }
    });
    this._mesh = undefined;
    this._line = undefined;
    this.userData = {};
  }
}
