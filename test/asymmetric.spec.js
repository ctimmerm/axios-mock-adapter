const axios = require("axios");
const expect = require("chai").expect;
const MockAdapter = require("../src");

describe("MockAdapter asymmetric matchers", function () {
  let instance;
  let mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("mocks a post request with a body matching the matcher", function () {
    mock
      .onPost("/anyWithBody", {
        asymmetricMatch: function (actual) {
          return actual.params === "1";
        },
      })
      .reply(200);

    return instance
      .post("/anyWithBody", { params: "1" })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("mocks a post request with a body not matching the matcher", function () {
    mock
      .onPost("/anyWithBody", {
        asymmetricMatch: function (actual) {
          return actual.params === "1";
        },
      })
      .reply(200);

    return instance
      .post("/anyWithBody", { params: "2" })
      .catch(function (error) {
        expect(error.message).to.eq("Request failed with status code 404");
      });
  });
});
