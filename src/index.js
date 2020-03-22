"use strict";

var handleRequest = require("./handle_request");
var utils = require("./utils");

var VERBS = [
  "get",
  "post",
  "head",
  "delete",
  "patch",
  "put",
  "options",
  "list",
];

function adapter() {
  return function (config) {
    var mockAdapter = this;
    // axios >= 0.13.0 only passes the config and expects a promise to be
    // returned. axios < 0.13.0 passes (config, resolve, reject).
    if (arguments.length === 3) {
      handleRequest(mockAdapter, arguments[0], arguments[1], arguments[2]);
    } else {
      return new Promise(function (resolve, reject) {
        handleRequest(mockAdapter, resolve, reject, config);
      });
    }
  }.bind(this);
}

function getVerbObject() {
  return VERBS.reduce(function (accumulator, verb) {
    accumulator[verb] = [];
    return accumulator;
  }, {});
}

function reset() {
  resetHandlers.call(this);
  resetHistory.call(this);
}

function resetHandlers() {
  this.handlers = getVerbObject();
}

function resetHistory() {
  this.history = getVerbObject();
}

function MockAdapter(axiosInstance, options) {
  reset.call(this);

  // TODO throw error instead when no axios instance is provided
  if (axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    this.delayResponse =
      options && options.delayResponse > 0 ? options.delayResponse : null;
    this.onNoMatch = (options && options.onNoMatch) || null;
    axiosInstance.defaults.adapter = this.adapter.call(this);
  }
}

MockAdapter.prototype.adapter = adapter;

MockAdapter.prototype.restore = function restore() {
  if (this.axiosInstance) {
    this.axiosInstance.defaults.adapter = this.originalAdapter;
    this.axiosInstance = undefined;
  }
};

MockAdapter.prototype.reset = reset;
MockAdapter.prototype.resetHandlers = resetHandlers;
MockAdapter.prototype.resetHistory = resetHistory;

VERBS.concat("any").forEach(function (method) {
  var methodName = "on" + method.charAt(0).toUpperCase() + method.slice(1);
  MockAdapter.prototype[methodName] = function (matcher, body, requestHeaders) {
    var _this = this;
    var matcher = matcher === undefined ? /.*/ : matcher;

    function reply(code, response, headers) {
      var handler = [matcher, body, requestHeaders, code, response, headers];
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    function replyOnce(code, response, headers) {
      var handler = [
        matcher,
        body,
        requestHeaders,
        code,
        response,
        headers,
        true,
      ];
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    return {
      reply: reply,

      replyOnce: replyOnce,

      passThrough: function passThrough() {
        var handler = [matcher, body];
        addHandler(method, _this.handlers, handler);
        return _this;
      },

      abortRequest: function () {
        return reply(function (config) {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      abortRequestOnce: function () {
        return replyOnce(function (config) {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      networkError: function () {
        return reply(function (config) {
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      networkErrorOnce: function () {
        return replyOnce(function (config) {
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      timeout: function () {
        return reply(function (config) {
          var error = utils.createAxiosError(
            config.timeoutErrorMessage ||
              "timeout of " + config.timeout + "ms exceeded",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      timeoutOnce: function () {
        return replyOnce(function (config) {
          var error = utils.createAxiosError(
            config.timeoutErrorMessage ||
              "timeout of " + config.timeout + "ms exceeded",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },
    };
  };
});

function findInHandlers(method, handlers, handler) {
  var index = -1;
  for (var i = 0; i < handlers[method].length; i += 1) {
    var item = handlers[method][i];
    var isReplyOnce = item.length === 7;
    var comparePaths =
      item[0] instanceof RegExp && handler[0] instanceof RegExp
        ? String(item[0]) === String(handler[0])
        : item[0] === handler[0];
    var isSame =
      comparePaths &&
      utils.isEqual(item[1], handler[1]) &&
      utils.isEqual(item[2], handler[2]);
    if (isSame && !isReplyOnce) {
      index = i;
    }
  }
  return index;
}

function addHandler(method, handlers, handler) {
  if (method === "any") {
    VERBS.forEach(function (verb) {
      handlers[verb].push(handler);
    });
  } else {
    var indexOfExistingHandler = findInHandlers(method, handlers, handler);
    if (indexOfExistingHandler > -1 && handler.length < 7) {
      handlers[method].splice(indexOfExistingHandler, 1, handler);
    } else {
      handlers[method].push(handler);
    }
  }
}

module.exports = MockAdapter;
module.exports.default = MockAdapter;
