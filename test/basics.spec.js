var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('MockAdapter basics', function() {
  var instance;
  var mock;

  beforeEach(function() {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it('correctly sets the adapter on the axios instance', function() {
    expect(instance.defaults.adapter).to.exist;
  });

  it('supports all verbs', function() {
    expect(mock.onGet).to.be.a('function');
    expect(mock.onPost).to.be.a('function');
    expect(mock.onPut).to.be.a('function');
    expect(mock.onHead).to.be.a('function');
    expect(mock.onDelete).to.be.a('function');
    expect(mock.onPatch).to.be.a('function');
  });

  it('mocks requests', function() {
    mock.onGet('/foo').reply(200, {
      foo: 'bar'
    });

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal('bar');
    });
  });

  it('exposes the adapter', function() {
    expect(mock.adapter()).to.be.a('function');

    instance.defaults.adapter = mock.adapter();

    mock.onGet('/foo').reply(200, {
      foo: 'bar'
    });

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal('bar');
    });
  });

  it('can return headers', function() {
    mock.onGet('/foo').reply(
      200,
      {},
      {
        foo: 'bar'
      }
    );

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
      expect(response.headers.foo).to.equal('bar');
    });
  });

  it('accepts a callback that returns a response', function() {
    mock.onGet('/foo').reply(function() {
      return [200, { foo: 'bar' }];
    });

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal('bar');
    });
  });

  it('matches on a regex', function() {
    mock.onGet(/\/fo+/).reply(200);

    return instance.get('/foooooooooo').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('can pass query params to match to a handler', function() {
    mock
      .onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .reply(200);

    return instance
      .get('/withParams', { params: { bar: 'foo', foo: 'bar' }, in: true })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('can pass query params to match to a handler with uppercase method', function() {
    mock
      .onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .reply(200);

    return instance({
      method: 'GET',
      url: '/withParams',
      params: { foo: 'bar', bar: 'foo' }
    }).then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('does not match when parameters are wrong', function() {
    mock
      .onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .reply(200);
    return instance
      .get('/withParams', { params: { foo: 'bar', bar: 'other' } })
      .catch(function(error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it('does not match when parameters are missing', function() {
    mock
      .onGet('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .reply(200);
    return instance.get('/withParams').catch(function(error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it('matches when parameters were not expected', function() {
    mock.onGet('/withParams').reply(200);
    return instance
      .get('/withParams', { params: { foo: 'bar', bar: 'foo' } })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('can pass a body to match to a handler', function() {
    mock.onPost('/withBody', { body: { is: 'passed' }, in: true }).reply(200);

    return instance
      .post('/withBody', { body: { is: 'passed' }, in: true })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('does not match when body is wrong', function() {
    var body = { body: { is: 'passed' }, in: true };
    mock.onPatch('/wrongObjBody', body).reply(200);

    return instance
      .patch('/wrongObjBody', { wrong: 'body' })
      .catch(function(error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it('does not match when string body is wrong', function() {
    mock.onPatch('/wrongStrBody', 'foo').reply(200);

    return instance.patch('/wrongStrBody', 'bar').catch(function(error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it('does match with string body', function() {
    mock.onPatch(/^\/strBody$/, 'foo').reply(200);

    return instance.patch('/strBody', 'foo').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('passes the config to the callback', function() {
    mock.onGet(/\/products\/\d+/).reply(function(config) {
      return [200, {}, { RequestedURL: config.url }];
    });

    return instance.get('/products/25').then(function(response) {
      expect(response.headers.RequestedURL).to.equal('/products/25');
    });
  });

  it('handles post requests', function() {
    mock.onPost('/foo').reply(function(config) {
      return [200, JSON.parse(config.data).bar];
    });

    return instance.post('/foo', { bar: 'baz' }).then(function(response) {
      expect(response.data).to.equal('baz');
    });
  });

  it('works when using baseURL', function() {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onGet('/foo').reply(200);

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('allows using an absolute URL when a baseURL is set', function() {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onAny().reply(function(config) {
      return [200, config.url];
    });

    return instance.get('http://www.foo.com/bar').then(function(response) {
      expect(response.status).to.equal(200);
      expect(response.data).to.equal('http://www.foo.com/bar');
    });
  });

  it('allows multiple consecutive requests for the mocked url', function() {
    mock.onGet('/foo').reply(200);

    return instance
      .get('/foo')
      .then(function() {
        return instance.get('/foo');
      })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('returns a 404 when no matching url is found', function() {
    return instance.get('/foo').catch(function(error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it('rejects when the status is >= 300', function() {
    mock.onGet('/moo').reply(500);

    return instance.get('/moo').catch(function(error) {
      expect(error.response.status).to.equal(500);
    });
  });

  it('rejects the promise with an error when the status is >= 300', function() {
    mock.onGet('/foo').reply(500);

    return instance.get('/foo').catch(function(error) {
      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.match(/request failed/i);
    });
  });

  it('supports providing a validateStatus function', function() {
    instance.defaults.validateStatus = function() {
      return true;
    };
    mock.onGet('/foo').reply(500);

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(500);
    });
  });

  it('respects validatesStatus when requesting unhandled urls', function() {
    instance.defaults.validateStatus = function() {
      return true;
    };

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(404);
    });
  });

  it('handles errors thrown as expected', function() {
    mock.onGet('/foo').reply(function() {
      throw new Error('bar');
    });

    return instance.get('/foo').catch(function(error) {
      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.equal('bar');
    });
  });

  it('restores the previous adapter (if any)', function() {
    var adapter = function() {};
    var newInstance = axios.create();
    newInstance.defaults.adapter = adapter;
    var newMock = new MockAdapter(newInstance);
    newMock.restore();

    expect(newInstance.defaults.adapter).to.equal(adapter);
  });

  it('resets the registered mock handlers', function() {
    mock.onGet('/foo').reply(200);
    expect(mock.handlers['get']).not.to.be.empty;

    mock.reset();
    expect(mock.handlers['get']).to.be.empty;
  });

  it('can chain calls to add mock handlers', function() {
    mock
      .onGet('/foo')
      .reply(200)
      .onAny('/bar')
      .reply(404)
      .onPost('/baz')
      .reply(500);

    expect(mock.handlers['get'].length).to.equal(2);
    expect(mock.handlers['patch'].length).to.equal(1);
    expect(mock.handlers['post'].length).to.equal(2);
  });

  it('allows to delay responses', function() {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet('/foo').reply(200);

    return instance.get('/foo').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('maps empty GET path to any path', function() {
    mock.onGet('/foo').reply(200, 'foo').onGet().reply(200, 'bar');

    return Promise.all([
      instance.get('/foo').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('foo');
      }),
      instance.get('/bar').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('bar');
      }),
      instance
        .get('/xyz' + Math.round(100000 * Math.random()))
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        })
    ]);
  });

  it('allows mocking all requests', function() {
    mock.onAny().reply(200);

    function anyResponseTester(response) {
      expect(response.status).to.equal(200);
    }

    return Promise.all([
      instance.get('/foo').then(anyResponseTester),
      instance.post('/bar').then(anyResponseTester),
      instance.put('/foobar').then(anyResponseTester),
      instance.head('/barfoo').then(anyResponseTester),
      instance.delete('/foo/bar').then(anyResponseTester),
      instance.patch('/bar/foo').then(anyResponseTester)
    ]);
  });

  it('allows sending an array as response', function() {
    mock.onGet('/').reply(200, [1, 2, 3]);

    return instance.get('/').then(function(response) {
      expect(response.data).to.deep.equal([1, 2, 3]);
    });
  });

  it('allows sending an any object as response', function() {
    var buffer = new ArrayBuffer(1);
    var view = new Uint8Array(buffer);
    view[0] = 0xFF;

    mock.onGet('/').reply(200, buffer);

    return instance({
      url: '/',
      method: 'GET',
      responseType: 'arraybuffer'
    }).then(function(response) {
      var view = new Uint8Array(response.data);
      expect(view[0]).to.equal(0xFF);
    });
  });

  it('returns a deep copy of the mock data in the response when the data is an object', function() {
    var data = {
      foo: {
        bar: 123
      }
    };

    mock.onGet('/').reply(200, data);

    return instance
      .get('/')
      .then(function(response) {
        response.data.foo.bar = 456;
      })
      .then(function() {
        expect(data.foo.bar).to.equal(123);
      });
  });

  it('returns a deep copy of the mock data in the response when the data is an array', function() {
    var data = [
      {
        bar: 123
      }
    ];

    mock.onGet('/').reply(200, data);

    return instance
      .get('/')
      .then(function(response) {
        response.data[0].bar = 456;
      })
      .then(function() {
        expect(data[0].bar).to.equal(123);
      });
  });
});
