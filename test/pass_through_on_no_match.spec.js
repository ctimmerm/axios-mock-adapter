const axios = require("axios");
const expect = require("chai").expect;
const createServer = require("http").createServer;

const MockAdapter = require("../src");

describe("onNoMatch=passthrough option tests (requires Node)", function () {
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
          // Reply with path
          resp.end(req.url, "utf8");
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
    instance = axios.create({ baseURL: serverUrl });
    mock = new MockAdapter(instance, { onNoMatch: "passthrough" });
  });

  it("works correctly if set no handlers", function () {
    const randomPath = `xyz${Math.round(10000 * Math.random())}`;

    return Promise.all([
      instance.get(`/${randomPath}`).then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal(`/${randomPath}`);
      }),
    ]);
  });

  it("allows selective mocking", function () {
    mock.onGet("/foo").reply(200, "bar");
    mock.onGet("/error").reply(200, "success");
    mock.onGet("/bar").passThrough();

    const randomPath = `xyz${Math.round(10000 * Math.random())}`;

    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
      instance.get("/error").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("success");
      }),
      instance.get("/bar").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("/bar");
      }),
      instance.get(`/${randomPath}`).then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal(`/${randomPath}`);
      }),
    ]);
  });

  it("handles errors correctly", function () {
    return instance
      .get("/error")
      .then(function () {
        // The server should've returned an error
        expect(false).to.be.true;
      })
      .catch(function (error) {
        expect(error).to.have.nested.property("response.status", 500);
      });
  });

  it("setting passThrough handler don't break anything", function () {
    mock.onGet("/foo").reply(200, "bar").onAny().passThrough();

    const randomPath = `xyz${Math.round(10000 * Math.random())}`;

    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
      instance.get(`/${randomPath}`).then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal(`/${randomPath}`);
      }),
      instance.post("/post").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("/post");
      }),
    ]);
  });

  it("handles baseURL correctly", function () {
    instance = axios.create({
      baseURL: "http://localhost/test",
      proxy: {
        host: "127.0.0.1",
        port: httpServer.address().port,
      },
    });
    mock = new MockAdapter(instance, { onNoMatch: "passthrough" });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data).to.equal("http://localhost/test/foo");
    });
  });

  it("handles request transformations properly", function () {
    return instance
      .get("/foo", {
        data: "foo",
        transformRequest: [
          function (data) {
            return `${data}foo`;
          },
        ],
      })
      .then(function (response) {
        expect(response.config.data).to.equal("foofoo");
      });
  });

  it("handles response transformations properly", function () {
    return instance
      .get("/foo", {
        transformResponse: [
          function (data) {
            return `${data}foo`;
          },
        ],
      })
      .then(function (response) {
        expect(response.data).to.equal("/foofoo");
      });
  });
});
