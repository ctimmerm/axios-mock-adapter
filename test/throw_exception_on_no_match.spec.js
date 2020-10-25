var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("onNoMatch=throwException option tests (requires Node)", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance, { onNoMatch: "throwException" });
  });

  it("allows selective mocking", function () {
    mock.onGet("/foo").reply(200, "bar");
    mock.onGet("/error").reply(200, "success");

    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
      instance.get("/error").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("success");
      }),
    ]);
  });

  it("handles errors correctly when could not find mock for requested url", function () {
    var expectedUrl = "http://127.0.0.1/unexistent_path";
    var expectedMethod = "get";

    return instance
      .get(expectedUrl)
      .then(function () {
        // The server should've returned an error
        expect(false).to.be.true;
      })
      .catch(function (error) {
        expect(error).to.have.nested.property("isCouldNotFindMockError", true);
        expect(error).to.have.nested.property("method", expectedMethod);
        expect(error).to.have.nested.property("url", expectedUrl);
        expect(error.message).to.contain("Could not find mock for");
        expect(error.message).to.contain(expectedMethod);
        expect(error.message).to.contain(expectedUrl);
      });
  });
});
