"use strict";

var axios = require("axios");
var isEqual = require("fast-deep-equal");
var isBuffer = require("is-buffer");
var toString = Object.prototype.toString;

// < 0.13.0 will not have default headers set on a custom instance
var rejectWithError = !!axios.create().defaults.headers;

function find(array, predicate) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    var value = array[i];
    if (predicate(value)) return value;
  }
}

function isFunction(val) {
  return toString.call(val) === "[object Function]";
}

function isObjectOrArray(val) {
  return val !== null && typeof val === "object";
}

function isStream(val) {
  return isObjectOrArray(val) && isFunction(val.pipe);
}

function isArrayBuffer(val) {
  return toString.call(val) === "[object ArrayBuffer]";
}

function combineUrls(baseURL, url) {
  if (baseURL) {
    return baseURL.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
  }

  return url;
}

function findHandler(
  handlers,
  method,
  url,
  body,
  parameters,
  headers,
  baseURL
) {
  return find(handlers[method.toLowerCase()], function (handler) {
    if (typeof handler[0] === "string") {
      return (
        (isUrlMatching(url, handler[0]) ||
          isUrlMatching(combineUrls(baseURL, url), handler[0])) &&
        isBodyOrParametersMatching(method, body, parameters, handler[1]) &&
        isObjectMatching(headers, handler[2])
      );
    } else if (handler[0] instanceof RegExp) {
      return (
        (handler[0].test(url) || handler[0].test(combineUrls(baseURL, url))) &&
        isBodyOrParametersMatching(method, body, parameters, handler[1]) &&
        isObjectMatching(headers, handler[2])
      );
    }
  });
}

function isUrlMatching(url, required) {
  var noSlashUrl = url[0] === "/" ? url.substr(1) : url;
  var noSlashRequired = required[0] === "/" ? required.substr(1) : required;
  return noSlashUrl === noSlashRequired;
}

function isBodyOrParametersMatching(method, body, parameters, required) {
  var allowedParamsMethods = ["delete", "get", "head", "options"];
  if (allowedParamsMethods.indexOf(method.toLowerCase()) >= 0) {
    var params = required ? required.params : undefined;
    return isObjectMatching(parameters, params);
  } else {
    return isBodyMatching(body, required);
  }
}

function isObjectMatching(actual, expected) {
  if (expected === undefined) return true;
  if (typeof expected.asymmetricMatch === "function") {
    return expected.asymmetricMatch(actual);
  }
  return isEqual(actual, expected);
}

function isBodyMatching(body, requiredBody) {
  if (requiredBody === undefined) {
    return true;
  }
  var parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (e) {}

  return isObjectMatching(parsedBody ? parsedBody : body, requiredBody);
}

function purgeIfReplyOnce(mock, handler) {
  Object.keys(mock.handlers).forEach(function (key) {
    var index = mock.handlers[key].indexOf(handler);
    if (index > -1) {
      mock.handlers[key].splice(index, 1);
    }
  });
}

function settle(resolve, reject, response, delay) {
  if (delay > 0) {
    setTimeout(function () {
      settle(resolve, reject, response);
    }, delay);
    return;
  }

  if (response.config && response.config.validateStatus) {
    response.config.validateStatus(response.status)
      ? resolve(response)
      : reject(
        createAxiosError(
          "Request failed with status code " + response.status,
          response.config,
          response
        )
      );
    return;
  }

  // Support for axios < 0.11
  if (response.status >= 200 && response.status < 300) {
    resolve(response);
  } else {
    reject(response);
  }
}

function createAxiosError(message, config, response, code) {
  // Support for axios < 0.13.0
  if (!rejectWithError) return response;

  var error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  if (response !== undefined) {
    error.response = response;
  }
  if (code !== undefined) {
    error.code = code;
  }
  return error;
}

module.exports = {
  find: find,
  findHandler: findHandler,
  purgeIfReplyOnce: purgeIfReplyOnce,
  settle: settle,
  isStream: isStream,
  isArrayBuffer: isArrayBuffer,
  isFunction: isFunction,
  isObjectOrArray: isObjectOrArray,
  isBuffer: isBuffer,
  isEqual: isEqual,
  createAxiosError: createAxiosError,
};
