var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("timeout spec", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("mocks timeout response", function () {
    mock.onGet("/foo").timeout();

    return instance.get("/foo").then(
      function () {
        expect.fail("should not be called");
      },
      function (error) {
        expect(error.config).to.exist;
        expect(error.code).to.equal("ECONNABORTED");
        expect(error.message).to.equal("timeout of 0ms exceeded");
        expect(error.isAxiosError).to.be.true;
      }
    );
  });

  it("can timeout only once", function () {
    mock.onGet("/foo").timeoutOnce().onGet("/foo").reply(200);

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

  it("responds with timeoutErrorMessage", function () {
    mock.onGet("/foo").timeout();
    var timeoutErrorMessage = "That request sure did time out";

    return instance
      .get("/foo", {
        timeoutErrorMessage: timeoutErrorMessage,
      })
      .then(
        function () {
          expect.fail("should not be called");
        },
        function (error) {
          expect(error.config).to.exist;
          expect(error.code).to.equal("ECONNABORTED");
          expect(error.message).to.equal(timeoutErrorMessage);
          expect(error.isAxiosError).to.be.true;
        }
      );
  });
});
