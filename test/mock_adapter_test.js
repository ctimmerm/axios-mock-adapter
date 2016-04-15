var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('..');

describe('MockAdapter', function() {
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

    expect(mock.matchers['get'][0][0]).to.equal('/foo');
    expect(mock.matchers['get'][0][1]).to.equal(200);
    expect(mock.matchers['get'][0][2].foo).to.equal('bar');
    expect(mock.matchers['get'][0][3].baz).to.equal('quux');
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

    mock.onGet('http://www.example.org/foo').reply(200);

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
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

  it('restores the previous adapter (if any)', function() {
    var adapter = function() {};
    var newInstance = axios.create();
    newInstance.defaults.adapter = adapter;
    var newMock = new MockAdapter(newInstance);
    newMock.restore();

    expect(newInstance.defaults.adapter).to.equal(adapter);
  });

  it('resets the registered mock handlers', function(done) {
    mock.onGet('/foo').reply(500);
    mock.reset();
    mock.onGet('/foo').reply(200);

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        done();
      });
  });

  it('can chain calls to add mock handlers', function() {
    mock
      .onGet('/foo').reply(200)
      .onAny('/bar').reply(404)
      .onPost('/baz').reply(500);

    expect(mock.matchers['get']).to.not.be.empty;
    expect(mock.matchers['post']).to.not.be.empty;
  });

  context('on the default instance', function() {
    afterEach(function() {
      axios.defaults.adapter = undefined;
    });

    it('mocks requests on the default instance', function(done) {
      var defaultMock = new MockAdapter(axios);

      defaultMock.onGet('/foo').reply(200);

      axios.get('/foo')
        .then(function(response) {
          expect(response.status).to.equal(200);
          done();
        });
    });
  });

  context('.onAny', function() {
    it('registers a handler for every HTTP method', function() {
      mock.onAny('/foo').reply(200);

      expect(mock.matchers['get']).not.to.be.empty;
      expect(mock.matchers['patch']).not.to.be.empty;
      expect(mock.matchers['put']).not.to.be.empty;
    });

    it('mocks any request with a matching url', function(done) {
      mock.onAny('/foo').reply(200);

      instance.head('/foo')
        .then(function() {
          return instance.patch('/foo');
        })
        .then(function() {
          done();
        });
    });
  });
});
