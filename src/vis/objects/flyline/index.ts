import * as THREE from 'three';
import {disposeMesh} from '@q/pencil/dist/utils';
import {BaseObject} from '@q/pencil';
import gsap from 'gsap';
import drawController from '..';

const getLineTexture = (
  length: number,
  lineColor: string,
  lightColor: string,
  isHalf: boolean
) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const gradient = ctx.createLinearGradient(0, 0, 256, 1);
  gradient.addColorStop(0, lineColor);
  gradient.addColorStop(isHalf ? length : length / 2, lightColor);
  gradient.addColorStop(length, lineColor);
  gradient.addColorStop(length, lineColor);
  gradient.addColorStop(1, lineColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

interface Options {
  nodes: THREE.Vector3[];
  duration: number;
  length: number;
  lineColor: string;
  lightColor: string;
  repeat: THREE.Vector2;
  lineWidth: number;
}
export default class Flyline extends BaseObject {
  options: Options = {
    nodes: [],
    duration: 2000,
    length: 0.4,
    lineColor: '#ff2900',
    lightColor: '#ffcb00',
    repeat: new THREE.Vector2(2, 0),
    lineWidth: 8,
  };

  constructor(options: Partial<Options>) {
    super();
    this.options = {
      ...this.options,
      ...options,
    };
  }

  async create() {
    const {nodes, duration, length, lightColor, lineColor, lineWidth, repeat} =
      this.options;
    this.createGroup();

    const {pencil} = this;
    if (!pencil.cacheController!.get('lineTexture')) {
      this.pencil.cacheController!.init('lineTexture');
      const map: THREE.Texture = getLineTexture(
        length,
        lineColor,
        lightColor,
        false
      );
      this.pencil.cacheController!.set('lineTexture', map);
    }
    const map = await pencil.cacheController!.get('lineTexture');
    await drawController.draw(
      'Line',
      {
        nodes,
        color: new THREE.Color('#fff'),
        map,
        useMap: 1,
        sizeAttenuation: 0,
        repeat,
        lineWidth,
        duration,
        visibility: 0,
        transparent: true,
        key: `${this.key}-flyline`,
      },
      this
    );
  }

  render() {
    const line = drawController.getObject('Line', {key: `${this.key}-flyline`});
    gsap.to(line.material.uniforms.visibility, {
      value: 1,
      duration: 0.5,
      onComplete: () => {
        line.animate();
      },
    });
  }

  dispose() {
    drawController.getObject('Line', {key: `${this.key}-flyline`})?.dispose();
    this.object3d.traverse((o) => {
      disposeMesh(o as THREE.Mesh);
    });
  }
}
