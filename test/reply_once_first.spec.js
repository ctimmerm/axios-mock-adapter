const axios = require("axios");
const expect = require("chai").expect;
const MockAdapter = require("../src");

describe("MockAdapter replyOnceFirst", function () {
  let instance;
  let mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  it("runs priority replies in registration order before an existing default", async function () {
    mock.onGet("/foo").reply(200, "default");
    mock.onGet("/foo").replyOnceFirst(200, "first")
      .onGet("/foo").replyOnceFirst(200, "second");
    const replies = [];
    for (let i = 0; i < 4; i++) replies.push((await instance.get("/foo")).data);
    expect(replies).to.deep.equal(["first", "second", "default", "default"]);
  });

  it("lets onAny override a specific handler for one matching request", async function () {
    mock.onGet("/foo").reply(200, "default");
    mock.onAny().replyOnceFirst(503);
    try {
      await instance.get("/foo");
      throw new Error("Expected the priority response to reject");
    } catch (error) {
      expect(error.response.status).to.equal(503);
    }
    expect((await instance.get("/foo")).data).to.equal("default");
  });

  it("does not consume a priority reply on a body or method mismatch", async function () {
    mock.onAny().reply(200, "default");
    mock.onPost("/foo", { choice: 1 }).replyOnceFirst(200, "match");
    expect((await instance.get("/foo")).data).to.equal("default");
    expect((await instance.post("/foo", { choice: 2 })).data).to.equal("default");
    expect((await instance.post("/foo", { choice: 1 })).data).to.equal("match");
    expect((await instance.post("/foo", { choice: 1 })).data).to.equal("default");
  });

  it("consumes async priority callbacks before concurrent requests and retains delay", async function () {
    mock.onGet("/foo").reply(200, "default");
    mock.onGet("/foo").withDelayInMs(1).replyOnceFirst(async config => [200, config.url]);
    expect(mock.handlers.get[0].delay).to.equal(1);
    const responses = await Promise.all([instance.get("/foo"), instance.get("/foo")]);
    expect(responses.map(response => response.data)).to.deep.equal(["/foo", "default"]);
  });

  it("clears priority handlers with resetHandlers", function () {
    mock.onAny().replyOnceFirst(200);
    mock.resetHandlers();
    expect(mock.handlers).to.have.length(0);
  });

  it("preserves replyOnce registration order behind an earlier default", async function () {
    mock.onGet("/foo").reply(200, "default");
    mock.onGet("/foo").replyOnce(200, "ordinary once");
    expect((await instance.get("/foo")).data).to.equal("default");
    expect((await instance.get("/foo")).data).to.equal("default");
  });
});
