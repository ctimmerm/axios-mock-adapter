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
      var handler = [matcher, paramsAndBody, paramsAndBody.headers, code, response, headers, false, delay];
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
      var handler = [matcher, paramsAndBody, paramsAndBody.headers, code, response, headers, true, delay];
      addHandler(method, _this.handlers, handler);
      return _this;
    }

    var requestApi = {
      reply: reply,

      replyOnce: replyOnce,

      withDelayInMs: withDelayInMs,

      passThrough: function passThrough() {
        var handler = [matcher, paramsAndBody];
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
  for (var i = 0; i < handlers[method].length; i += 1) {
    var item = handlers[method][i];
    var isReplyOnce = item[6] === true;
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
    // handler[6] !== true indicates that a handler only runs once.
    // It's supported to register muliple ones like that without
    // overwriting the previous one.
    if (indexOfExistingHandler > -1 && handler[6] !== true) {
      handlers[method].splice(indexOfExistingHandler, 1, handler);
    } else {
      handlers[method].push(handler);
    }
  }
}

module.exports = MockAdapter;
module.exports.default = MockAdapter;
