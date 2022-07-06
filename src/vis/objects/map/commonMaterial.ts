import * as THREE from 'three';
import {MeshLineMaterial} from '@q/pencil/dist/objects';

export const hoverMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('red'),
});

export const topMat = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#01233c'),
  emissive: new THREE.Color('#09374e'),
  emissiveIntensity: 0.5,
  shininess: 50,
  transparent: true,
  opacity: 0.85,
});

export const sideMat = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#004078'),
  shininess: 80,
  transparent: true,
  opacity: 0.85,
});

export const lineMat = new MeshLineMaterial({
  lineWidth: 5,
  sizeAttenuation: 0,
  transparent: true,
  opacity: 1,
  resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  color: new THREE.Color('#e8fbff'),
});
lineMat.uniforms.lightColor.value = new THREE.Color('#00a2ff');

export const bgTopMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#082d4a'),
  transparent: false,
});

export const bgSideMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color('#0f314d'),
  metalness: 0.7,
  transparent: false,
});

export const bgLineMat = new MeshLineMaterial({
  lineWidth: 5,
  sizeAttenuation: 0,
  transparent: true,
  opacity: 1,
  resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  color: new THREE.Color('#2b6590'),
});
bgLineMat.uniforms.lightColor.value = new THREE.Color('#00a2ff');

const lineAnimateParams = {
  country: {
    speed: 0.3,
    size: 300,
  },
  province: {
    speed: 0.6,
    size: 40,
  },
  city: {
    speed: 0.7,
    size: 20,
  },
};

export const changeLineAnimateParams = (
  center: THREE.Vector2,
  level: keyof typeof lineAnimateParams
) => {
  lineMat.uniforms.time.value = 0;
  bgLineMat.uniforms.time.value = 0;
  lineMat.uniforms.uCenter.value = center;
  bgLineMat.uniforms.uCenter.value = center;
  const {size, speed} = lineAnimateParams[level];
  lineMat.uniforms.speed.value = speed;
  lineMat.uniforms.size.value = size;
  bgLineMat.uniforms.speed.value = speed;
  bgLineMat.uniforms.size.value = size;
};

export const disposeAllMaterials = () => {
  topMat.dispose();
  sideMat.dispose();
  lineMat.dispose();
  bgTopMat.dispose();
  bgSideMat.dispose();
  bgLineMat.dispose();
  hoverMat.dispose();
};
