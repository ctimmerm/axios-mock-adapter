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

  // Jest's ObjectContaining matchers share a custom toString implementation.
  // Deep equality must not mistake that description for matcher identity.
  class Contains {
    constructor (sample) {
      this.sample = sample;
    }

    asymmetricMatch (actual) {
      return actual && actual.choice === this.sample;
    }

    toString () {
      return "ObjectContaining";
    }
  }

  ["data", "params", "headers"].forEach(function (field) {
    it(`keeps distinct ${field} matchers with the same description`, async function () {
      const first = { [field]: new Contains("first") };
      const second = { [field]: new Contains("second") };
      mock.onGet("/choices", first).reply(200, "first");
      mock.onGet("/choices", second).reply(200, "second");

      const firstResponse = await instance.get("/choices", { [field]: { choice: "first" } });
      const secondResponse = await instance.get("/choices", { [field]: { choice: "second" } });
      expect(firstResponse.data).to.equal("first");
      expect(secondResponse.data).to.equal("second");
    });

    it(`replaces a handler when the same ${field} matcher is reused`, async function () {
      const config = { [field]: new Contains("same") };
      mock.onGet("/choices", config).reply(200, "old");
      mock.onGet("/choices", config).reply(200, "new");

      expect(mock.handlers.get).to.have.length(1);
      const response = await instance.get("/choices", { [field]: { choice: "same" } });
      expect(response.data).to.equal("new");
    });
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
