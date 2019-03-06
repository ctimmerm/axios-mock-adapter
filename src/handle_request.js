'use strict';

var utils = require('./utils');

function makeResponse(result, config) {
  return {
    status: result[0],
    data: utils.isSimpleObject(result[1]) ? JSON.parse(JSON.stringify(result[1])) : result[1],
    headers: result[2],
    config: config
  };
}

function handleRequest(mockAdapter, resolve, reject, config) {
  var url = config.url;
  if (config.baseURL && config.url.substr(0, config.baseURL.length) === config.baseURL) {
    url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
  }

  delete config.adapter;
  mockAdapter.history[config.method].push(config);

  var handler = utils.findHandler(
    mockAdapter.handlers,
    config.method,
    url,
    config.data,
    config.params,
    config.headers,
    config.baseURL
  );

  if (handler) {
    if (handler.length === 7) {
      utils.purgeIfReplyOnce(mockAdapter, handler);
    }

    if (handler.length === 2) {
      // passThrough handler
      // tell axios to use the original adapter instead of our mock, fixes #35
      config.adapter = mockAdapter.originalAdapter;
      // don't use the transforms because they are called by axios, fixes #61
      // TODO: write a more elegant solution that isn't turning transforms off and on
      var transforms = utils.retrieveTransforms(mockAdapter.axiosInstance, config);
      mockAdapter.axiosInstance.request(config).then(resolve, reject);
      utils.injectTransforms(transforms, mockAdapter.axiosInstance, config);
    } else if (typeof handler[3] !== 'function') {
      utils.settle(
        resolve,
        reject,
        makeResponse(handler.slice(3), config),
        mockAdapter.delayResponse
      );
    } else {
      var result = handler[3](config);
      // TODO throw a sane exception when return value is incorrect
      if (typeof result.then !== 'function') {
        utils.settle(resolve, reject, makeResponse(result, config), mockAdapter.delayResponse);
      } else {
        result.then(
          function(result) {
            if (result.config && result.status) {
              utils.settle(resolve, reject, makeResponse([result.status, result.data, result.headers], result.config), 0);
            } else {
              utils.settle(resolve, reject, makeResponse(result, config), mockAdapter.delayResponse);
            }
          },
          function(error) {
            if (mockAdapter.delayResponse > 0) {
              setTimeout(function() {
                reject(error);
              }, mockAdapter.delayResponse);
            } else {
              reject(error);
            }
          }
        );
      }
    }
  } else {
    // handler not found
    utils.settle(
      resolve,
      reject,
      {
        status: 404,
        config: config
      },
      mockAdapter.delayResponse
    );
  }
}

module.exports = handleRequest;
