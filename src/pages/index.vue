<template>
  <div class="map-container">
    <div id="map-3d"></div>
    <Popwindow ref="tooltip" />
  </div>
</template>

<script lang="ts" setup>
import China from '@vis/index';
import Popwindow from './popwindow.vue';

let map: China;
const tooltip = ref();
onMounted(async () => {
  const dom = tooltip.value.$el;
  map = new China(document.querySelector('#map-3d')!);
  await map.init();
  await map.animateIn();
  map.drawLabels();
  map.on('drillDown', ({adcode, name, level}) => {
    console.log(adcode, name, level);
  });
  map.on('tooltip', ({pos, visible}) => {
    console.log(pos, visible);
    if (pos) {
      const {x, y} = pos;
      dom.style.setProperty('--tx', `${x}px`);
      dom.style.setProperty('--ty', `${y}px`);
    }
    dom.style.setProperty('--visible', `${visible ? 'visible' : 'hidden'}`);
  });
});
</script>

<style lang="scss" scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  #map-3d {
    width: 100%;
    height: 100%;
  }
}
</style>
