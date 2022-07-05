export const px2vw = (px: number) => `${(px / 19.2).toFixed(1)}vw`;
export const px2vh = (px: number) => `${(px / 10.8).toFixed(1)}vh`;
export const realPx = (val: number, designWidth = 1920) => {
  return val * (document.documentElement.clientWidth / designWidth);
};
