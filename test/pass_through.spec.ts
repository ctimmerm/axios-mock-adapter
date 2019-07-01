import axios, { AxiosInstance } from 'axios';
import MockAdapter from '../src/MockAdapter';
import { expect } from 'chai';
import { Server } from 'http';
import createReplyServer from './reply-server';

describe('passThrough tests (requires Node)', function() {
  var instance: AxiosInstance;
  var mock: MockAdapter;
  var httpServer: Server;
  var serverUrl: string;

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
});
