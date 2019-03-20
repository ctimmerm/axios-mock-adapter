# axios-mock-adapter

[![Build Status](https://travis-ci.org/ctimmerm/axios-mock-adapter.svg?branch=master)](https://travis-ci.org/ctimmerm/axios-mock-adapter)
[![devDependency Status](https://david-dm.org/ctimmerm/axios-mock-adapter/dev-status.svg)](https://david-dm.org/ctimmerm/axios-mock-adapter#info=devDependencies)

Axios adapter that allows to easily mock requests

## Installation

Using npm:

`$ npm install axios-mock-adapter --save-dev`

It's also available as a UMD build:

* https://unpkg.com/axios-mock-adapter/dist/axios-mock-adapter.js
* https://unpkg.com/axios-mock-adapter/dist/axios-mock-adapter.min.js

axios-mock-adapter works on Node as well as in a browser, it works with axios v0.9.0 and above.

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
```

Mocking a `GET` request with specific parameters

```js
var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');

// This sets the mock adapter on the default instance
var mock = new MockAdapter(axios);

// Mock GET request to /users when param `searchText` is 'John'
// arguments for reply are (status, data, headers)
mock.onGet('/users', { params: { searchText: 'John' } }).reply(200, {
  users: [
    { id: 1, name: 'John Smith' }
  ]
});

axios.get('/users', { params: { searchText: 'John' } } )
  .then(function(response) {
    console.log(response.data);
  });
```

To add a delay to responses, specify a delay amount (in milliseconds) when instantiating the adapter

```js
// All requests using this instance will have a 2 seconds delay:
var mock = new MockAdapter(axiosInstance, { delayResponse: 2000 });
```

You can restore the original adapter (which will remove the mocking behavior)

```js
mock.restore();
```

You can also reset the registered mock handlers with `resetHandlers`

```js
mock.resetHandlers();
```

You can reset both registered mock handlers and history items with `reset`

```js
mock.reset();
```

`reset` is different from `restore` in that `restore` removes the mocking from the axios instance completely,
whereas `reset` only removes all mock handlers that were added with onGet, onPost, etc. but leaves the mocking in place.

Mock a low level network error

```js
// Returns a failed promise with Error('Network Error');
mock.onGet('/users').networkError();

// networkErrorOnce can be used to mock a network error only once 
mock.onGet('/users').networkErrorOnce();
```

Mock a network timeout

```js
// Returns a failed promise with Error with code set to 'ECONNABORTED'
mock.onGet('/users').timeout();

// timeoutOnce can be used to mock a timeout only once 
mock.onGet('/users').timeoutOnce();
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

Passing a function to `reply` that returns an axios request, essentially mocking a redirect

```js
mock.onPost('/foo').reply(function(config) {
  return axios.get('/bar');
});
```

Using a regex

```js
mock.onGet(/\/users\/\d+/).reply(function(config) {
  // the actual id can be grabbed from config.url

  return [200, {}];
});
```
Using variables in regex
```js
const usersUri = '/users';
const url = new RegExp(`${usersUri}/*`);

mock.onGet(url).reply(200, users);
```


Specify no path to match by verb alone

```js
// Reject all POST requests with HTTP 500
mock.onPost().reply(500);
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
                                         // no matching handlers left
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

// Match ALL requests
mock.onAny().reply(config => {
  const [method, url, ...response] = responses.shift();
  if (config.url === url && config.method.toUpperCase() === method) return response;
  // Unexpected request, error out
  return [500, {}];
});
```

Requests that do not map to a mock handler are rejected with a HTTP 404 response. Since
handlers are matched in order, a final `onAny()` can be used to change the default
behaviour

```js
 // Mock GET requests to /foo, reject all others with HTTP 500
mock
  .onGet('/foo').reply(200)
  .onAny().reply(500);
```

Mocking a request with a specific request body/data

```js
mock.onPut('/product', { id: 4, name: 'foo' }).reply(204);
```

`.passThrough()` forwards the matched request over network

```js
// Mock POST requests to /api with HTTP 201, but forward
// GET requests to server
mock
  .onPost(/\/^api/).reply(201)
  .onGet(/\/^api/).passThrough();
```

Recall that the order of handlers is significant

```js
// Mock specific requests, but let unmatched ones through
mock
  .onGet('/foo').reply(200)
  .onPut('/bar', { xyz: 'abc' }).reply(204)
  .onAny().passThrough();
```

Note that `passThrough` requests are not subject to delaying by `delayResponse`.

As of 1.7.0, `reply` function may return a Promise:

```js
mock.onGet('/product').reply(function(config) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      if (Math.random() > 0.1) {
        resolve([200, { id: 4, name: 'foo' } ]);
      } else {
        // reject() reason will be passed as-is.
        // Use HTTP error status code to simulate server failure.
        resolve([500, { success: false } ]);
      }
    }, 1000);
  });
});
```

Composing from multiple sources with Promises:

```js
var normalAxios = axios.create();
var mockAxios = axios.create();
var mock = new MockAdapter(mockAxios);

mock
  .onGet('/orders')
  .reply(() => Promise.all([
      normalAxios
        .get('/api/v1/orders')
        .then(resp => resp.data),
      normalAxios
        .get('/api/v2/orders')
        .then(resp => resp.data),
      { id: '-1', content: 'extra row 1' },
      { id: '-2', content: 'extra row 2' }
    ]).then(
      sources => [200, sources.reduce((agg, source) => agg.concat(source))]
    )
  );
```

## History

The `history` property allows you to enumerate existing axios request objects. The property is an object of verb keys referencing arrays of request objects.

This is useful for testing.

```js
describe('Feature', () => {
  it('requests an endpoint', (done) => {
    var mock = new AxiosMockAdapter(axios);
    mock.onPost('/endpoint').replyOnce(200);

    feature.request()
      .then(() => {
        expect(mock.history.post.length).toBe(1);
        expect(mock.history.post[0].data).toBe(JSON.stringify({ foo: 'bar' }));
      })
      .then(done)
      .catch(done.fail);
  });
});
```

You can clear the history with `resetHistory`

```js
mock.resetHistory();
```
