var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter reply with Promise", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("allows resolving with Promise", function () {
    mock.onGet("/promise").reply(function () {
      return new Promise(function (resolve, reject) {
        resolve([200, { bar: "fooPromised" }]);
      });
    });

    return instance
      .get("/promise")
      .then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data.bar).to.equal("fooPromised");
      })
      .catch(function () {
        expect(true).to.be.false;
      });
  });

  it("rejects after Promise resolves to error response", function () {
    mock.onGet("/bad/promise").reply(function () {
      return new Promise(function (resolve) {
        resolve([400, { bad: "request" }]);
      });
    });

    return instance
      .get("/bad/promise")
      .then(function (response) {
        expect(true).to.be.false;
      })
      .catch(function (error) {
        expect(error).to.have.nested.property("response.status", 400);
        expect(error).to.have.nested.property("response.data.bad", "request");
      });
  });

  it("passes rejecting Promise verbatim", function () {
    mock.onGet("/reject").reply(function () {
      return new Promise(function (resolve, reject) {
        reject({ custom: "error" });
      });
    });

    return instance
      .get("/reject")
      .then(function (response) {
        expect(true).to.be.false;
      })
      .catch(function (error) {
        expect(error).to.deep.equal({ custom: "error" });
      });
  });
});
