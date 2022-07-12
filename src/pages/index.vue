<template>
  <div class="map-container">
    <div id="map-3d"></div>
    <Popwindow ref="tooltip" msg="dsada" @redirect="handleRedirect" />
  </div>
</template>

<script lang="ts" setup>
import China from '@vis/index';

let map: China | undefined;
const tooltip = ref();
const adcodes = shallowRef([]);
const handleRedirect = (msg: string) => {
  console.log(msg);
};
watch(adcodes, (newVal) => {
  map?.setAdcode(newVal);
});
onMounted(async () => {
  const dom = tooltip.value.$el;
  map = new China(document.querySelector('#map-3d')!);
  await map.init();
  await map.animateIn();
  map.drawLabels();
  map.drawFlylines(
    {coord: [129.36157, 36.027428], geo: '日本'},
    {coord: [120.109913, 29.181466], geo: '中国'}
  );
  map.on('adcodes', ({adcodes: newVal}) => {
    adcodes.value = newVal;
  });
  map.on('tooltip', ({pos, visible}) => {
    if (pos) {
      const {x, y} = pos;
      dom.style.setProperty('--tx', `${x}px`);
      dom.style.setProperty('--ty', `${y}px`);
    }
    dom.style.setProperty('--opacity', `${visible ? 1 : 0}`);
  });
});
onUnmounted(() => {
  map?.dispose();
  map = undefined;
});
</script>

<style lang="scss" scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  #map-3d {
    width: 100%;
    height: 100%;
  }
}
</style>
