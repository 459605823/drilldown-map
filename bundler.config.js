/* eslint-disable import/no-unresolved */
const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');

module.exports = () => {
  return {
    output: {
      filename: 'index.js',
    },
    plugins: [
      AutoImport({
        imports: ['vue'],
        dts: true,
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
      }),
      Components({
        types: [],
        dts: true,
      }),
    ],
    postcss: {
      plugins: [
        // [
        //   'postcss-px2vwvh',
        //   {
        //     viewportWidth: 1920,
        //     viewportHeight: 1080,
        //     unitPrecision: 3,
        //     viewportUnit: 'vw',
        //     fontViewportUnit: 'vw',
        //     minPixelValue: 1,
        //     mediaQuery: false,
        //   },
        // ],
      ],
    },
    devServer: {},
  };
};
