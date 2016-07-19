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

  it('mocks requests', function(done) {
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

  it('can return headers', function(done) {
    mock.onGet('/foo').reply(200, {}, {
      foo: 'bar'
    });

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.headers.foo).to.equal('bar');
        done();
      });
  });

  it('accepts a callback that returns a response', function(done) {
    mock.onGet('/foo').reply(function() {
      return [200, { foo: 'bar' }];
    });

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal('bar');
        done();
      });
  });

  it('matches on a regex', function(done) {
    mock.onGet(/\/fo+/).reply(200);

    instance.get('/foooooooooo')
      .then(function() {
        done();
      });
  });

  it('can pass a body to match to a handler', function(done) {
    var body = { body: { is: 'passed' }, in: true };
    mock.onPost('/withBody', body).reply(200);

    instance.post('/withBody', body).then(function(response) {
      expect(response.status).to.equal(200);
      done();
    });
  });

  it('does not match when body is wrong', function(done) {
    var body = { body: { is: 'passed' }, in: true };
    mock.onPatch('/wrongObjBody', body).reply(200);

    instance.patch('/wrongObjBody', { wrong: 'body' }).catch(function(response) {
      expect(response.status).to.equal(404);
      done();
    });
  });

  it('does not match when string body is wrong', function(done) {
    mock.onPatch('/wrongStrBody', 'foo').reply(200);

    instance.patch('/wrongStrBody', 'bar').catch(function(response) {
      expect(response.status).to.equal(404);
      done();
    });
  });

  it('does match with string body', function(done) {
    mock.onPatch(/^\/strBody$/, 'foo').reply(200);

    instance.patch('/strBody', 'foo').then(function(response) {
      expect(response.status).to.equal(200);
      done();
    });
  });

  it('passes the config to the callback', function(done) {
    mock.onGet(/\/products\/\d+/).reply(function(config) {
      return [200, {}, { RequestedURL: config.url }];
    });

    instance.get('/products/25')
      .then(function(response) {
        expect(response.headers.RequestedURL).to.equal('/products/25');
        done();
      });
  });

  it('handles post requests', function(done) {
    mock.onPost('/foo').reply(function(config) {
      return [200, JSON.parse(config.data).bar];
    });

    instance.post('/foo', { bar: 'baz' })
      .then(function(response) {
        expect(response.data).to.equal('baz');
        done();
      });
  });

  it('works when using baseURL', function(done) {
    instance.defaults.baseURL = 'http://www.example.org';

    mock.onGet('/foo').reply(200);

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        done();
      });
  });

  it('allows multiple consecutive requests for the mocked url', function(done) {
    mock.onGet('/foo').reply(200);

    instance.get('/foo')
      .then(function() {
        return instance.get('/foo');
      })
      .then(function() {
        done();
      });
  });

  it('returns a 404 when no matching url is found', function(done) {
    instance.get('/foo')
      .catch(function(response) {
        expect(response.status).to.equal(404);
        done();
      });
  });

  it('rejects when the status is >= 300', function(done) {
    mock.onGet('/moo').reply(500);

    instance.get('/moo')
      .catch(function(response) {
        expect(response.status).to.equal(500);
        done();
      });
  });

  it('supports providing a validateStatus function', function(done) {
    instance.defaults.validateStatus = function() {
      return true;
    };
    mock.onGet('/foo').reply(500);

    instance.get('/foo')
      .then(function() {
        done();
      });
  });

  it('respects validatesStatus when requesting unhandled urls', function(done) {
    instance.defaults.validateStatus = function() {
      return true;
    };

    instance.get('/foo')
      .then(function() {
        done();
      });
  });

  it('handles errors thrown as expected', function(done) {
    mock.onGet('/foo').reply(function() {
      throw new Error('bar');
    });

    instance.get('/foo')
      .catch(function(response) {
        expect(response).to.be.an.instanceof(Error);
        expect(response.message).to.equal('bar');
        done();
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

  it('allows to delay responses', function(done) {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet('/foo').reply(200);

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        done();
      });
  });
});
