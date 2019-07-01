import axios from 'axios';
import MockAdapter from '../src/MockAdapter';
import { expect } from 'chai';

describe('MockAdapter on default axios instance', function() {
  var mock: MockAdapter;

  beforeEach(function() {
    mock = new MockAdapter(axios);
  });

  afterEach(function() {
    mock.restore();
  });

  it('mocks requests on the default instance', function() {
    mock.onGet('/foo').reply(200);

    return axios.get('/foo')
      .then(function(response) {
        expect(response.status).to.equal(200);
      });
  });
});
