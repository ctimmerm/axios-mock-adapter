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

mock.onGet('/users').reply(200, {
  users: [
    { id: 1, name: 'John Smith' }
  ]
});

axios.get('/users')
  .then(function(response) {
    console.log(response.data);
  });
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

### API

**mock.onGet(url)**

**mock.onHead(url)**

**mock.onPost(url)**

**mock.onPut(url)**

**mock.onPatch(url)**

**mock.onDelete(url)**

`url` can either be a string or a regex.

#### Sending a reply

**reply(status, data, headers)**

Or you can pass a function that returns an array in the shape of:
[status, data, headers]

**reply(function)**

