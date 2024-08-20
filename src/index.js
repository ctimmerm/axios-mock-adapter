"use strict";
const handleRequest = require("./handle_request");
const utils = require("./utils");

const VERBS = [
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

function getVerbArray() {
  const arr = [];
  VERBS.forEach(function (verb) {
    Object.defineProperty(arr, verb, {
      get () {
        return arr.filter(function (h) {
          return !h.method || h.method === verb;
        });
      },
    });
  });
  return arr;
}

class AxiosMockAdapter {
  constructor (axiosInstance, options = {}) {
    this.reset();

    if (axiosInstance) {
      this.axiosInstance = axiosInstance;
      // Clone the axios instance to remove interceptors
      // this is used for the passThrough mode with axios > 1.2
      this.axiosInstanceWithoutInterceptors = axiosInstance.create
        ? axiosInstance.create()
        : undefined;

      this.originalAdapter = axiosInstance.defaults.adapter;
      this.delayResponse = options.delayResponse > 0 ? options.delayResponse : null;
      this.onNoMatch = options.onNoMatch || null;
      axiosInstance.defaults.adapter = this.adapter();
    } else {
      throw new Error("Please provide an instance of axios to mock");
    }
  }

  adapter () {
    return (config) => handleRequest(this, config);
  }

  restore () {
    if (!this.axiosInstance) return;
    this.axiosInstance.defaults.adapter = this.originalAdapter;
    this.axiosInstance = undefined;
  }

  reset () {
    this.resetHandlers();
    this.resetHistory();
  }

  resetHandlers () {
    if (this.handlers) this.handlers.length = 0;
    else this.handlers = getVerbArray();
  }

  resetHistory () {
    if (this.history) this.history.length = 0;
    else this.history = getVerbArray();
  }
}

const methodsWithConfigsAsSecondArg = ["any", "get", "delete", "head", "options"];
function convertDataAndConfigToConfig (method, data, config) {
  if (methodsWithConfigsAsSecondArg.includes(method)) {
    return validateconfig(method, data || {});
  } else {
    return validateconfig(method, Object.assign({}, config, { data: data }));
  }
}

const allowedConfigProperties = ["headers", "params", "data"];
function validateconfig (method, config) {
  for (const key in config) {
    if (!allowedConfigProperties.includes(key)) {
      throw new Error(
        `Invalid config property ${
        JSON.stringify(key)
        } provided to ${
        toMethodName(method)
        }. Config: ${
        JSON.stringify(config)}`
      );
    }
  }

  return config;
}

function toMethodName (method) {
  return `on${method.charAt(0).toUpperCase()}${method.slice(1)}`;
}

VERBS.concat("any").forEach(function (method) {
  AxiosMockAdapter.prototype[toMethodName(method)] = function (matcher, data, config) {
    const self = this;
    let delay;
    matcher = matcher === undefined ? /.*/ : matcher;

    const paramsAndBody = convertDataAndConfigToConfig(method, data, config);

    function reply (code, response, headers) {
      const handler = {
        url: matcher,
        method: method === "any" ? undefined : method,
        params: paramsAndBody.params,
        data: paramsAndBody.data,
        headers: paramsAndBody.headers,
        replyOnce: false,
        delay,
        response: typeof code === "function" ? code : [
          code,
          response,
          headers
        ]
      };
      addHandler(method, self.handlers, handler);
      return self;
    }

    function withDelayInMs (_delay) {
      delay = _delay;
      const respond = requestApi.reply.bind(requestApi);
      Object.assign(respond, requestApi);
      return respond;
    }

    function replyOnce (code, response, headers) {
      const handler = {
        url: matcher,
        method: method === "any" ? undefined : method,
        params: paramsAndBody.params,
        data: paramsAndBody.data,
        headers: paramsAndBody.headers,
        replyOnce: true,
        delay: delay,
        response: typeof code === "function" ? code : [
          code,
          response,
          headers
        ]
      };
      addHandler(method, self.handlers, handler);
      return self;
    }

    const requestApi = {
      reply,
      replyOnce,
      withDelayInMs,
      passThrough () {
        const handler = {
          passThrough: true,
          method: method === "any" ? undefined : method,
          url: matcher,
          params: paramsAndBody.params,
          data: paramsAndBody.data,
          headers: paramsAndBody.headers
        };
        addHandler(method, self.handlers, handler);
        return self;
      },
      abortRequest () {
        return reply(async function (config) {
          throw utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
        });
      },
      abortRequestOnce () {
        return replyOnce(async function (config) {
          throw utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
        });
      },

      networkError () {
        return reply(async function (config) {
          throw utils.createAxiosError("Network Error", config);
        });
      },

      networkErrorOnce () {
        return replyOnce(async function (config) {
          throw utils.createAxiosError("Network Error", config);
        });
      },

      timeout () {
        return reply(async function (config) {
          throw utils.createAxiosError(
            config.timeoutErrorMessage ||
              `timeout of ${config.timeout  }ms exceeded`,
            config,
            undefined,
            config.transitional && config.transitional.clarifyTimeoutError
              ? "ETIMEDOUT"
              : "ECONNABORTED"
          );
        });
      },

      timeoutOnce () {
        return replyOnce(async function (config) {
          throw utils.createAxiosError(
            config.timeoutErrorMessage ||
              `timeout of ${config.timeout  }ms exceeded`,
            config,
            undefined,
            config.transitional && config.transitional.clarifyTimeoutError
              ? "ETIMEDOUT"
              : "ECONNABORTED"
          );
        });
      },
    };

    return requestApi;
  };
});

function findInHandlers (handlers, handler) {
  let index = -1;
  for (let i = 0; i < handlers.length; i += 1) {
    const item = handlers[i];
    const comparePaths =
      item.url instanceof RegExp && handler.url instanceof RegExp
        ? String(item.url) === String(handler.url)
        : item.url === handler.url;

    const isSame =
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

function addHandler (method, handlers, handler) {
  if (method === "any") {
    handlers.push(handler);
  } else {
    const indexOfExistingHandler = findInHandlers(handlers, handler);
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

module.exports = AxiosMockAdapter;
module.exports.default = AxiosMockAdapter;
