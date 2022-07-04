declare module '*.vue' {
  import type {DefineComponent} from 'vue';

  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module '*.glsl' {
  export default string;
}

declare module '*.scss';
