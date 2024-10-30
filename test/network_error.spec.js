const axios = require("axios");
const expect = require("chai").expect;
const http = require("http");

const MockAdapter = require("../src");

describe("networkError spec", function () {
  let instance;
  let mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  describe("Without code", function() {
  it("mocks networkErrors", function () {
    mock.onGet("/foo").networkError();

    return instance.get("/foo").then(
      function () {
        expect.fail("should not be called");
      },
      function (error) {
        expect(error.config).to.exist;
        expect(error.response).to.not.exist;
        expect(error.message).to.equal("Network Error");
        expect(error.isAxiosError).to.be.true;
      }
    );
  });

  it("can mock a network error only once", function () {
    mock.onGet("/foo").networkErrorOnce().onGet("/foo").reply(200);

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
  });
  describe("With code", function () {
    function filterErrorKeys(key) {
      return key !== "config" && key !== "request" && key !== "stack";
    }

    async function compareErrors() {
      const url = arguments[0];
      const params = Array.from(arguments).slice(1);
      const errors = await Promise.all([
        axios.get.apply(axios, [instance.defaults.baseURL + url].concat(params)).then(function () {
          expect.fail("Should have rejected");
        }, function (error) {
          return error;
        }),
        instance.get.apply(instance, [url].concat(params)).then(function () {
          expect.fail("Should have rejected");
        }, function (error) {
          return error;
        })
      ]);
      const base = errors[0];
      const mocked = errors[1];
      const baseKeys = Object.keys(base).filter(filterErrorKeys);
      for (let i = 0; i < baseKeys.length; i++) {
        const key = baseKeys[i];
        expect(mocked[key], `Property ${key}`).to.deep.equal(base[key]);
      }
    }

    it("should look like base axios ENOTFOUND responses", function() {
      instance.defaults.baseURL = "https://not-exi.st:1234";
      mock.onGet("/some-url").networkError("ENOTFOUND");

      return compareErrors("/some-url");
    });

    it("should look like base axios ECONNREFUSED responses", function() {
      instance.defaults.baseURL = "http://127.0.0.1:4321";
      mock.onGet("/some-url").networkError("ECONNREFUSED");

      return compareErrors("/some-url");
    });

    it("should look like base axios ECONNRESET responses", function() {
      return new Promise(function(resolve) {
        const server = http.createServer(function(request) {
          request.destroy();
        }).listen(function() {
          resolve(server);
        });
      }).then(function(server) {
        instance.defaults.baseURL = `http://localhost:${  server.address().port}`;
        mock.onGet("/some-url").networkError("ECONNRESET");

        return compareErrors("/some-url").finally(function() {
          server.close();
        });
      });
    });

    it("should look like base axios ECONNABORTED responses", function() {
      return new Promise(function(resolve) {
        const server = http.createServer(function() {}).listen(function() {
          resolve(server);
        });
      }).then(function(server) {
        instance.defaults.baseURL = `http://localhost:${  server.address().port}`;
        mock.onGet("/some-url").networkError("ECONNABORTED");

        return compareErrors("/some-url", { timeout: 1 }).finally(function() {
          server.close();
        });
      });
    });

    it("should look like base axios ETIMEDOUT responses", function() {
      return new Promise(function(resolve) {
        const server = http.createServer(function() {}).listen(function() {
          resolve(server);
        });
      }).then(function(server) {
        instance.defaults.baseURL = `http://localhost:${  server.address().port}`;
        mock.onGet("/some-url").networkError("ETIMEDOUT");

        return compareErrors("/some-url", { timeout: 1 }).finally(function() {
          server.close();
        });
      });
    });

    // Did not found a way to simulate this
    it.skip("should look like base axios EHOSTUNREACH responses", function() {
      instance.defaults.baseURL = "TODO";
      mock.onGet("/some-url").networkError("EHOSTUNREACH");

      return compareErrors("/some-url");
    });
  });
});
