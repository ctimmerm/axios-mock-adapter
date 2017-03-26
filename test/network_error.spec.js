var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('networkError spec', function() {
  var mock;

  beforeEach(function() {
    mock = new MockAdapter(axios);
  });

  afterEach(function() {
    mock.restore();
  });

  it('mocks networkErrors', function() {
    mock.onGet('/foo').networkError();

    return axios.get('/foo')
      .then(function() {
        expect.fail('should not be called');
      }, function(error) {
        expect(error.config).to.exist;
        expect(error.response).to.not.exist;
        expect(error.message).to.equal('Network Error');
      });
  });
});
