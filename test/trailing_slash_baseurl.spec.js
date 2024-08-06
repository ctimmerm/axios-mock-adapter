const axios = require("axios");
const expect = require("chai").expect;
const createServer = require("http").createServer;

const MockAdapter = require("../src");

describe("trailing slash in axios baseUrl issue (requires Node)", function () {
  let instance;
  let mock;
  let httpServer;
  let serverUrl;

  before("set up Node server", function () {
    return new Promise(function (resolve, reject) {
      httpServer = createServer(function (req, resp) {
        if (req.url === "/error") {
          resp.statusCode = 500;
          resp.end();
        } else {
          resp.statusCode = 200;
          // Reply with path minus leading /
          resp.end(req.url.slice(1), "utf8");
        }
      })
        .listen(0, "127.0.0.1", function () {
          serverUrl = `http://127.0.0.1:${httpServer.address().port}`;
          resolve();
        })
        .on("error", reject);
    });
  });

  after(function () {
    httpServer.close();
  });

  beforeEach(function () {
    instance = axios.create({ baseURL: `${serverUrl}/` }); // baseUrl has a trailing slash
    mock = new MockAdapter(instance);
  });

  it("axios should handle trailing slash in baseUrl", function () {
    // passes
    mock.onAny().passThrough();
    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("foo");
      }),
      instance.get("foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("foo");
      }),
    ]);
  });

  it("mock adapter should handle trailing slash in baseUrl", function () {
    // both fail: 404
    mock.onGet("/foo").reply(200, "bar");
    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
      instance.get("foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
    ]);
  });
});
