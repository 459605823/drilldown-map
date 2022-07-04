<template>
  <div class="popwindow">popwindow</div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.popwindow {
  --tx: 0px;
  --ty: 0px;
  --visible: hidden;
  position: absolute;
  left: 0;
  top: 0;
  width: 150px;
  height: 150px;
  background-color: aqua;
  color: red;
  transform: translate(var(--tx), var(--ty));
  visibility: var(--visible);
}
</style>
