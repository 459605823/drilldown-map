<template>
  <div class="map-container"></div>
</template>

<script lang="ts" setup>
import {onMounted} from 'vue';
import China from '@vis/index';

let map: China;
onMounted(async () => {
  map = new China(document.querySelector('.map-container')!);
  await map.init();
  map.animateIn();
});
</script>

<style lang="scss" scoped>
.map-container {
  width: 100vw;
  height: 100vh;
}
</style>
