var verbs = ['get', 'post', 'head', 'delete', 'patch', 'put'];

function findHandler(matchers, method, url) {
  return matchers[method].find(function(matcher) {
    if (typeof matcher[0] === 'string') {
      return url === matcher[0];
    } else if (matcher[0] instanceof RegExp) {
      return matcher[0].test(url);
    }
  });
}

function adapter() {
  return function(resolve, reject, config) {
    var handler = findHandler(this.matchers, config.method, config.url);

    if (handler) {
      var response = (handler[1] instanceof Function)
        ? handler[1](config)
        : handler.slice(1);
      ((response[0] === 1223) || (response[0] >= 200 && response[0] < 300 ) ? resolve : reject)
      ({
        status: response[0],
        data: response[1],
        headers: response[2],
        config: config
      });
    } else {
      reject({ status: 404, config: config });
    }
  }.bind(this);
}

function MockAdapter(axiosInstance) {
  this.matchers = verbs.reduce(function(previousValue, currentValue) {
    previousValue[currentValue] = [];
    return previousValue;
  }, {});

  if (axiosInstance) {
    axiosInstance.defaults.adapter = adapter.call(this);
  }
}

MockAdapter.prototype.adapter = adapter;

MockAdapter.prototype.onAny = function(matcher) {
  var _this = this;
  return {
    reply: function reply(code, response, headers) {
      var handler = [matcher, code, response, headers];
      verbs.forEach(function(verb) {
        _this.matchers[verb].push(handler);
      });
    }
  };
};

verbs.forEach(function(method) {
  var methodName = 'on' + method.charAt(0).toUpperCase() + method.slice(1);
  MockAdapter.prototype[methodName] = function(matcher) {
    var _this = this;
    return {
      reply: function reply(code, response, headers) {
        _this.matchers[method].push([matcher, code, response, headers]);
      }
    };
  };
});

module.exports = MockAdapter;
