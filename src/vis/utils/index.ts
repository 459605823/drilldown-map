/* eslint-disable import/no-dynamic-require */

/* eslint-disable import/prefer-default-export */

import * as THREE from 'three';
import gsap from 'gsap';

export const getImage = (...urls: string[]) => {
  console.log(urls);
  // if (urls.length > 1) {
  //   return urls.map((url) => require(`@vis/assets/images/${url}`));
  // }
  // if (urls[0]) {
  //   return require(`@vis/assets/images/${urls[0]}`);
  // }
};
export const getTexture = (url: string) => {
  return new THREE.TextureLoader().load(url);
};
export const getTextureAsync = (url: string) => {
  return new THREE.TextureLoader().loadAsync(url);
};

export const fileLoader = (url: string, onError?: () => void) =>
  new Promise((resolve) =>
    new THREE.FileLoader().load(url, resolve, () => {}, onError)
  );

export const animation = (
  source: any,
  target: any,
  duration = 1,
  onUpdate = () => {},
  onComplete = () => {},
  ease: gsap.EaseFunction | string = ''
) =>
  new Promise<void>((resolve) =>
    gsap.to(source, {
      ...target,
      duration,
      ease,
      onUpdate,
      onComplete: () => {
        onComplete?.();
        resolve();
      },
    })
  );
