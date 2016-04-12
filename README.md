# axios-mock-adapter

[![Build Status](https://travis-ci.org/ctimmerm/axios-mock-adapter.svg?branch=master)](https://travis-ci.org/ctimmerm/axios-mock-adapter)
[![devDependency Status](https://david-dm.org/ctimmerm/axios-mock-adapter/dev-status.svg)](https://david-dm.org/ctimmerm/axios-mock-adapter#info=devDependencies)

Axios adapter that allows to easily mock requests

## Installation

Using npm:

`$ npm install axios-mock-adapter`

## Usage

### Node.js require
```js
var axios = require('axios'),
MockAdapter = require('axios-mock-adapter');

axios.defaults.adapter = new MockAdapter().adapter();

```

### AMD
```js
define(['axios', 'axios-mock-adapter'], function(axios, MockAdapter) {

  axios.defaults.adapter = new MockAdapter().adapter();

});
```

### Browser globals
```js
axios.defaults.adapter = new AxiosMockAdapter().adapter();
```

## Example

Mocking a `GET` request

```js
var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);
// which is the same as:
//   var mock = new MockAdapter();
//   axios.defaults.adapter = mock.adapter();

// Mock any GET request to /users
// arguments for reply are (status, data, headers)
mock.onGet('/users').reply(200, {
  users: [
    { id: 1, name: 'John Smith' }
  ]
});

axios.get('/users')
  .then(function(response) {
    console.log(response.data);
  });

// If a request is made for a URL that is not handled in the mock adapter,
// the promise will reject with a response that has status 404.
```

Passing a function to `reply`

```js
mock.onGet('/users').reply(function(config) {
  // `config` is the axios config and contains things like the url

  // return an array in the form of [status, data, headers]
  return [200, {
    users: [
      { id: 1, name: 'John Smith' }
    ]
  }];
});
```

Using a regex

```js
mock.onGet(/\/users\/\d+/).reply(function(config) {
  // the actual id can be grabbed from config.url

  return [200, {}];
});
```

Mocking any request to a given url

```js
// mocks GET, POST, ... requests to /foo
mock.onAny('/foo').reply(200);
```

`.onAny` can be useful when you want to test for a specific order of requests

```js
// Expected order of requests:
const responses = [
  ['GET',  '/foo', 200, { foo: 'bar' }],
  ['POST', '/bar', 200],
  ['PUT',  '/baz', 200]
];

mock.onAny(/.*/).reply(config => {
  const [method, url, ...response] = responses.shift();
  if (config.url === url && config.method.toUpperCase() === method) return response;
  // Unexpected request, error out
  return [500, {}];
});
```
