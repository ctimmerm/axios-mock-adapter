import axios, { AxiosInstance } from 'axios';
import MockAdapter from '../src/MockAdapter';
import { expect } from 'chai';
import createReplyServer from './reply-server';

describe('trailing slash in axios baseUrl issue (requires Node)', function() {
  var instance: AxiosInstance;
  var mock: MockAdapter;
  var httpServer;
  var serverUrl;

  before('set up Node server', function() {
    return createReplyServer().then(([server, url]) => {
      httpServer = server;
      serverUrl = url;
    });
  });

  after(function() {
    httpServer.close();
  });

  beforeEach(function() {
    instance = axios.create({ baseURL: serverUrl + '/' }); // baseUrl has a trailing slash
    mock = new MockAdapter(instance);
  });

  it('axios should handle trailing slash in baseUrl', function() {
    // passes
    mock.onAny().passThrough();
    return Promise.all([
      instance.get('/foo').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('foo');
      }),
      instance.get('foo').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('foo');
      })
    ]);
  });

  it('mock adapter should handle trailing slash in baseUrl', function() {
    // both fail: 404
    mock.onGet('/foo').reply(200, 'bar');
    return Promise.all([
      instance.get('/foo').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('bar');
      }),
      instance.get('foo').then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal('bar');
      })
    ]);
  });
});
