var axios = require("axios");
var expect = require("chai").expect;

var MockAdapter = require("../src");
var CancelToken = axios.CancelToken;

describe("MockAdapter basics", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("handles canceled requests", function () {
    var source = CancelToken.source();

    mock.onGet("/foo").reply(200);

    source.cancel("Operation canceled");

    return instance
      .get("/foo", {
        cancelToken: source.token,
      })
      .then(function () {
        expect(true).to.be.false;
      })
      .catch(function (error) {
        expect(axios.isCancel(error)).to.be.true;
        expect(error.message).to.equal("Operation canceled");
      });
  });

  it("works as normal is request is not canceled", function () {
    var source = CancelToken.source();

    mock.onGet("/foo").reply(200);

    return instance
      .get("/foo", {
        cancelToken: source.token,
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });
});
