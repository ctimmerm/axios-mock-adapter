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

  it('registers the mock handlers on the mock instance', function() {
    mock.onGet('/foo').reply(200, { foo: 'bar' }, { baz: 'quux' });

    expect(mock.handlers['get'][0][0]).to.equal('/foo');
    expect(mock.handlers['get'][0][1]).to.equal(200);
    expect(mock.handlers['get'][0][2].foo).to.equal('bar');
    expect(mock.handlers['get'][0][3].baz).to.equal('quux');
  });

  it('registers the mock handlers with body on the mock instance', function() {
    var body = { foo: 'bar' };
    var response = { foo: 'bar' };
    var headers = { baz: 'quux' };
    mock.onGet('/foo', body).reply(200, response, headers);

    expect(mock.handlers['get'][0][0]).to.equal('/foo');
    expect(mock.handlers['get'][0][1]).to.equal(200);
    expect(mock.handlers['get'][0][2]).to.eql(response);
    expect(mock.handlers['get'][0][3]).to.equal(headers);
    expect(mock.handlers['get'][0][4]).to.eql(body);
  });

  it('mocks requests', function() {
    mock.onGet('/foo').reply(200, {
      foo: 'bar'
    });

    return instance.get('/foo')
      .then(function(response) {
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

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal('bar');
        done();
      });
  });

  it('can return headers', function() {
    mock.onGet('/foo').reply(200, {}, {
      foo: 'bar'
    });

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.headers.foo).to.equal('bar');
      });
  });

  it('accepts a callback that returns a response', function() {
    mock.onGet('/foo').reply(function() {
      return [200, { foo: 'bar' }];
    });

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal('bar');
      });
  });

  it('matches on a regex', function() {
    mock.onGet(/\/fo+/).reply(200);

    return instance.get('/foooooooooo')
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('can pass a body to match to a handler', function() {
    mock
      .onPost('/withBody', { body: { is: 'passed' }, in: true })
      .reply(200);

    return instance.post('/withBody', { body: { is: 'passed' }, in: true })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('does not match when body is wrong', function() {
    var body = { body: { is: 'passed' }, in: true };
    mock.onPatch('/wrongObjBody', body).reply(200);

    return instance.patch('/wrongObjBody', { wrong: 'body' })
      .catch(function(error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it('does not match when string body is wrong', function() {
    mock.onPatch('/wrongStrBody', 'foo').reply(200);

    return instance.patch('/wrongStrBody', 'bar')
      .catch(function(error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it('does match with string body', function() {
    mock.onPatch(/^\/strBody$/, 'foo').reply(200);

    return instance.patch('/strBody', 'foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('passes the config to the callback', function() {
    mock.onGet(/\/products\/\d+/).reply(function(config) {
      return [200, {}, { RequestedURL: config.url }];
    });

    return instance.get('/products/25')
      .then(function(response) {
        expect(response.headers.RequestedURL).to.equal('/products/25');
      });
  });

  it('handles post requests', function() {
    mock.onPost('/foo').reply(function(config) {
      return [200, JSON.parse(config.data).bar];
    });

    return instance.post('/foo', { bar: 'baz' })
      .then(function(response) {
        expect(response.data).to.equal('baz');
      });
  });

  it('works when using baseURL', function() {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onGet('/foo').reply(200);

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('allows multiple consecutive requests for the mocked url', function() {
    mock.onGet('/foo').reply(200);

    return instance.get('/foo')
      .then(function() {
        return instance.get('/foo');
      })
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });

  it('returns a 404 when no matching url is found', function() {
    return instance.get('/foo')
      .catch(function(error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it('rejects when the status is >= 300', function() {
    mock.onGet('/moo').reply(500);

    return instance.get('/moo')
      .catch(function(error) {
        expect(error.response.status).to.equal(500);
      });
  });

  it('rejects the promise with an error when the status is >= 300', function() {
    mock.onGet('/foo').reply(500);

    return instance.get('/foo')
      .catch(function(error) {
        expect(error).to.be.an.instanceof(Error);
        expect(error.message).to.match(/request failed/i);
      });
  });

  it('supports providing a validateStatus function', function() {
    instance.defaults.validateStatus = function() {
      return true;
    };
    mock.onGet('/foo').reply(500);

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(500);
      });
  });

  it('respects validatesStatus when requesting unhandled urls', function() {
    instance.defaults.validateStatus = function() {
      return true;
    };

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(404);
      });
  });

  it('handles errors thrown as expected', function() {
    mock.onGet('/foo').reply(function() {
      throw new Error('bar');
    });

    return instance.get('/foo')
      .catch(function(error) {
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
      .onGet('/foo').reply(200)
      .onAny('/bar').reply(404)
      .onPost('/baz').reply(500);

    expect(mock.handlers['get'].length).to.equal(2);
    expect(mock.handlers['patch'].length).to.equal(1);
    expect(mock.handlers['post'].length).to.equal(2);
  });

  it('allows to delay responses', function() {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet('/foo').reply(200);

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });
});
