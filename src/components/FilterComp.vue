<template>
  <div class="map-filter">
    <div class="map-filter--dropdown">
      <a-cascader
        v-model:value="adcodes"
        :open="showCascader"
        expand-trigger="hover"
        :change-on-select="true"
        :options="options">
        <a
          class="ant-dropdown-link"
          @click.prevent
          @mouseover="showCascader = true">
          {{ filterStore.areaName ? filterStore.areaName : '全国' }}
          <CaretDownOutlined />
        </a>
      </a-cascader>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable import/no-extraneous-dependencies */
import {CaretDownOutlined} from '@ant-design/icons-vue';
import options from '@/assets/json/level.json';
import {storeToRefs} from 'pinia';
import {useMapStore} from '@/stores';

options.forEach((opt) => {
  if (opt.children) {
    if (opt.label.includes('市')) {
      opt.children = [];
    }
    opt.children.forEach((child) => {
      if (child.children) {
        child.children = [];
      }
    });
  }
});
const showCascader = ref(false);
const filterStore = useMapStore();
const {adcodes} = storeToRefs(filterStore);
const unwatch = watch(
  showCascader,
  (value) => {
    if (value) {
      const cascaderEl = document.querySelector(
        '.ant-cascader-dropdown'
      ) as HTMLElement;
      if (cascaderEl) {
        cascaderEl.addEventListener('mouseleave', () => {
          showCascader.value = false;
        });
        cascaderEl.addEventListener('click', () => {
          showCascader.value = false;
        });
        unwatch();
      }
    }
  },
  {
    flush: 'post',
  }
);
</script>

<style scoped lang="scss">
.map-filter {
  position: absolute;
  top: 50px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  padding-left: 40px;
  &--dropdown {
    &-title {
      display: flex;
      align-items: center;
      margin-left: 36px;
      .anticon {
        font-size: 14px;
        margin-left: 6px;
        color: #fff;
      }
    }
    :deep(.ant-dropdown-link) {
      max-width: 180px;
      color: #fff;
      font-size: 20px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      .anticon {
        vertical-align: middle;
      }
      &.cascader {
        position: relative;
        .expand {
          position: absolute;
          bottom: -100%;
          background-color: red;
          opacity: 0.1;
          width: 100px;
          height: 200px;
        }
      }
    }
  }
}
</style>
