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
  if (config.baseURL && config.url.substr(0, config.baseURL.length) === config.baseURL) {
    config.url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
  }
  config.adapter = null;

  var handler = utils.findHandler(mockAdapter.handlers, config.method, config.url, config.data, config.params, config.headers);

  if (handler) {
    utils.purgeIfReplyOnce(mockAdapter, handler);

    if (handler.length === 2) { // passThrough handler
      // tell axios to use the original adapter instead of our mock, fixes #35
      config.adapter = mockAdapter.originalAdapter;
      mockAdapter
        .axiosInstance
        .request(config)
        .then(resolve, reject);
    } else if (!(handler[3] instanceof Function)) {
      utils.settle(resolve, reject, makeResponse(handler.slice(3), config), mockAdapter.delayResponse);
    } else {
      var result = handler[3](config);
      // TODO throw a sane exception when return value is incorrect
      if (!(result.then instanceof Function)) {
        utils.settle(resolve, reject, makeResponse(result, config), mockAdapter.delayResponse);
      } else {
        result.then(
          function(result) {
            utils.settle(resolve, reject, makeResponse(result, config), mockAdapter.delayResponse);
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
  } else { // handler not found
    utils.settle(resolve, reject, {
      status: 404,
      config: config
    }, mockAdapter.delayResponse);
  }
}

module.exports = handleRequest;
