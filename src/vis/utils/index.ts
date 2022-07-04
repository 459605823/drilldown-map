import * as THREE from 'three';
import gsap from 'gsap';

export const getImage = (...urls: string[]) => {
  if (urls.length > 1) {
    return urls.map((url) => require(`@vis/assets/images/${url}`));
  }
  return require(`@vis/assets/images/${urls[0]}`);
};
export const getTexture = (url: string) => {
  return new THREE.TextureLoader().load(getImage(url));
};
export const getTextureAsync = (url: string) => {
  return new THREE.TextureLoader().loadAsync(getImage(url));
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
