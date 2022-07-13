/* eslint-disable import/prefer-default-export */
import {defineStore} from 'pinia';
import AreaLevel from '@/assets/json/level.json';

interface mapState {
  adcodes: string[];
}

export const useMapStore = defineStore({
  id: 'user',
  state: () =>
    ({
      adcodes: ['1000000'],
    } as mapState),
  getters: {
    areaName: (state) => {
      const [provinceAdcode, cityAdcode] = state.adcodes;
      const province = AreaLevel.find((item) => item.value === provinceAdcode);
      if (cityAdcode && province?.children) {
        return province.children.find((child) => child.value === cityAdcode)
          ?.label;
      }
      return province?.label;
    },
  },
});
