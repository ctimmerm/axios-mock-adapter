const axios = require("axios");
const expect = require("chai").expect;
const createServer = require("http").createServer;

const MockAdapter = require("../src");

describe("passThrough tests (requires Node)", function () {
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
    mock = new MockAdapter(instance);
  });

  it("allows selective mocking", function () {
    mock.onGet("/foo").reply(200, "bar");
    mock.onGet("/error").reply(200, "success");
    mock.onGet("/bar").passThrough();

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
      instance
        .get("/noHandler")
        .then(function (response) {
          // Mock adapter should return an error
          expect(true).to.be.false;
        })
        .catch(function (error) {
          expect(error).to.have.nested.property("response.status", 404);
        }),
    ]);
  });

  it("handles errors correctly", function () {
    mock.onGet("/error").passThrough();

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

  it("allows setting default passThrough handler", function () {
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
    mock = new MockAdapter(instance);

    mock.onAny().passThrough();
    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data).to.equal("http://localhost/test/foo");
    });
  });

  it("handle request with baseURL only", function () {
    mock.onAny().passThrough();

    return instance.get(undefined).then(function (response) {
      expect(response.data).to.equal("/");
    });
  });

  it("handles request transformations properly", function () {
    mock.onGet("/foo").passThrough();

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
    mock.onGet("/foo").passThrough();

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

  it("applies interceptors only once", function () {
    mock.onGet("/foo").passThrough();
    let requestCount = 0;
    let responseCount = 0;
    instance.interceptors.request.use(function (config) {
      requestCount++;
      return config;
    });

    instance.interceptors.response.use(function (config) {
      responseCount++;
      return config;
    });

    return instance.get("/foo")
      .then(function () {
        expect(requestCount).to.equal(1);
        expect(responseCount).to.equal(1);
      });
  });
});
