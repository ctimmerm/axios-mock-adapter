var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('MockAdapter replyOnce', function() {
  var instance;
  var mock;

  beforeEach(function() {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it('supports chaining', function() {
    mock
      .onGet('/foo').replyOnce(200)
      .onAny('/foo').replyOnce(500)
      .onPost('/foo').replyOnce(201);

    expect(mock.handlers['get'].length).to.equal(2);
    expect(mock.handlers['post'].length).to.equal(2);
  });

  it('replies as normally on the first call', function(done) {
    mock.onGet('/foo').replyOnce(200, {
      foo: 'bar'
    });

    instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data.foo).to.equal('bar');
        done();
      });
  });

  it('replies only once', function(done) {
    var called = false;
    mock.onGet('/foo').replyOnce(200);

    instance.get('/foo')
      .then(function() {
        called = true;
        return instance.get('/foo');
      })
      .catch(function(response) {
        expect(called).to.be.true;
        expect(response.status).to.equal(404);
        done();
      });
  });

  it('replies only once when used with onAny', function(done) {
    var called = false;
    mock.onAny('/foo').replyOnce(200);

    instance.get('/foo')
      .then(function() {
        called = true;
        return instance.post('/foo');
      })
      .catch(function(response) {
        expect(called).to.be.true;
        expect(response.status).to.equal(404);
        done();
      });
  });
});
