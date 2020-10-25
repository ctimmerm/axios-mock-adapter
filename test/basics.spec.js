var axios = require("axios");
var fs = require("fs");
var expect = require("chai").expect;

var MockAdapter = require("../src");

describe("MockAdapter basics", function () {
  var instance;
  var mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("correctly sets the adapter on the axios instance", function () {
    expect(instance.defaults.adapter).to.exist;
  });

  it("calls interceptors", function () {
    instance.interceptors.response.use(
      function (config) {
        return config.data;
      },
      function (error) {
        return Promise.reject(error);
      }
    );

    mock.onGet("/foo").reply(200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.foo).to.equal("bar");
    });
  });

  it("supports all verbs", function () {
    expect(mock.onGet).to.be.a("function");
    expect(mock.onPost).to.be.a("function");
    expect(mock.onPut).to.be.a("function");
    expect(mock.onHead).to.be.a("function");
    expect(mock.onDelete).to.be.a("function");
    expect(mock.onPatch).to.be.a("function");
    expect(mock.onOptions).to.be.a("function");
    expect(mock.onList).to.be.a("function");
  });

  it("mocks requests", function () {
    mock.onGet("/foo").reply(200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("exposes the adapter", function () {
    expect(mock.adapter()).to.be.a("function");

    instance.defaults.adapter = mock.adapter();

    mock.onGet("/foo").reply(200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("can return headers", function () {
    mock.onGet("/foo").reply(
      200,
      {},
      {
        foo: "bar",
      }
    );

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.headers.foo).to.equal("bar");
    });
  });

  it("accepts a callback that returns a response", function () {
    mock.onGet("/foo").reply(function () {
      return [200, { foo: "bar" }];
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("accepts a callback that returns an axios request", function () {
    mock
      .onGet("/bar")
      .reply(200, { foo: "bar" })
      .onGet("/foo")
      .reply(function () {
        return instance.get("/bar");
      });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.config.url).to.equal("/bar");
      expect(response.data.foo).to.equal("bar");
    });
  });

  it("matches on a regex", function () {
    mock.onGet(/\/fo+/).reply(200);

    return instance.get("/foooooooooo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("can pass query params for get to match to a handler", function () {
    mock
      .onGet("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance
      .get("/withParams", { params: { bar: "foo", foo: "bar" }, in: true })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("can pass query params for delete to match to a handler", function () {
    mock
      .onDelete("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance
      .delete("/withParams", { params: { bar: "foo", foo: "bar" }, in: true })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("can pass query params for head to match to a handler", function () {
    mock
      .onHead("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance
      .head("/withParams", { params: { bar: "foo", foo: "bar" }, in: true })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("can't pass query params for post to match to a handler", function () {
    mock
      .onPost("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance
      .post("/withParams", { params: { foo: "bar", bar: "foo" }, in: true })
      .catch(function (error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it("can't pass query params for put to match to a handler", function () {
    mock
      .onPut("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance
      .put("/withParams", { params: { bar: "foo", foo: "bar" }, in: true })
      .catch(function (error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it("can pass query params to match to a handler with uppercase method", function () {
    mock
      .onGet("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);

    return instance({
      method: "GET",
      url: "/withParams",
      params: { foo: "bar", bar: "foo" },
    }).then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("does not match when parameters are wrong", function () {
    mock
      .onGet("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);
    return instance
      .get("/withParams", { params: { foo: "bar", bar: "other" } })
      .catch(function (error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it("does not match when parameters are missing", function () {
    mock
      .onGet("/withParams", { params: { foo: "bar", bar: "foo" } })
      .reply(200);
    return instance.get("/withParams").catch(function (error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it("matches when parameters were not expected", function () {
    mock.onGet("/withParams").reply(200);
    return instance
      .get("/withParams", { params: { foo: "bar", bar: "foo" } })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("can pass a body to match to a handler", function () {
    mock.onPost("/withBody", { body: { is: "passed" }, in: true }).reply(200);

    return instance
      .post("/withBody", { body: { is: "passed" }, in: true })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("does not match when body is wrong", function () {
    var body = { body: { is: "passed" }, in: true };
    mock.onPatch("/wrongObjBody", body).reply(200);

    return instance
      .patch("/wrongObjBody", { wrong: "body" })
      .catch(function (error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it("does not match when string body is wrong", function () {
    mock.onPatch("/wrongStrBody", "foo").reply(200);

    return instance.patch("/wrongStrBody", "bar").catch(function (error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it("does match with string body", function () {
    mock.onPatch(/^\/strBody$/, "foo").reply(200);

    return instance.patch("/strBody", "foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("can pass headers to match to a handler", function () {
    var headers = {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/x-www-form-urlencoded",
      "Header-test": "test-header",
    };

    mock.onPost("/withHeaders", undefined, headers).reply(200);

    return instance
      .post("/withHeaders", undefined, { headers: headers })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("does not match when request header is wrong", function () {
    var headers = { "Header-test": "test-header" };
    mock.onPatch("/wrongObjHeader", undefined, headers).reply(200);

    return instance
      .patch("/wrongObjHeader", undefined, {
        headers: { "Header-test": "wrong-header" },
      })
      .catch(function (error) {
        expect(error.response.status).to.equal(404);
      });
  });

  it("passes the config to the callback", function () {
    mock.onGet(/\/products\/\d+/).reply(function (config) {
      return [200, {}, { RequestedURL: config.url }];
    });

    return instance.get("/products/25").then(function (response) {
      expect(response.headers.RequestedURL).to.equal("/products/25");
    });
  });

  it("handles post requests", function () {
    mock.onPost("/foo").reply(function (config) {
      return [200, JSON.parse(config.data).bar];
    });

    return instance.post("/foo", { bar: "baz" }).then(function (response) {
      expect(response.data).to.equal("baz");
    });
  });

  it("works when using baseURL", function () {
    instance.defaults.baseURL = "http://www.example.org";

    mock.onGet("/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("allows using an absolute URL when a baseURL is set", function () {
    instance.defaults.baseURL = "http://www.example.org";

    mock.onAny().reply(function (config) {
      return [200, config.url];
    });

    return instance.get("http://www.foo.com/bar").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data).to.equal("http://www.foo.com/bar");
    });
  });

  // https://github.com/ctimmerm/axios-mock-adapter/issues/74
  it("allows mocks to match on the result of concatenating baseURL and url", function () {
    instance.defaults.baseURL = "http://www.example.org/api/v1/";

    mock.onGet("http://www.example.org/api/v1/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  // https://github.com/ctimmerm/axios-mock-adapter/issues/74
  it("allows mocks to match on the result of concatenating baseURL and url with a regex", function () {
    instance.defaults.baseURL = "http://www.example.org/api/v1/";

    mock.onGet(/\/api\/v1\/foo$/).reply(200);

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("allows multiple consecutive requests for the mocked url", function () {
    mock.onGet("/foo").reply(200);

    return instance
      .get("/foo")
      .then(function () {
        return instance.get("/foo");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("returns a 404 when no matching url is found", function () {
    return instance.get("/foo").catch(function (error) {
      expect(error.response.status).to.equal(404);
    });
  });

  it("rejects when the status is >= 300", function () {
    mock.onGet("/moo").reply(500);

    return instance.get("/moo").catch(function (error) {
      expect(error.response.status).to.equal(500);
    });
  });

  it("rejects the promise with an error when the status is >= 300", function () {
    mock.onGet("/foo").reply(500);

    return instance.get("/foo").catch(function (error) {
      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.match(/request failed/i);
    });
  });

  it("supports providing a validateStatus function", function () {
    instance.defaults.validateStatus = function () {
      return true;
    };
    mock.onGet("/foo").reply(500);

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(500);
    });
  });

  it("respects validatesStatus when requesting unhandled urls", function () {
    instance.defaults.validateStatus = function () {
      return true;
    };

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(404);
    });
  });

  it("handles errors thrown as expected", function () {
    mock.onGet("/foo").reply(function () {
      throw new Error("bar");
    });

    return instance.get("/foo").catch(function (error) {
      expect(error).to.be.an.instanceof(Error);
      expect(error.message).to.equal("bar");
    });
  });

  it("restores the previous adapter (if any)", function () {
    var adapter = function () {};
    var newInstance = axios.create();
    newInstance.defaults.adapter = adapter;
    var newMock = new MockAdapter(newInstance);
    newMock.restore();

    expect(newInstance.defaults.adapter).to.equal(adapter);
  });

  it("performs a noop when restore is called more than once", function () {
    mock.restore();
    var newAdapter = function () {};
    instance.defaults.adapter = newAdapter;
    mock.restore();
    expect(instance.defaults.adapter).to.equal(newAdapter);
  });

  it("resets the registered mock handlers", function () {
    mock.onGet("/foo").reply(200);
    expect(mock.handlers["get"]).not.to.be.empty;

    mock.reset();
    expect(mock.handlers["get"]).to.be.empty;
  });

  it("resets the history", function () {
    mock.onAny("/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      mock.reset();
      expect(mock.history["get"]).to.eql([]);
    });
  });

  it("resets only the registered mock handlers, not the history", function () {
    mock.onAny("/foo").reply(200);
    expect(mock.handlers["get"]).not.to.be.empty;
    expect(mock.history["get"]).to.eql([]);

    return instance.get("/foo").then(function (response) {
      mock.resetHandlers();
      expect(mock.history.get.length).to.equal(1);
      expect(mock.handlers["get"]).to.be.empty;
    });
  });

  it("does not fail if reset is called after restore", function () {
    mock.restore();
    expect(mock.reset()).to.not.throw;
  });

  it("can chain calls to add mock handlers", function () {
    mock
      .onGet("/foo")
      .reply(200)
      .onAny("/bar")
      .reply(404)
      .onPost("/baz")
      .reply(500);

    expect(mock.handlers["get"].length).to.equal(2);
    expect(mock.handlers["patch"].length).to.equal(1);
    expect(mock.handlers["post"].length).to.equal(2);
  });

  it("allows to delay responses", function () {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet("/foo").reply(200);

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("allows to delay error responses", function () {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet("/foo").reply(500);

    return instance.get("/foo").catch(function (error) {
      expect(error.response.status).to.equal(500);
    });
  });

  it("allows to delay responses when the response promise is rejected", function () {
    mock = new MockAdapter(instance, { delayResponse: 1 });

    mock.onGet("/foo").reply(function (config) {
      return Promise.reject("error");
    });

    return instance.get("/foo").catch(function (message) {
      expect(message).to.equal("error");
    });
  });

  it("maps empty GET path to any path", function () {
    mock.onGet("/foo").reply(200, "foo").onGet().reply(200, "bar");

    return Promise.all([
      instance.get("/foo").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("foo");
      }),
      instance.get("/bar").then(function (response) {
        expect(response.status).to.equal(200);
        expect(response.data).to.equal("bar");
      }),
      instance
        .get("/xyz" + Math.round(100000 * Math.random()))
        .then(function (response) {
          expect(response.status).to.equal(200);
          expect(response.data).to.equal("bar");
        }),
    ]);
  });

  it("allows mocking all requests", function () {
    mock.onAny().reply(200);

    function anyResponseTester(response) {
      expect(response.status).to.equal(200);
    }

    return Promise.all([
      instance.get("/foo").then(anyResponseTester),
      instance.post("/bar").then(anyResponseTester),
      instance.put("/foobar").then(anyResponseTester),
      instance.head("/barfoo").then(anyResponseTester),
      instance.delete("/foo/bar").then(anyResponseTester),
      instance.patch("/bar/foo").then(anyResponseTester),
    ]);
  });

  it("returns a deep copy of the mock data in the response when the data is an object", function () {
    var data = {
      foo: {
        bar: 123,
      },
    };

    mock.onGet("/").reply(200, data);

    return instance
      .get("/")
      .then(function (response) {
        response.data.foo.bar = 456;
      })
      .then(function () {
        expect(data.foo.bar).to.equal(123);
      });
  });

  it("returns a deep copy of the mock data in the response when the data is an array", function () {
    var data = [
      {
        bar: 123,
      },
    ];

    mock.onGet("/").reply(200, data);

    return instance
      .get("/")
      .then(function (response) {
        response.data[0].bar = 456;
      })
      .then(function () {
        expect(data[0].bar).to.equal(123);
      });
  });

  it("can overwrite an existing mock", function () {
    mock.onGet("/").reply(500);
    mock.onGet("/").reply(200);

    return instance.get("/").then(function (response) {
      expect(response.status).to.equal(200);
    });
  });

  it("does not add duplicate handlers", function () {
    mock.onGet("/").replyOnce(312);
    mock.onGet("/").reply(200);
    mock.onGet("/1").reply(200);
    mock.onGet("/2").reply(200);
    mock.onGet("/3").replyOnce(300);
    mock.onGet("/3").reply(200);
    mock.onGet("/4").reply(200);

    expect(mock.handlers["get"].length).to.equal(7);
  });

  it("supports chaining on same path with different params", function () {
    mock
      .onGet("/users", { params: { searchText: "John" } })
      .reply(200, { id: 1 })
      .onGet("/users", { params: { searchText: "James" } })
      .reply(200, { id: 2 })
      .onGet("/users", { params: { searchText: "Jake" } })
      .reply(200, { id: 3 })
      .onGet("/users", { params: { searchText: "Jackie" } })
      .reply(200, { id: 4 });

    return instance
      .get("/users", { params: { searchText: "John" } })
      .then(function (response) {
        expect(response.data.id).to.equal(1);
        return instance.get("/users", { params: { searchText: "James" } });
      })
      .then(function (response) {
        expect(response.data.id).to.equal(2);
        return instance.get("/users", { params: { searchText: "Jake" } });
      })
      .then(function (response) {
        expect(response.data.id).to.equal(3);
        return instance.get("/users", { params: { searchText: "Jackie" } });
      })
      .then(function (response) {
        expect(response.data.id).to.equal(4);
      });
  });

  it("can overwrite replies", function () {
    mock.onGet("/").reply(500);
    mock.onGet("/").reply(200);
    mock.onGet("/").reply(401);

    return instance.get("/").catch(function (error) {
      expect(mock.handlers["get"].length).to.equal(1);
      expect(error.response.status).to.equal(401);
    });
  });

  it("can overwrite replies using RegEx", function () {
    mock.onGet(/foo\/bar/).reply(500);
    mock.onGet(/foo\/bar/).reply(200);
    mock.onGet(/foo\/baz\/.+/).reply(200);

    return instance
      .get("/foo/bar")
      .then(function (response) {
        expect(mock.handlers["get"].length).to.equal(2);
        expect(response.status).to.equal(200);
        return instance.get("/foo/baz/56");
      })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("allows overwriting only on reply if replyOnce was used first", function () {
    var counter = 0;
    mock.onGet("/").replyOnce(500);
    mock.onGet("/").reply(200);
    mock.onGet("/").reply(401);

    return instance
      .get("/")
      .catch(function (error) {
        expect(error.response.status).to.equal(500);
        counter += 1;
        return instance.get("/");
      })
      .catch(function (error) {
        expect(error.response.status).to.equal(401);
        counter += 1;
      })
      .then(function () {
        expect(counter).to.equal(2);
      });
  });

  it("should not allow overwriting only on reply if replyOnce wasn't used first", function () {
    var counter = 0;
    mock.onGet("/").reply(200);
    mock.onGet("/").reply(401);
    mock.onGet("/").replyOnce(500);
    mock.onGet("/").reply(500);

    return instance
      .get("/")
      .catch(function (error) {
        expect(error.response.status).to.equal(500);
        counter += 1;
        return instance.get("/");
      })
      .catch(function (error) {
        expect(error.response.status).to.equal(500);
        counter += 1;
      })
      .then(function () {
        expect(counter).to.equal(2);
      });
  });

  it("allows overwriting mocks with parameters", function () {
    mock
      .onGet("/users", { params: { searchText: "John" } })
      .reply(500)
      .onGet("/users", { params: { searchText: "John" } })
      .reply(200, { id: 1 });

    return instance
      .get("/users", { params: { searchText: "John" } })
      .then(function (response) {
        expect(response.status).to.equal(200);
      });
  });

  it("allows overwriting mocks with headers", function () {
    mock.onGet("/", {}, { "Accept-Charset": "utf-8" }).reply(500);
    mock.onGet("/", {}, { "Accept-Charset": "utf-8" }).reply(200);

    expect(mock.handlers["get"].length).to.equal(1);
    expect(mock.handlers["get"][0][3]).to.equal(200);
  });

  it("supports a retry", function () {
    mock.onGet("/").replyOnce(401);
    mock.onGet("/").replyOnce(201);
    instance.interceptors.response.use(undefined, function (error) {
      if (error.response && error.response.status === 401) {
        return instance(error.config);
      }
      return Promise.reject(error);
    });
    return instance({ method: "get", url: "/" }).then(function (response) {
      expect(response.status).to.equal(201);
    });
  });

  it("allows sending a stream as response", function (done) {
    instance.defaults.baseURL = "http://www.example.org";

    mock.onAny().reply(function (config) {
      return [200, fs.createReadStream(__filename)];
    });

    instance
      .get("http://www.foo.com/bar", { responseType: "stream" })
      .then(function (response) {
        expect(response.status).to.equal(200);
        var stream = response.data;
        var string = "";
        stream.on("data", function (chunk) {
          string += chunk.toString("utf8");
        });
        stream.on("end", function () {
          expect(string).to.equal(fs.readFileSync(__filename, "utf8"));
          done();
        });
      });
  });

  it("allows sending a buffer as response", function () {
    instance.defaults.baseURL = "http://www.example.org";

    mock.onAny().reply(function (config) {
      return [200, Buffer.from("fooBar", "utf8")];
    });

    return instance
      .get("http://www.foo.com/bar", { responseType: "stream" })
      .then(function (response) {
        expect(response.status).to.equal(200);
        var string = response.data.toString("utf8");
        expect(string).to.equal("fooBar");
      });
  });

  it("allows sending an array as response", function () {
    mock.onGet("/").reply(200, [1, 2, 3]);

    return instance.get("/").then(function (response) {
      expect(response.data).to.deep.equal([1, 2, 3]);
    });
  });

  it("allows sending an Uint8Array as response", function () {
    var buffer = new ArrayBuffer(1);
    var view = new Uint8Array(buffer);
    view[0] = 0xff;

    mock.onGet("/").reply(200, buffer);

    return instance({
      url: "/",
      method: "GET",
      responseType: "arraybuffer",
    }).then(function (response) {
      var view = new Uint8Array(response.data);
      expect(view[0]).to.equal(0xff);
    });
  });

  it("returns the original request url in the response.request.responseURL property", function () {
    mock.onGet("/foo").reply(200, {
      foo: "bar",
    });

    return instance.get("/foo").then(function (response) {
      expect(response.status).to.equal(200);
      expect(response.data.foo).to.equal("bar");
      expect(response.request.responseURL).to.equal("/foo");
    });
  });

  it("sets isAxiosError property on errors", function () {
    mock.onGet("/").reply(404);

    return instance
      .get("/")
      .then(function () {
        expect(true).to.be.false;
      })
      .catch(function (error) {
        expect(error.isAxiosError).to.be.true;
      });
  });

  it("sets toJSON method on errors", function () {
    mock.onGet("/").reply(404);

    return instance
      .get("/")
      .then(function () {
        expect(true).to.be.false;
      })
      .catch(function (error) {
        var serializableError = error.toJSON();
        expect(serializableError.message).to.equal(
          "Request failed with status code 404"
        );
        expect(serializableError.name).to.equal("Error");
        expect(serializableError.stack).to.exist;
        expect(serializableError.config).to.exist;
      });
  });
});
