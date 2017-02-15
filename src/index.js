'use strict';

var handleRequest = require('./handle_request');

var VERBS = ['get', 'post', 'head', 'delete', 'patch', 'put'];

function adapter() {
  return function(config) {
    var mockAdapter = this;
    // axios >= 0.13.0 only passes the config and expects a promise to be
    // returned. axios < 0.13.0 passes (config, resolve, reject).
    if (arguments.length === 3) {
      handleRequest(mockAdapter, arguments[0], arguments[1], arguments[2]);
    } else {
      return new Promise(function(resolve, reject) {
        handleRequest(mockAdapter, resolve, reject, config);
      });
    }
  }.bind(this);
}

function reset() {
  this.handlers = VERBS.reduce(function(accumulator, verb) {
    accumulator[verb] = [];
    return accumulator;
  }, {});
  this.replyOnceHandlers = [];
}

function MockAdapter(axiosInstance, options) {
  reset.call(this);

  if (axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    this.delayResponse = options && options.delayResponse > 0
      ? options.delayResponse
      : null;
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

VERBS.concat('any').forEach(function(method) {
  var methodName = 'on' + method.charAt(0).toUpperCase() + method.slice(1);
  MockAdapter.prototype[methodName] = function(matcher, body) {
    var _this = this;
    var matcher = matcher === undefined ?  /.*/ : matcher;
    return {
      reply: function reply(code, response, headers) {
        var handler = [matcher, body, code, response, headers];
        addHandler(method, _this.handlers, handler);
        return _this;
      },

      replyOnce: function replyOnce(code, response, headers) {
        var handler = [matcher, body, code, response, headers];
        addHandler(method, _this.handlers, handler);
        _this.replyOnceHandlers.push(handler);
        return _this;
      },

      passThrough: function passThrough() {
        var handler = [matcher, body];
        addHandler(method, _this.handlers, handler);
        return _this;
      }
    };
  };
});

function addHandler(method, handlers, handler) {
  if (method === 'any') {
    VERBS.forEach(function(verb) {
      handlers[verb].push(handler);
    });
  } else {
    handlers[method].push(handler);
  }
}

module.exports = MockAdapter;
