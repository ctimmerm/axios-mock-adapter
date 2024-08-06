"use strict";
const axios = require("axios");
const isEqual = require("fast-deep-equal");
const isBuffer = require("is-buffer");
const isBlob = require("./is_blob");
const toString = Object.prototype.toString;

function find(array, predicate) {
  const length = array.length;
  for (let i = 0; i < length; i++) {
    const value = array[i];
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
    return `${baseURL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
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
    let matchesUrl = false;
    if (typeof handler.url === "string") {
      matchesUrl  = isUrlMatching(url, handler.url) ||
        isUrlMatching(combineUrls(baseURL, url), handler.url);
    } else if (handler.url instanceof RegExp) {
      matchesUrl = handler.url.test(url) ||
        handler.url.test(combineUrls(baseURL, url));
    }

    return matchesUrl &&
      isBodyOrParametersMatching(body, parameters, handler) &&
      isObjectMatching(headers, handler.headers);
  });
}

function isUrlMatching(url, required) {
  const noSlashUrl = url[0] === "/" ? url.substr(1) : url;
  const noSlashRequired = required[0] === "/" ? required.substr(1) : required;
  return noSlashUrl === noSlashRequired;
}

function isBodyOrParametersMatching(body, parameters, required) {
  return isObjectMatching(parameters, required.params) &&
    isBodyMatching(body, required.data);
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
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (_e) {}

  return isObjectMatching(parsedBody ? parsedBody : body, requiredBody);
}

function purgeIfReplyOnce(mock, handler) {
  const index = mock.handlers.indexOf(handler);
  if (index > -1) {
    mock.handlers.splice(index, 1);
  }
}

function transformRequest(data) {
  if (
    isArrayBuffer(data) ||
    isBuffer(data) ||
    isStream(data) ||
    isBlob(data)
  ) {
    return data;
  }

  // Object and Array: returns a deep copy
  if (isObjectOrArray(data)) {
    return JSON.parse(JSON.stringify(data));
  }

  // for primitives like string, undefined, null, number
  return data;
}

async function makeResponse(result, config) {
  if (typeof result === "function") result = await result(config);

  const status = result.status || result[0];
  const data = transformRequest(result.data || result[1]);
  const headers = result.headers || result[2];
  if (result.config) config = result.config;

  return {
    status,
    data,
    headers,
    config,
    request: { responseURL: config.url }
  };
}

async function settle(config, response, delay) {
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

  const result = await makeResponse(response, config);

  if (
    !result.config.validateStatus ||
    result.config.validateStatus(result.status)
  ) {
    return result;
  } else {
    throw createAxiosError(
      `Request failed with status code ${result.status}`,
      result.config,
      result
    );
  }
}

function createAxiosError(message, config, response, code) {
  // axios v0.27.0+ defines AxiosError as constructor
  if (typeof axios.AxiosError === "function") {
    return axios.AxiosError.from(new Error(message), code, config, null, response);
  }

  // handling for axios v0.26.1 and below
  const error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  if (response !== undefined) {
    error.response = response;
  }
  if (code !== undefined) {
    error.code = code;
  }

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
    };
  };
  return error;
}

function createCouldNotFindMockError(config) {
  const message =
    `Could not find mock for: \n${
    JSON.stringify({
      method: config.method,
      url: config.url,
      params: config.params,
      headers: config.headers
    }, null, 2)}`;
  const error = new Error(message);
  error.isCouldNotFindMockError = true;
  error.url = config.url;
  error.method = config.method;
  return error;
}

module.exports = {
  find,
  findHandler,
  purgeIfReplyOnce,
  settle,
  isObjectOrArray,
  isBuffer,
  isBlob,
  isBodyOrParametersMatching,
  isEqual,
  createAxiosError,
  createCouldNotFindMockError,
};
