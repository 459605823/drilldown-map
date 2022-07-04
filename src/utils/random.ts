/**
 * 随机生成一个 0 到 1 之间的浮点数
 *
 * @returns 返回一个随机数
 */
export function getRandom(): number {
  const randomBuffer: Uint32Array = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);

  return randomBuffer[0] / (0xffffffff + 1);
}

/**
 * 生成一个随机整形数
 *
 * @param min 最小值
 * @param max 最大值
 * @returns 返回一个随机整形数
 */
export function getRandomIntInclusive(min = 0, max = 10): number {
  const minValue: number = Math.ceil(min);
  const maxValue: number = Math.floor(max);

  return Math.floor(getRandom() * (maxValue - minValue + 1)) + minValue;
}
