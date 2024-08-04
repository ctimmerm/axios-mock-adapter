var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter onAny", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("registers a handler for every HTTP method", function () {
    mock.onAny("/foo").reply(200);

    expect(mock.handlers["get"]).not.to.be.empty;
    expect(mock.handlers["post"]).not.to.be.empty;
    expect(mock.handlers["head"]).not.to.be.empty;
    expect(mock.handlers["delete"]).not.to.be.empty;
    expect(mock.handlers["patch"]).not.to.be.empty;
    expect(mock.handlers["put"]).not.to.be.empty;
    expect(mock.handlers["options"]).not.to.be.empty;
    expect(mock.handlers["list"]).not.to.be.empty;
    expect(mock.handlers["link"]).not.to.be.empty;
    expect(mock.handlers["unlink"]).not.to.be.empty;
  });

  it("mocks any request with a matching url", function () {
    mock.onAny("/foo").reply(200);

    return instance
      .head("/foo")
      .then(function () {
        return instance.patch("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("mocks any request with a matching url and body", function () {
    var body = [
      { object: { with: { deep: "property" } }, array: ["1", "abc"] },
      "a",
    ];
    mock.onAny("/anyWithBody", { data: body }).reply(200);

    return instance
      .put("/anyWithBody", body)
      .then(function () {
        return instance.post("/anyWithBody", body);
      })
      .then(function (response) {
        expect(response.status).to.equal(200);

        return instance.post("/anyWithBody")
          .then(function () {
            throw new Error("should not get here");
          })
          .catch(function (err) {
            expect(err.response.status).to.equal(404);
          });
      });
  });

  it("removes all handlers after replying with replyOnce", function () {
    mock.onAny("/foo").replyOnce(200);

    return instance.get("/foo").then(function () {
      expect(mock.handlers["get"]).to.be.empty;
      expect(mock.handlers["post"]).to.be.empty;
    });
  });
});
