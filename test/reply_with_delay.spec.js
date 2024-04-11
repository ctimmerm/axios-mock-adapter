var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter replyWithDelay", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("supports chaining", function () {
    mock
      .onGet("/foo")
      .replyWithDelay(10, 200)
      .onAny("/foo")
      .replyOnce(10, 300)
      .onPost("/foo")
      .replyOnce(10, 400);

    expect(mock.handlers["get"].length).to.equal(2);
    expect(mock.handlers["post"].length).to.equal(2);
  });

  it("replies as normally on the first call", function () {
    mock.onGet("/foo").replyWithDelay(10, 200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("replies only once", function () {
    var called = false;
    mock.onGet("/foo").replyWithDelay(10, 200);

    return instance
      .get("/foo")
      .then(function () {
        called = true;
        return instance.get("/foo");
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when used with onAny", function () {
    var called = false;
    mock.onAny("/foo").replyWithDelay(10, 200);

    return instance
      .get("/foo")
      .then(function () {
        called = true;
        return instance.post("/foo");
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when using request body matching", function () {
    var called = false;
    var body = "abc";
    mock.onPost("/onceWithBody", body).replyWithDelay(10, 200);

    return instance
      .post("/onceWithBody", body)
      .then(function () {
        called = true;
        return instance.post("/onceWithBody", body);
      })
      .catch(function (error) {
        expect(called).to.be.true;
        expect(error.response.status).to.equal(404);
      });
  });

  it("replies only once when using a function that returns a response", function () {
    mock
      .onGet("/foo")
      .replyOnce(function () {
        return [200];
      })
      .onGet("/foo")
      .replyOnce(function () {
        return [202];
      });

    return instance
      .get("/foo")
      .then(function (response) {
        expect(response.status).to.equal(200);
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(202);
      });
  });

  it("replies with delay", function () {
    mock.onGet("/foo").replyWithDelay(100, 200);

    var start = Date.now();
    return instance.get("/foo").then(function () {
      var end = Date.now();
      expect(end - start).to.be.above(100);
    });
  });
});
