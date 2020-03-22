var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter on default axios instance", function () {
  var mock;

  beforeEach(function () {
    mock = new MockAdapter(axios);
  });

  afterEach(function () {
    mock.restore();
  });

  it("mocks requests on the default instance", function () {
    mock.onGet("/foo").reply(200);

    return axios.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });
});
