'use strict';

var handleRequest = require('./handle_request');

var verbs = ['get', 'post', 'head', 'delete', 'patch', 'put'];

function adapter() {
  return function(config) {
    // axios >= 0.13.0 only passes the config and expects a promise to be
    // returned. axios < 0.13.0 passes (config, resolve, reject).
    if (arguments.length === 3) {
      handleRequest.call(this, arguments[0], arguments[1], arguments[2]);
    } else {
      return new Promise(function(resolve, reject) {
        handleRequest.call(this, resolve, reject, config);
      }.bind(this));
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

function MockAdapter(axiosInstance, options) {
  reset.call(this);

  if (axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    this.delayResponse = options && options.delayResponse > 0
      ? options.delayResponse
      : null;
    this.passThrough = options && options.passThrough;
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

MockAdapter.prototype.onAny = function onAny(matcher, body) {
  var _this = this;
  return {
    reply: function reply(code, response, headers) {
      var handler = [matcher, code, response, headers, body];
      verbs.forEach(function(verb) {
        _this.handlers[verb].push(handler);
      });
      return _this;
    },

    replyOnce: function replyOnce(code, response, headers) {
      var handler = [matcher, code, response, headers, body];
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
  MockAdapter.prototype[methodName] = function(matcher, body) {
    var _this = this;
    return {
      reply: function reply(code, response, headers) {
        var handler = [matcher, code, response, headers, body];
        _this.handlers[method].push(handler);
        return _this;
      },

      replyOnce: function replyOnce(code, response, headers) {
        var handler = [matcher, code, response, headers, body];
        _this.handlers[method].push(handler);
        _this.replyOnceHandlers.push(handler);
        return _this;
      }
    };
  };
});

module.exports = MockAdapter;
