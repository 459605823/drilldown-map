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
    coords.forEach((coord) => {
      const pts = this.getAreaPoints(coord);
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
