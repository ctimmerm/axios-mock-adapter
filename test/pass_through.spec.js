var axios = require('axios');
var expect = require('chai').expect;
var createServer = require('http').createServer;

var MockAdapter = require('../src');

describe('MockAdapter(passThrough=true) tests (requires Node)', function() {
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
      .listen(0, 'localhost', function() {
        serverUrl = 'http://localhost:' + httpServer.address().port;
        resolve();
      })
      .on('error', reject);
    });
  });

  beforeEach(function() {
    instance = axios.create({ baseURL: serverUrl });
    mock = new MockAdapter(instance, { passThrough: true });
  });

  it('allows normal mocking', function() {
    mock.onGet('/foo').reply(200, 'bar');

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('bar');
      });
  });

  it('allows selective mocking', function() {
    mock.onGet('/foo').reply(200, 'bar');
    mock.onGet('/notFound').reply(200, 'found');

    return Promise.all([
      instance.get('/foo')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        }),
      instance.get('/notFound')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('found');
        }),
      instance.get('/bar')
        .then(function(response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal('bar');
        })
    ]);
  });

  it('handles errors correctly', function() {
    return instance.get('/error')
      .then(function() {
        throw new Error('ERROR');
      })
      .catch(function(error) {
        expect(error).to.have.deep.property('response.status', 500);
      });
  });
});
