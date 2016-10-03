var utils = require('./utils');

function makeResponse(result, config) {
  return {
    status: result[0],
    data: result[1],
    headers: result[2],
    config: config
  };
}

function handleRequest(mockAdapter, resolve, reject, config) {
  config.url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
  config.adapter = null;

  var handler = utils.findHandler(mockAdapter.handlers, config.method, config.url, config.data);

  if (handler) {
    utils.purgeIfReplyOnce(mockAdapter, handler);

    if (handler.length === 2) { // passThrough handler
      mockAdapter
        .axiosInstance
        .request(config)
        .then(resolve, reject);
    } else if (!(handler[2] instanceof Function)) {
      utils.settle(resolve, reject, makeResponse(handler.slice(2), config), mockAdapter.delayResponse);
    } else {
      var result = handler[2](config);
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
