# axios-mock-adapter

[![Build Status](https://travis-ci.org/ctimmerm/axios-mock-adapter.svg?branch=master)](https://travis-ci.org/ctimmerm/axios-mock-adapter)
[![devDependency Status](https://david-dm.org/ctimmerm/axios-mock-adapter/dev-status.svg)](https://david-dm.org/ctimmerm/axios-mock-adapter#info=devDependencies)

Axios adapter that allows to easily mock requests

## Installation

Using npm:

`$ npm install axios-mock-adapter`

It's also available as a UMD build:

* https://npmcdn.com/axios-mock-adapter/dist/axios-mock-adapter.js
* https://npmcdn.com/axios-mock-adapter/dist/axios-mock-adapter.min.js

axios-mock-adapter works on Node as well as in a browser.

## Example

Mocking a `GET` request

```js
var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

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

To add a delay to responses, specify a delay ammount (in milliseconds) when instantiating the adapter

```js
// All requests using this instance will have a 2 seconds delay:
var mock = new MockAdapter(axiosInstance, 2000);
```

You can restore the original adapter (which will remove the mocking behavior)

```js
mock.restore();
```

You can also reset the registered mock handlers with `reset`

```js
mock.reset();
```

`reset` is different from `restore` in that `restore` removes the mocking from the axios instance completely,
whereas `reset` only removes all mock handlers that were added with onGet, onPost, etc. but leaves the mocking in place.

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

Chaining is also supported

```js
mock
  .onGet('/users').reply(200, users)
  .onGet('/posts').reply(200, posts);
```

`.replyOnce()` can be used to let the mock only reply once

```js
mock
  .onGet('/users').replyOnce(200, users) // After the first request to /users, this handler is removed
  .onGet('/users').replyOnce(500);       // The second request to /users will have status code 500
                                         // Any following request would return a 404 since there are
                                         // no matching handlers
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
