module.exports = () => {
  return {
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
