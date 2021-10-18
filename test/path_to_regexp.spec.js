var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter pathToRegexp", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("test url with params", function () {
    mock.onGet("/foo/:id").reply(200);

    return instance
      .get("/foo/42")
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("add urlParams to config", function () {
    mock.onGet("/foo/:id").reply(function (config) {
      expect(config.urlParams.id).to.equal('42');
      return [200];
    });

    return instance
      .get("/foo/42")
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });
});
