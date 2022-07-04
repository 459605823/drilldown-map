/* eslint-disable import/prefer-default-export */
import {defineStore} from 'pinia';

export type userType = {
  token: string;
  name: string;
};

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    userData: {token: '', name: ''},
  }),

  actions: {
    setUserData(payload: userType) {
      this.userData = payload;
    },
  },
});
