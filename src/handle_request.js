"use strict";
const utils = require("./utils");

function passThroughRequest (mockAdapter, config) {
  // Axios v0.17 mutates the url to include the baseURL for non hostnames
  // but does not remove the baseURL from the config
  let baseURL = config.baseURL;
  if (baseURL && !/^https?:/.test(baseURL)) {
    baseURL = undefined;
  }

  // Axios pre 1.2
  if (typeof mockAdapter.originalAdapter === "function") {
    return mockAdapter.originalAdapter(config);
  }

  return mockAdapter.axiosInstanceWithoutInterceptors(Object.assign({}, config, {
    baseURL,
    //  Use the original adapter, not the mock adapter
    adapter: mockAdapter.originalAdapter,
    // The request transformation runs on the original axios handler already
    transformRequest: [],
    transformResponse: []
  }));
}

async function handleRequest(mockAdapter, config) {
  let url = config.url || "";
  // TODO we're not hitting this `if` in any of the tests, investigate
  if (
    config.baseURL &&
    url.substr(0, config.baseURL.length) === config.baseURL
  ) {
    url = url.slice(config.baseURL.length);
  }

  delete config.adapter;
  mockAdapter.history.push(config);

  const handler = utils.findHandler(
    mockAdapter.handlers,
    config.method,
    url,
    config.data,
    config.params,
    (config.headers && config.headers.constructor.name === "AxiosHeaders")
      ? Object.assign({}, config.headers.toJSON())
      : config.headers,
    config.baseURL
  );

  if (handler) {
    if (handler.replyOnce) {
      utils.purgeIfReplyOnce(mockAdapter, handler);
    }

    if (handler.passThrough) {
      // passThrough handler
      return passThroughRequest(mockAdapter, config);
    } else {
      return utils.settle(
        config,
        handler.response,
        getEffectiveDelay(mockAdapter, handler)
      );
    }
  } else {
    // handler not found
    switch (mockAdapter.onNoMatch) {
      case "passthrough":
        return passThroughRequest(mockAdapter, config);
      case "throwException":
        throw utils.createCouldNotFindMockError(config);
      default:
        return utils.settle(
          config,
          { status: 404 },
          mockAdapter.delayResponse
        );
    }
  }
}

function getEffectiveDelay(adapter, handler) {
  return typeof handler.delay === "number" ? handler.delay : adapter.delayResponse;
}

module.exports = handleRequest;
