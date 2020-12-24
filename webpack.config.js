module.exports = function (env, argv) {
  return {
    output: {
      library: "AxiosMockAdapter",
      libraryTarget: "umd",
      filename:
        argv.mode === "production"
          ? "axios-mock-adapter.min.js"
          : "axios-mock-adapter.js",
    },
    externals: {
      axios: "axios",
    },
    plugins: [],
  };
};
