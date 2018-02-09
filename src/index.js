'use strict';

var handleRequest = require('./handle_request');

var VERBS = ['get', 'post', 'head', 'delete', 'patch', 'put', 'options'];

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
    this.delayResponse = options && options.delayResponse > 0 ? options.delayResponse : null;
    axiosInstance.defaults.adapter = this.adapter.call(this);
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
  MockAdapter.prototype[methodName] = function(matcher, body, requestHeaders) {
    var _this = this;
    var matcher = matcher === undefined ? /.*/ : matcher;

    function reply(code, response, headers) {
      var handler = [matcher, body, requestHeaders, code, response, headers];
      addHandler(method, _this.handlers, handler, _this.replyOnceHandlers);
      return _this;
    }

    return {
      reply: reply,

      replyOnce: function replyOnce(code, response, headers) {
        var handler = [matcher, body, requestHeaders, code, response, headers];
        addHandlerReplyOnce(method, _this.handlers, handler);
        _this.replyOnceHandlers.push(handler);
        return _this;
      },

      passThrough: function passThrough() {
        var handler = [matcher, body];
        addHandler(method, _this.handlers, handler);
        return _this;
      },

      networkError: function() {
        reply(function(config) {
          var error = new Error('Network Error');
          error.config = config;
          return Promise.reject(error);
        });
      },

      timeout: function() {
        reply(function(config) {
          var error = new Error('timeout of ' + config.timeout + 'ms exceeded');
          error.config = config;
          error.code = 'ECONNABORTED';
          return Promise.reject(error);
        });
      }
    };
  };
});

function findInHandler(method, handlers, handler) {
  var index = -1;
  for (var i = 0; i < handlers[method].length; i += 1) {
    var item = handlers[method][i];
    var isSame = (
      item[0] === handler[0] &&
      item[1] === handler[1] &&
      item[2] === handler[2]
    );

    if (isSame) {
      index =  i;
    }
  }
  return index;
}

function findInReplyOnceHandler(handler, replyOnceHandlers) {
  var index = -1;
  if (replyOnceHandlers && replyOnceHandlers.length) {
    for (var i = 0; i < replyOnceHandlers.length; i += 1) {
      var item = replyOnceHandlers[i];
      var isInReplyOnce = (
        item[0] === handler[0] &&
        item[1] === handler[1] &&
        item[2] === handler[2]
      );

      if (isInReplyOnce) {
        index = i;
      }
    }
  }
  return index;
}

function addHandlerReplyOnce(method, handlers, handler) {
  if (method === 'any') {
    VERBS.forEach(function(verb) {
      handlers[verb].push(handler);
    });
  } else {
    handlers[method].push(handler);
  }
}

function addHandler(method, handlers, handler, replyOnceHandlers) {
  if (method === 'any') {
    VERBS.forEach(function(verb) {
      handlers[verb].push(handler);
    });
  } else {
    var indexOfExistingHandler = findInHandler(method, handlers, handler);
    var indexOfExistingReplyOnceHandler = findInReplyOnceHandler(handler, replyOnceHandlers);
    if (indexOfExistingHandler > -1) {
      if (indexOfExistingReplyOnceHandler > -1 ) {
        handlers[method].push(handler);
      } else {
        handlers[method].splice(indexOfExistingHandler, 1, handler);
      }
    } else {
      handlers[method].push(handler);
    }
  }
}

module.exports = MockAdapter;
module.exports.default = MockAdapter;
