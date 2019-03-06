var axios = require('axios');
var expect = require('chai').expect;
var createServer = require('http').createServer;

var MockAdapter = require('../src');

describe('passThrough tests (requires Node)', function() {
  var instance;
  var mock;
  var httpServer;
  var serverUrl;

  before('set up Node server', function() {
    return new Promise(function(resolve, reject) {
      httpServer = createServer(function(req, resp) {
        if (req.url === '/error') {
          resp.statusCode = 500;
          resp.end();
        } else {
          resp.statusCode = 200;
          // Reply with path minus leading /
          resp.end(req.url.slice(1), 'utf8');
        }
      })
        .listen(0, '127.0.0.1', function() {
          serverUrl = 'http://127.0.0.1:' + httpServer.address().port;
          resolve();
        })
        .on('error', reject);
    });
  });

  after(function() {
    httpServer.close();
  });

  beforeEach(function() {
    instance = axios.create({ baseURL: serverUrl });
    mock = new MockAdapter(instance);
  });

  it('allows selective mocking', function() {
    mock.onGet('/foo').reply(200, 'bar');
    mock.onGet('/error').reply(200, 'success');
    mock.onGet('/bar').passThrough();

    return Promise.all([
      instance.get('/foo')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        }),
      instance.get('/error')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('success');
        }),
      instance.get('/bar')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        }),
      instance.get('/noHandler')
        .then(function(response) {
          // Mock adapter should return an error
          expect(true).to.be.false;
        })
        .catch(function(error) {
          expect(error).to.have.nested.property('response.status', 404);
        })
    ]);
  });

  it('handles errors correctly', function() {
    mock.onGet('/error').passThrough();

    return instance.get('/error')
      .then(function() {
        // The server should've returned an error
        expect(false).to.be.true;
      })
      .catch(function(error) {
        expect(error).to.have.nested.property('response.status', 500);
      });
  });

  it('allows setting default passThrough handler', function() {
    mock
      .onGet('/foo').reply(200, 'bar')
      .onAny().passThrough();

    var randomPath = 'xyz' + Math.round(10000 * Math.random());

    return Promise.all([
      instance.get('/foo')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        }),
      instance.get('/' + randomPath)
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal(randomPath);
        }),
      instance.post('/post')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('post');
        })
    ]);
  });
  it('handles request transformations properly', function() {
    mock.onGet('/foo').passThrough();

    return instance.get('/foo', {
      data: 'foo',
      transformRequest: [function(data) {
        return data + 'foo';
      }]
    })
      .then(function(response) {
        expect(response.config.data).to.equal('foofoo');
      });
  });
  it('handles request interceptors properly', function() {
    instance.interceptors.request.use(function god(req) {
      if (req.data === 'foofoo') {
      }
      req.data += 'foo';
      return req;
    }, Promise.reject);
    mock.onGet('/foo').passThrough();

    return instance.get('/foo', {
      data: 'foo'
    })
      .then(function(response) {
        expect(response.config.data).to.equal('foofoo');
      });
  });

  it('handles response transformations properly', function() {
    mock.onGet('/foo').passThrough();

    return instance.get('/foo', {
      transformResponse: [function(data) {
        return data + 'foo';
      }]
    })
      .then(function(response) {
        expect(response.data).to.equal('foofoo');
      });
  });
  it('handles response interceptors properly', function() {
    instance.interceptors.response.use(function(res) {
      res.data += 'foo';
      return res;
    }, Promise.reject);
    mock.onGet('/foo').passThrough();

    return instance.get('/foo', {
      data: 'foo'
    })
      .then(function(response) {
        expect(response.data).to.equal('foofoo');
      });
  });
});
