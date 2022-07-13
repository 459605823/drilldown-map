import fetch from '@/api/index';
import {createApp} from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import '@/styles/basic.scss';

import router from '@/router';
import {createPinia} from 'pinia';

import App from '@/App.vue';

fetch.mock(false);

const app = createApp(App);
app.use(Antd);
app.use(createPinia()).use(router).mount('#root');
