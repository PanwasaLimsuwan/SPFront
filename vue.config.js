module.exports = {
  transpileDependencies: [
    'es5-ext',
  ],
  configureWebpack: {
    resolve: {
      fallback: {
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
      },
    },
  },
  productionSourceMap: false,  // ปิดการสร้าง Source Maps ในโหมด production
};
