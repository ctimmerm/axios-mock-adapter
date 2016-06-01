'use strict';

var utils = require('./utils');

var verbs = ['get', 'post', 'head', 'delete', 'patch', 'put'];

function adapter() {
  return function(resolve, reject, config) {
    var url = config.url.slice(config.baseURL ? config.baseURL.length : 0);
    var handler = utils.findHandler(this.handlers, config.method, url);

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
      });
    } else {
      utils.settle(resolve, reject, { status: 404, config: config });
    }
  }.bind(this);
}

function reset() {
  this.handlers = verbs.reduce(function(accumulator, verb) {
    accumulator[verb] = [];
    return accumulator;
  }, {});
  this.replyOnceHandlers = [];
}

function MockAdapter(axiosInstance) {
  reset.call(this);

  if (axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    axiosInstance.defaults.adapter = adapter.call(this);
  }
}

MockAdapter.prototype.adapter = adapter;

MockAdapter.prototype.restore = function restore() {
  if (this.axiosInstance) {
    this.axiosInstance.defaults.adapter = this.originalAdapter;
  }
};

MockAdapter.prototype.reset = reset;

MockAdapter.prototype.onAny = function onAny(matcher) {
  var _this = this;
  return {
    reply: function reply(code, response, headers) {
      var handler = [matcher, code, response, headers];
      verbs.forEach(function(verb) {
        _this.handlers[verb].push(handler);
      });
      return _this;
    },

    replyOnce: function replyOnce(code, response, headers) {
      var handler = [matcher, code, response, headers];
      _this.replyOnceHandlers.push(handler);
      verbs.forEach(function(verb) {
        _this.handlers[verb].push(handler);
      });
      return _this;
    }
  };
};

verbs.forEach(function(method) {
  var methodName = 'on' + method.charAt(0).toUpperCase() + method.slice(1);
  MockAdapter.prototype[methodName] = function(matcher) {
    var _this = this;
    return {
      reply: function reply(code, response, headers) {
        var handler = [matcher, code, response, headers];
        _this.handlers[method].push(handler);
        return _this;
      },

      replyOnce: function replyOnce(code, response, headers) {
        var handler = [matcher, code, response, headers];
        _this.handlers[method].push(handler);
        _this.replyOnceHandlers.push(handler);
        return _this;
      }
    };
  };
});

module.exports = MockAdapter;
