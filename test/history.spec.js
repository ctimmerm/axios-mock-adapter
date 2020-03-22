var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter history", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("initializes empty history for each http method", function () {
    expect(mock.history["get"]).to.eql([]);
    expect(mock.history["post"]).to.eql([]);
    expect(mock.history["put"]).to.eql([]);
  });

  it("records the axios config each time the handler is invoked", function () {
    mock.onAny("/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      expect(mock.history.get.length).to.equal(1);
      expect(mock.history.get[0].method).to.equal("get");
      expect(mock.history.get[0].url).to.equal("/foo");
    });
  });

  it("reset history should reset all history", function () {
    mock.onAny("/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      mock.resetHistory();
      expect(mock.history["get"]).to.eql([]);
    });
  });
});
