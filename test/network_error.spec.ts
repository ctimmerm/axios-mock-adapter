import axios, { AxiosInstance } from 'axios';
import MockAdapter from '../src/MockAdapter';
import { expect } from 'chai';

describe('networkError spec', function() {
  var instance: AxiosInstance;
  var mock: MockAdapter;

  beforeEach(function() {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it('mocks networkErrors', function() {
    mock.onGet('/foo').networkError();

    return instance.get('/foo').then(
      function() {
        expect.fail('should not be called');
      },
      function(error) {
        expect(error.config).to.exist;
        expect(error.response).to.not.exist;
        expect(error.message).to.equal('Network Error');
      }
    );
  });
});
