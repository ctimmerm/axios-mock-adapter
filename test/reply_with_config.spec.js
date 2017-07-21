var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('MockAdapter replyWithConfig', function() {
  var instance;
  var mock;

  beforeEach(function() {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it('always error', function() {
    mock.onGet('/foo').replyWithConfig({
      responses: {
        success: [200, { message: 'success' }],
        error: [500, { message: 'error' }]
      },
      delay: 0,
      errorChance: 1
    });

    return instance.get('/foo')
      .then(function(response) {
        throw new Error('should be error');
      })
      .catch(function(response) {
        expect(response.response.status).to.equal(500);
        expect(response.response.data.message).to.equal('error');
      });
  });

  it('always success', function() {
    mock.onGet('/foo').replyWithConfig({
      responses: {},
      delay: 0
    });

    return instance.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
        expect(response.data.message).to.equal('success');
      })
      .catch(function(response) {
        throw new Error('should not be error');
      });
  });

  it('delay range', function() {
    mock.onGet('/foo').replyWithConfig({
      responses: {
        success: [200, { message: 'success' }]
      },
      delay: [20, 50]
    });

    var requestTime = new Date().getTime();
    return instance.get('/foo')
      .then(function(response) {
        var pendingTime = new Date().getTime() - requestTime;

        expect(pendingTime).to.be.above(20);
        expect(pendingTime).to.be.below(60);
        expect(response.status).to.equal(200);
        expect(response.data.message).to.equal('success');
      });
  });
});
