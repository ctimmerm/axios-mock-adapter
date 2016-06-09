'use strict';

function find(array, predicate) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    var value = array[i];
    if (predicate(value)) return value;
  }
}

function findHandler(handlers, method, url) {
  return find(handlers[method.toLowerCase()], function(handler) {
    if (typeof handler[0] === 'string') {
      return url === handler[0];
    } else if (handler[0] instanceof RegExp) {
      return handler[0].test(url);
    }
  });
}

function purgeIfReplyOnce(mock, handler) {
  var index = mock.replyOnceHandlers.indexOf(handler);
  if (index > -1) {
    mock.replyOnceHandlers.splice(index, 1);

    Object.keys(mock.handlers).forEach(function(key) {
      index = mock.handlers[key].indexOf(handler);
      if (index > -1) {
        mock.handlers[key].splice(index, 1);
      }
    });
  }
}

function settle(resolve, reject, response) {
  if (response.config && response.config.validateStatus) {
    response.config.validateStatus(response.status)
      ? resolve(response)
      : reject(response);
    return;
  }

  // Support for axios < 0.11
  if (response.status >= 200 && response.status < 300) {
    resolve(response);
  } else {
    reject(response);
  }
}

module.exports = {
  findHandler: findHandler,
  purgeIfReplyOnce: purgeIfReplyOnce,
  settle: settle
};
