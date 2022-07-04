import '@/styles/basic.scss';
import fetch from '@/api/index';
import {createApp} from 'vue';

import router from '@/router';
import {createPinia} from 'pinia';

import App from '@/App.vue';

fetch.mock(false);

createApp(App).use(createPinia()).use(router).mount('#root');
