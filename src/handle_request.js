"use strict";

var utils = require("./utils");

function transformRequest(data) {
  if (
    utils.isArrayBuffer(data) ||
    utils.isBuffer(data) ||
    utils.isStream(data)
  ) {
    return data;
  }

  // Object and Array: returns a deep copy
  if (utils.isObjectOrArray(data)) {
    return JSON.parse(JSON.stringify(data));
  }

  // for primitives like string, undefined, null, number
  return data;
}

function makeResponse(result, config) {
  return {
    status: result[0],
    data: transformRequest(result[1]),
    headers: result[2],
    config: config,
    request: {
      responseURL: config.url,
    },
  };
}

function handleRequest(mockAdapter, resolve, reject, config) {
  var url = config.url || "";
  // TODO we're not hitting this `if` in any of the tests, investigate
  if (
    config.baseURL &&
    url.substr(0, config.baseURL.length) === config.baseURL
  ) {
    url = url.slice(config.baseURL.length);
  }

  delete config.adapter;
  mockAdapter.history[config.method].push(config);

  var handler = utils.findHandler(
    mockAdapter.handlers,
    config.method,
    url,
    config.data,
    config.params,
    config.headers,
    config.baseURL
  );

  if (handler) {
    if (handler.length === 7) {
      utils.purgeIfReplyOnce(mockAdapter, handler);
    }

    if (handler[0] instanceof RegExp) {
      config.urlParams = utils.getURLParams(handler[0], url, config.baseURL);
    }

    if (handler.length === 2) {
      // passThrough handler
      mockAdapter.originalAdapter(config).then(resolve, reject);
    } else if (typeof handler[3] !== "function") {
      utils.settle(
        resolve,
        reject,
        makeResponse(handler.slice(3), config),
        mockAdapter.delayResponse
      );
    } else {
      var result = handler[3](config);
      // TODO throw a sane exception when return value is incorrect
      if (typeof result.then !== "function") {
        utils.settle(
          resolve,
          reject,
          makeResponse(result, config),
          mockAdapter.delayResponse
        );
      } else {
        result.then(
          function (result) {
            if (result.config && result.status) {
              utils.settle(
                resolve,
                reject,
                makeResponse(
                  [result.status, result.data, result.headers],
                  result.config
                ),
                0
              );
            } else {
              utils.settle(
                resolve,
                reject,
                makeResponse(result, config),
                mockAdapter.delayResponse
              );
            }
          },
          function (error) {
            if (mockAdapter.delayResponse > 0) {
              setTimeout(function () {
                reject(error);
              }, mockAdapter.delayResponse);
            } else {
              reject(error);
            }
          }
        );
      }
    }
  } else {
    // handler not found
    switch (mockAdapter.onNoMatch) {
      case "passthrough":
        mockAdapter.originalAdapter(config).then(resolve, reject);
        break;
      case "throwException":
        throw utils.createCouldNotFindMockError(config);
      default:
        utils.settle(
          resolve,
          reject,
          {
            status: 404,
            config: config,
          },
          mockAdapter.delayResponse
        );
    }
  }
}

module.exports = handleRequest;
