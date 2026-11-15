const axios = require("axios");
const expect = require("chai").expect;
const MockAdapter = require("../src");

function record(value) {
  return Object.assign(Object.create(null), value);
}

describe("null-prototype request objects", function () {
  let instance;
  let mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  afterEach(function () {
    mock.restore();
  });

  function request(config) {
    return mock.adapter()(Object.assign({
      method: "get",
      url: "/foo",
      validateStatus: instance.defaults.validateStatus,
    }, config));
  }

  it("matches headers without a constructor", async function () {
    const headers = record({ "X-Test": "value" });
    mock.onGet("/foo", { headers: { "X-Test": "value" } }).reply(200);

    const response = await request({ headers });
    expect(response.status).to.equal(200);
    expect(response.config.headers).to.equal(headers);
    expect(Object.getPrototypeOf(headers)).to.equal(null);
  });

  it("matches headers with a null constructor value", async function () {
    const headers = record({ constructor: null });
    mock.onGet("/foo", { headers: { constructor: null } }).reply(200);

    const response = await request({ headers });
    expect(response.status).to.equal(200);
  });

  it("matches nested params while retaining non-record values", async function () {
    const params = record({
      filters: record({ enabled: false, limit: 0 }),
      items: [record({ id: 1 })],
      date: new Date("2020-01-01T00:00:00Z"),
      pattern: /value/i,
    });
    mock.onGet("/foo", { params: {
      filters: { enabled: false, limit: 0 },
      items: [{ id: 1 }],
      date: new Date("2020-01-01T00:00:00Z"),
      pattern: /value/i,
    } }).reply(200);

    const response = await request({ params });
    expect(response.status).to.equal(200);
    expect(response.config.params).to.equal(params);
    expect(Object.getPrototypeOf(params.filters)).to.equal(null);
    expect(Object.getPrototypeOf(params.items[0])).to.equal(null);
  });

  [false, true].forEach(function (nullPrototype) {
    it(`accepts null-prototype matchers with null-prototype request = ${nullPrototype}`, async function () {
      mock.onGet("/foo", { params: record({ id: 1 }) }).reply(200);

      const params = nullPrototype ? record({ id: 1 }) : { id: 1 };
      const response = await request({ params });
      expect(response.status).to.equal(200);
    });
  });

  [{ id: "1" }, { id: 1, extra: true }].forEach(function (params) {
    it(`rejects mismatched params ${JSON.stringify(params)}`, async function () {
      mock.onGet("/foo", { params: { id: 1 } }).reply(200);

      const error = await request({ params: record(params) }).catch(error => error);
      expect(error.response.status).to.equal(404);
    });
  });

  it("passes the original params to asymmetric matchers", async function () {
    const params = record({ id: 1 });
    mock.onGet("/foo", { params: {
      asymmetricMatch(actual) {
        expect(actual).to.equal(params);
        return actual.id === 1;
      },
    } }).reply(200);

    const response = await request({ params });
    expect(response.status).to.equal(200);
  });

  it("overwrites equivalent handlers regardless of record prototype", async function () {
    mock.onGet("/foo", { params: record({ id: 1 }) }).reply(200, "first");
    mock.onGet("/foo", { params: { id: 1 } }).reply(200, "second");

    expect(mock.handlers.get).to.have.lengthOf(1);
    const response = await request({ params: record({ id: 1 }) });
    expect(response.data).to.equal("second");
  });
});
