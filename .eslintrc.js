const path = require('path');

module.exports = {
  root: true,
  settings: {
    'import/resolver': {
      webpack: {
        config: path.resolve(
          __dirname,
          './node_modules/vue-bundler/config/webpack.config.js'
        ),
      },
    },
  },
  extends: ['bundler', './.eslintrc-auto-import.json'],
};
