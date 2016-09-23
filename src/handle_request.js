var utils = require('./utils');

function makeResponse(result, config) {
  return {
    status: result[0],
    data: result[1],
    headers: result[2],
    config: config
  };
}

function handleRequest(resolve, reject, config) {
  config.url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
  config.adapter = null;

  var handler = utils.findHandler(this.handlers, config.method, config.url, config.data);
  var _this = this;

  if (handler) {
    utils.purgeIfReplyOnce(this, handler);

    if (!(handler[1] instanceof Function)) {
      utils.settle(resolve, reject, makeResponse(handler.slice(1), config), this.delayResponse);
    } else {
      var result = handler[1](config);
      if (!(result.then instanceof Function)) {
        utils.settle(resolve, reject, makeResponse(result, config), this.delayResponse);
      } else {
        result.then(
          function(result) {
            utils.settle(resolve, reject, makeResponse(result, config), _this.delayResponse);
          },
          function(error) {
            if (_this.delayResponse > 0) {
              setTimeout(function() {
                reject(error);
              }, _this.delayResponse);
            } else {
              reject(error);
            }
          }
        );
      }
    }
  } else { // handler not found
    if (!this.passThrough) {
      utils.settle(resolve, reject, {
        status: 404,
        config: config
      }, this.delayResponse);
    } else {
      this
        .axiosInstance
        .request(config)
        .then(resolve, reject);
    }
  }
}

module.exports = handleRequest;
