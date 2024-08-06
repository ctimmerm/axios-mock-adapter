const axios = require("axios");
const expect = require("chai").expect;

const MockAdapter = require("../src");

describe("MockAdapter on default axios instance", function () {
  let mock;

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
