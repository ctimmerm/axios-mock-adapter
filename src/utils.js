'use strict';

var axios = require('axios');
var deepEqual = require('deep-equal');

function isEqual(a, b) {
  return deepEqual(a, b, { strict: true });
}

// < 0.13.0 will not have default headers set on a custom instance
var rejectWithError = !!axios.create().defaults.headers;

function find(array, predicate) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    var value = array[i];
    if (predicate(value)) return value;
  }
}

function combineUrls(baseURL, url) {
  if (baseURL) {
    return baseURL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
  }

  return url;
}

function findHandler(handlers, method, url, body, parameters, headers, baseURL) {
  return find(handlers[method.toLowerCase()], function(handler) {
    if (typeof handler[0] === 'string') {
      return (isUrlMatching(url, handler[0]) || isUrlMatching(combineUrls(baseURL, url), handler[0])) && isBodyOrParametersMatching(method, body, parameters, handler[1])  && isRequestHeadersMatching(headers, handler[2]);
    } else if (handler[0] instanceof RegExp) {
      return (handler[0].test(url) || handler[0].test(combineUrls(baseURL, url))) && isBodyOrParametersMatching(method, body, parameters, handler[1]) && isRequestHeadersMatching(headers, handler[2]);
    }
  });
}

function isUrlMatching(url, required) {
  var noSlashUrl = url[0] === '/' ? url.substr(1) : url;
  var noSlashRequired = required[0] === '/' ? required.substr(1) : required;
  return (noSlashUrl === noSlashRequired);
}

function isRequestHeadersMatching(requestHeaders, required) {
  if (required === undefined) return true;
  return isEqual(requestHeaders, required);
}

function isBodyOrParametersMatching(method, body, parameters, required) {
  var allowedParamsMethods = ['delete', 'get', 'head', 'options'];
  if (allowedParamsMethods.indexOf(method.toLowerCase()) >= 0 ) {
    var params = required ? required.params : undefined;
    return isParametersMatching(parameters, params);
  } else {
    return isBodyMatching(body, required);
  }
}

function isParametersMatching(parameters, required) {
  if (required === undefined) return true;

  return isEqual(parameters, required);
}

function isBodyMatching(body, requiredBody) {
  if (requiredBody === undefined) {
    return true;
  }
  var parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (e) { }
  return parsedBody ? isEqual(parsedBody, requiredBody) : isEqual(body, requiredBody);
}

function purgeIfReplyOnce(mock, handler) {
  Object.keys(mock.handlers).forEach(function(key) {
    var index = mock.handlers[key].indexOf(handler);
    if (index > -1) {
      mock.handlers[key].splice(index, 1);
    }
  });
}

function settle(resolve, reject, response, delay) {
  if (delay > 0) {
    setTimeout(function() {
      settle(resolve, reject, response);
    }, delay);
    return;
  }

  if (response.config && response.config.validateStatus) {
    response.config.validateStatus(response.status)
      ? resolve(response)
      : reject(createErrorResponse(
        'Request failed with status code ' + response.status,
        response.config,
        response
      ));
    return;
  }

  // Support for axios < 0.11
  if (response.status >= 200 && response.status < 300) {
    resolve(response);
  } else {
    reject(response);
  }
}

function createErrorResponse(message, config, response) {
  // Support for axios < 0.13.0
  if (!rejectWithError) return response;

  var error = new Error(message);
  error.config = config;
  error.response = response;
  return error;
}

function isSimpleObject(value) {
  return value !== null && value !== undefined && value.toString() === '[object Object]';
}

module.exports = {
  find: find,
  findHandler: findHandler,
  isSimpleObject: isSimpleObject,
  purgeIfReplyOnce: purgeIfReplyOnce,
  settle: settle
};
