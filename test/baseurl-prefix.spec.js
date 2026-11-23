const axios = require("axios");
const expect = require("chai").expect;
const MockAdapter = require("../src");

describe("baseURL prefix boundaries", function () {
  const cases = [
    ["/app", "/appliance", "/appliance"],
    ["/app", "/appliance", "/app/appliance"],
    ["app", "appliance", "appliance"],
    ["https://example.org", "https://example.org.other.test/foo", "https://example.org.other.test/foo"],
    ["https://example.org", "https://example.org:8443/foo", "https://example.org:8443/foo"],
    ["https://example.org/api", "https://example.org/apiary", "https://example.org/apiary"],
    ["/app", "/a_ppliance", "/a_ppliance"],
    ["/app", "/app/foo", "/foo"],
    ["/app/", "/app/foo", "foo"],
    ["https://example.org/api", "https://example.org/api/foo", "/foo"],
    ["https://example.org/api", "https://example.org/api/foo", "https://example.org/api/foo"],
    ["https://example.org/api/", "/foo", "https://example.org/api/foo"],
    ["/app", "/app?query=value", "?query=value"],
    ["/app", "/app#fragment", "#fragment"],
    ["/app", "/app", ""],
  ];

  [false, true].forEach(function (useRegex) {
    cases.forEach(function ([baseURL, url, required]) {
      it(`matches ${url} with baseURL ${baseURL} against ${required} (regex=${useRegex})`, async function () {
        const instance = axios.create({ baseURL });
        const mock = new MockAdapter(instance);
        const matcher = useRegex
          ? new RegExp(`^${required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)
          : required;
        mock.onGet(matcher).reply(200, "matched");

        try {
          // Exercise both original URLs and those already expanded by Axios 0.17.
          const response = await mock.adapter()({ method: "get", url, baseURL });
          expect(response.status).to.equal(200);
          expect(response.data).to.equal("matched");
          expect(response.config.url).to.equal(url);
          expect(response.config.baseURL).to.equal(baseURL);
          expect(mock.history.get[0].url).to.equal(url);
        } finally {
          mock.restore();
        }
      });
    });

    it(`matches a real Axios request sharing only part of baseURL (regex=${useRegex})`, async function () {
      const instance = axios.create({ baseURL: "/app" });
      const mock = new MockAdapter(instance);
      mock.onGet(useRegex ? /^\/appliance$/ : "/appliance").reply(200, "matched");

      try {
        const response = await instance.get("/appliance");
        expect(response.data).to.equal("matched");
      } finally {
        mock.restore();
      }
    });

    it(`does not match a path produced by stripping a partial prefix (regex=${useRegex})`, async function () {
      const instance = axios.create({ baseURL: "/app" });
      const mock = new MockAdapter(instance);
      mock.onGet(useRegex ? /^liance$/ : "liance").reply(200);

      try {
        const response = await mock.adapter()({ method: "get", url: "/appliance", baseURL: "/app" });
        expect(response.status).to.equal(404);
      } finally {
        mock.restore();
      }
    });
  });
});
