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

  it('rejects when the status is >= 300', function(done) {
	mock.onGet('/moo').reply(500);

	instance.get('/moo')
      .then(
	    function(response) {
	    },
	    function(response) {
          expect(response.status).to.equal(500);
          done();
	    }
	  );
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
});
