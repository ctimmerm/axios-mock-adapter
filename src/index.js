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

function getVerbArray() {
  var arr = [];
  VERBS.forEach(function (verb) {
    Object.defineProperty(arr, verb, {
      get: function () {
        return arr.filter(function (h) {
          return !h.method || h.method === verb;
        });
      },
    });
  });
  return arr;
}

function MockAdapter(axiosInstance, options) {
  this.reset();

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

MockAdapter.prototype.reset = function reset() {
  this.resetHandlers();
  this.resetHistory();
};

MockAdapter.prototype.resetHandlers = function resetHandlers() {
  if (this.handlers) this.handlers.length = 0;
  else this.handlers = getVerbArray();
};

MockAdapter.prototype.resetHistory = function resetHistory() {
  if (this.history) this.history.length = 0;
  else this.history = getVerbArray();
};

var methodsWithConfigsAsSecondArg = ["any", "get", "delete", "head", "options"];
function convertDataAndConfigToConfig (method, data, config) {
  if (methodsWithConfigsAsSecondArg.includes(method)) {
    return validateconfig(method, data || {});
  } else {
    return validateconfig(method, Object.assign({}, config, { data: data }));
  }
}

var allowedConfigProperties = ['headers', 'params', 'data'];
function validateconfig (method, config) {
  for (var key in config) {
    if (!allowedConfigProperties.includes(key)) {
      throw new Error(
        'Invalid config property ' +
        JSON.stringify(key) +
        ' provided to ' +
        toMethodName(method) +
        '. Config: ' +
        JSON.stringify(config)
      );
    }
  }

  return config;
}

function toMethodName (method) {
  return "on" + method.charAt(0).toUpperCase() + method.slice(1);
}

VERBS.concat("any").forEach(function (method) {
  MockAdapter.prototype[toMethodName(method)] = function (matcher, data, config) {
    var _this = this;
    var matcher = matcher === undefined ? /.*/ : matcher;
    var delay;
    var paramsAndBody = convertDataAndConfigToConfig(method, data, config);

    function reply(code, response, headers) {
      var handler = {
        url: matcher,
        method: method === 'any' ? undefined : method,
        params: paramsAndBody.params,
        data: paramsAndBody.data,
        headers: paramsAndBody.headers,
        replyOnce: false,
        delay: delay,
        response: typeof code === 'function' ? code : [
          code,
          response,
          headers
        ]
      };
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    function withDelayInMs(_delay) {
      delay = _delay;
      var respond = requestApi.reply.bind(requestApi);
      Object.assign(respond, requestApi);
      return respond;
    }

    function replyOnce(code, response, headers) {
      var handler = {
        url: matcher,
        method: method === 'any' ? undefined : method,
        params: paramsAndBody.params,
        data: paramsAndBody.data,
        headers: paramsAndBody.headers,
        replyOnce: true,
        delay: delay,
        response: typeof code === 'function' ? code : [
          code,
          response,
          headers
        ]
      };
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    var requestApi = {
      reply: reply,

      replyOnce: replyOnce,

      withDelayInMs: withDelayInMs,

      passThrough: function passThrough() {
        var handler = {
          passThrough: true,
          method: method === 'any' ? undefined : method,
          url: matcher,
          params: paramsAndBody.params,
          data: paramsAndBody.data,
          headers: paramsAndBody.headers
        };
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
            config.transitional && config.transitional.clarifyTimeoutError
              ? "ETIMEDOUT"
              : "ECONNABORTED"
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
            config.transitional && config.transitional.clarifyTimeoutError
              ? "ETIMEDOUT"
              : "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },
    };

    return requestApi;
  };
});

function findInHandlers(method, handlers, handler) {
  var index = -1;
  for (var i = 0; i < handlers.length; i += 1) {
    var item = handlers[i];
    var comparePaths =
      item.url instanceof RegExp && handler.url instanceof RegExp
        ? String(item.url) === String(handler.url)
        : item.url === handler.url;

    var isSame =
      (!item.method || item.method === handler.method) &&
      comparePaths &&
      utils.isEqual(item.params, handler.params) &&
      utils.isEqual(item.data, handler.data) &&
      utils.isEqual(item.headers, handler.headers);
    if (isSame && !item.replyOnce) {
      index = i;
    }
  }
  return index;
}

function addHandler(method, handlers, handler) {
  if (method === "any") {
    handlers.push(handler);
  } else {
    var indexOfExistingHandler = findInHandlers(method, handlers, handler);
    // handler.replyOnce indicates that a handler only runs once.
    // It's supported to register muliple ones like that without
    // overwriting the previous one.
    if (indexOfExistingHandler > -1 && !handler.replyOnce) {
      handlers.splice(indexOfExistingHandler, 1, handler);
    } else {
      handlers.push(handler);
    }
  }
}

module.exports = MockAdapter;
module.exports.default = MockAdapter;
