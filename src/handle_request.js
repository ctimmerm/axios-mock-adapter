var utils = require('./utils');

function handleRequest(resolve, reject, config) {
  var url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
  var handler = utils.findHandler(this.handlers, config.method, url, config.data);

  if (handler) {
    utils.purgeIfReplyOnce(this, handler);
    var response = handler[1] instanceof Function
      ? handler[1](config)
      : handler.slice(1);

    utils.settle(resolve, reject, {
      status: response[0],
      data: response[1],
      headers: response[2],
      config: config
    }, this.delayResponse);
  } else {
    utils.settle(resolve, reject, {
      status: 404,
      config: config
    }, this.delayResponse);
  }
}

module.exports = handleRequest;
