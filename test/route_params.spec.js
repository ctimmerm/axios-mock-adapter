var axios = require('axios');
var expect = require('chai').expect;

var MockAdapter = require('../src');

describe('MockAdapter route params', function() {
  var instance;
  var mock;

  it('matches route with params', function() {
    var routeParams = {
      ':userUuid': '[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}',
      ':filter': '((active)|inactive|all)',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet('/users/:userUuid/posts/:filter').reply(200, 'body');

    return instance.get('/users/b67c0749-656c-4beb-9cd9-17e274a648d9/posts/active').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('rejects route when params regex does not match', function() {
    var routeParams = {
      ':userUuid': '[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}',
      ':filter': 'active|inactive|all',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet('/users/:userUuid/posts/:filter').reply(200, 'body');

    return instance.get('/users/all/posts/recent').catch(function(error) {
      expect(error.response.status).to.equal(404);
      expect(error.response.config.routeParams).to.equal(undefined);
    });
  });

  it('matches route with params and makes params available on config', function() {
    var routeParams = {
      ':userUuid': '[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}',
      ':filter': '.+',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet('/users/:userUuid/posts/:filter').reply(function(config) {
      expect(config.routeParams).to.deep.equal({
        'userUuid': 'b67c0749-656c-4beb-9cd9-17e274a648d9',
        'filter': 'inactive'
      });
      return [200, 'body'];
    });

    return instance.get('/users/b67c0749-656c-4beb-9cd9-17e274a648d9/posts/inactive').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('matches route with params when using baseURL', function() {
    var routeParams = {
      ':userId': '\\d+',
      ':filter': 'active|inactive|all',
    }

    instance = axios.create();
    instance.defaults.baseURL = 'http://www.example.org/api/v1';
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet('/users/:userId/posts/:filter').reply(function(config) {
      expect(config.routeParams).to.deep.equal({
        'userId': '123',
        'filter': 'inactive'
      });
      return [200, 'body'];
    });

    return instance.get('/users/123/posts/inactive').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('matches route with params when using curly braces', function() {
    var routeParams = {
      '{userId}': '\\d+',
      '{filter}': 'active|inactive|all',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet('/users/{userId}/posts/{filter}/orderby:date:desc').reply(function(config) {
      expect(config.routeParams).to.deep.equal({
        'userId': '123',
        'filter': 'inactive'
      });
      return [200, 'body'];
    });

    return instance.get('/users/123/posts/inactive/orderby:date:desc').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });

  it('does not match params when param keys are not using colons or curly braces notation', function() {
    var routeParams = {
      'userId': '\\d+',
      'filter': 'active|inactive|all',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(null);

    mock.onGet('/users/userId/posts/filter').reply(function(config) {
      expect(config.routeParams).to.deep.equal({});
      return [200, 'body'];
    });

    return instance.get('/users/123/posts/inactive').catch(function(error) {
      expect(error.response.status).to.equal(404);
      expect(error.response.config.routeParams).to.equal(undefined);
    });
  });

  it('does not use known route params when matcher is not a string', function() {
    var routeParams = {
      ':userId': '\\d+',
      ':filter': 'active|inactive|all',
    }

    instance = axios.create();
    mock = new MockAdapter(instance, {}, routeParams);

    expect(mock.knownRouteParams).to.deep.equal(routeParams);

    mock.onGet(/\/users\/\d+\/posts\/active|inactive|all/).reply(function(config) {
      expect(config.routeParams).to.deep.equal({});
      return [200, 'body'];
    });

    return instance.get('/users/123/posts/inactive').then(function(response) {
      expect(response.status).to.equal(200);
    });
  });
});
