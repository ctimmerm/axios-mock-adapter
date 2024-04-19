"use strict";

var axios = require("axios");
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
  "link",
  "unlink",
];

function adapter() {
  return function (config) {
    var mockAdapter = this;
    return new Promise(function (resolve, reject) {
      handleRequest(mockAdapter, resolve, reject, config);
    });
  }.bind(this);
}

function getVerbObject() {
  return VERBS.reduce(function (accumulator, verb) {
    accumulator[verb] = [];
    return accumulator;
  }, {});
}

function throwNetErrorFactory(code) {
  if (typeof code === 'string') {
    return function (config) {
      var url = { hostname: 'UNKNOWN', host: 'UNKNOWN' };
      try {
        url = new URL(config.url, config.baseURL);
      } catch (error) {}
      var error = undefined;
      switch (code) {
        case 'ENOTFOUND': {
          error = Object.assign(
            utils.createAxiosError('getaddrinfo ENOTFOUND ' + url.hostname, config, undefined, 'ENOTFOUND'),
            {
              syscall: 'getaddrinfo',
              hostname: url.hostname,
              errno: -3008,
            }
          );
        } break;

        case 'ECONNREFUSED': {
          error = Object.assign(
            utils.createAxiosError('connect ECONNREFUSED ' + url.host, config, undefined, 'ECONNREFUSED'),
            {
              syscall: 'connect',
              port: url.port ? parseInt(url.port, 10) : undefined,
              address: url.hostname,
              errno: -111
            }
          );
        } break;

        case 'ECONNRESET': {
          error = utils.createAxiosError("socket hang up", config, undefined, code);
        } break;

        case 'ECONNABORTED':
        case 'ETIMEDOUT': {
          error = Object.assign(
            utils.createAxiosError(
              config.timeoutErrorMessage ||
                "timeout of " + config.timeout + "ms exceeded",
              config,
              undefined,
              config.transitional && config.transitional.clarifyTimeoutError
                ? "ETIMEDOUT"
                : "ECONNABORTED"
            ),
            { name: axios.AxiosError.name }
          );
        } break;

        default: {
          error = utils.createAxiosError("Error " + code, config, undefined, code);
        } break;
      }
      return Promise.reject(error);
    };
  } else {
    return function (config) {
      return Promise.reject(utils.createAxiosError("Network Error", config));
    };
  }
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

  if (axiosInstance) {
    this.axiosInstance = axiosInstance;
    // Clone the axios instance to remove interceptors
    // this is used for the passThrough mode with axios > 1.2
    this.axiosInstanceWithoutInterceptors = axiosInstance.create
      ? axiosInstance.create()
      : undefined;

    this.originalAdapter = axiosInstance.defaults.adapter;
    this.delayResponse =
      options && options.delayResponse > 0 ? options.delayResponse : null;
    this.onNoMatch = (options && options.onNoMatch) || null;
    axiosInstance.defaults.adapter = this.adapter.call(this);
  } else {
    throw new Error("Please provide an instance of axios to mock");
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

    function replyWithDelay(delay, code, response, headers) {
      var handler = [matcher, body, requestHeaders, code, response, headers, false, delay];
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    function withDelayInMs(delay) {
      return function (code, response, headers) {
        replyWithDelay(delay, code, response, headers);
      };
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

      withDelayInMs: withDelayInMs,

      passThrough: function passThrough() {
        var handler = [matcher, body];
        addHandler(method, _this.handlers, handler);
        return _this;
      },

      abortRequest: function () {
        var throwNetError = throwNetErrorFactory('ECONNABORTED');
        return reply(function (config) {
          return throwNetError(Object.assign({ timeoutErrorMessage: 'Request aborted' }, config));
        });
      },

      abortRequestOnce: function () {
        var throwNetError = throwNetErrorFactory('ECONNABORTED');
        return replyOnce(function (config) {
          return throwNetError(Object.assign({ timeoutErrorMessage: 'Request aborted' }, config));
        });
      },

      networkError: function (code) {
        var throwNetError = throwNetErrorFactory(code);
        return reply(throwNetError);
      },

      networkErrorOnce: function (code) {
        var throwNetError = throwNetErrorFactory(code);
        return replyOnce(throwNetError);
      },

      timeout: function () {
        var throwNetError = throwNetErrorFactory('ETIMEDOUT');
        return reply(throwNetError);
      },

      timeoutOnce: function () {
        var throwNetError = throwNetErrorFactory('ETIMEDOUT');
        return replyOnce(throwNetError);
      }
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
