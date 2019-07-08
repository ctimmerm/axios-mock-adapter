var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('timeout spec', function() {
  var mock;

  beforeEach(function() {
    mock = new MockAdapter(axios);
  });

  afterEach(function() {
    mock.restore();
  });

  it('mocks timeout response', function() {
    mock.onGet('/foo').timeout();

    return axios.get('/foo').then(
      function() {
        expect.fail('should not be called');
      },
      function(error) {
        expect(error.config).to.exist;
        expect(error.code).to.equal('ECONNABORTED');
        expect(error.message).to.equal('timeout of 0ms exceeded');
        expect(error.isAxiosError).to.be.true;
      }
    );
  });
});
