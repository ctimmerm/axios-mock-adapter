var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("networkError spec", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("mocks networkErrors", function () {
    mock.onGet("/foo").networkError();

    return instance.get("/foo").then(
      function () {
        expect.fail("should not be called");
      },
      function (error) {
        expect(error.config).to.exist;
        expect(error.response).to.not.exist;
        expect(error.message).to.equal("Network Error");
        expect(error.isAxiosError).to.be.true;
      }
    );
  });

  it("can mock a network error only once", function () {
    mock.onGet("/foo").networkErrorOnce().onGet("/foo").reply(200);

    return instance
      .get("/foo")
      .then(
        function () {},
        function () {
          return instance.get("/foo");
        }
      )
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });
});
