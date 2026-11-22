const axios = require("axios");
const expect = require("chai").expect;
const MockAdapter = require("../src");

describe("Request history snapshots", function () {
  [false, true].forEach(function (mutateHeaders) {
    it(`preserves headers across a retry (mutate=${mutateHeaders})`, async function () {
      const instance = axios.create();
      const mock = new MockAdapter(instance);
      mock.onPost("/retry").replyOnce(200, { retry: true }).onPost("/retry").reply(200);
      instance.interceptors.response.use(function (response) {
        if (response.data && response.data.retry) {
          const config = response.config;
          if (mutateHeaders) {
            config.headers.set("AccessToken", "new-token");
          } else {
            config.headers = { ...config.headers, AccessToken: "new-token" };
          }
          return instance.request(config);
        }
        return response;
      });
      await instance.post("/retry", {}, { headers: { AccessToken: "old-token" } });
      expect(mock.history.post).to.have.length(2);
      expect(mock.history.post[0].headers.AccessToken).to.equal("old-token");
      expect(mock.history.post[1].headers.AccessToken).to.equal("new-token");
      expect(mock.history.post[0].headers).to.be.instanceOf(axios.AxiosHeaders);
      mock.restore();
    });
  });

  it("keeps the recorded URL when response config is changed", async function () {
    const instance = axios.create();
    const mock = new MockAdapter(instance);
    mock.onGet("/original").reply(200);
    const response = await instance.get("/original");
    response.config.url = "/changed";
    expect(mock.history.get[0].url).to.equal("/original");
    expect(mock.history[0]).to.equal(mock.history.get[0]);
    mock.restore();
  });
});
