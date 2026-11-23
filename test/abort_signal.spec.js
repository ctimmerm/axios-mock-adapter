"use strict";

const assert = require("assert");
const axios = require("axios");
const MockAdapter = require("../src");

describe("AbortSignal cancellation", function () {
  let instance;
  let mock;

  beforeEach(function () {
    instance = axios.create();
    mock = new MockAdapter(instance);
  });

  afterEach(function () {
    mock.restore();
  });

  function nextTurn() {
    return new Promise(resolve => setImmediate(resolve));
  }

  it("rejects a pending reply before its promise settles", async function () {
    const controller = new AbortController();
    let complete;
    mock.onGet("/slow").reply(() => new Promise(resolve => {
 complete = resolve;
}));
    let error;
    const pending = instance.get("/slow", { signal: controller.signal }).catch(value => {
 error = value;
});
    await nextTurn();
    controller.abort();
    await nextTurn();
    const immediate = error;
    complete([200, "too late"]);
    await pending;
    assert(axios.isCancel(immediate));
    assert.strictEqual(immediate.code, "ERR_CANCELED");
    assert.strictEqual(immediate.config.url, "/slow");
    assert.strictEqual(mock.history.get.length, 1);
  });

  it("clears the response delay without invoking the reply", async function () {
    const originalSet = global.setTimeout;
    const originalClear = global.clearTimeout;
    const timer = {};
    let callback;
    let cleared = false;
    let called = false;
    const controller = new AbortController();
    mock.delayResponse = 123456;
    mock.onGet("/delayed").reply(() => {
 called = true; return [200];
});
    global.setTimeout = (fn, delay, ...args) => {
      if (delay === 123456) {
 callback = fn; return timer;
}
      return originalSet(fn, delay, ...args);
    };
    global.clearTimeout = handle => {
      if (handle === timer) {
 cleared = true; return;
}
      return originalClear(handle);
    };
    let error;
    try {
      const pending = instance.get("/delayed", { signal: controller.signal }).catch(value => {
 error = value;
});
      await nextTurn();
      assert.strictEqual(typeof callback, "function");
      controller.abort();
      await nextTurn();
      const immediate = error;
      if (!cleared) callback(); // Let the baseline request finish as well.
      await pending;
      assert(axios.isCancel(immediate));
      assert(cleared);
      assert.strictEqual(called, false);
    } finally {
      global.setTimeout = originalSet;
      global.clearTimeout = originalClear;
    }
  });

  [200, 500, "rejection"].forEach(status => {
    it(`removes its listener after ${status} without canceling`, async function () {
      const controller = new AbortController();
      const signal = controller.signal;
      const active = new Set();
      const add = signal.addEventListener.bind(signal);
      const remove = signal.removeEventListener.bind(signal);
      signal.addEventListener = (type, listener, options) => {
        if (type === "abort") active.add(listener);
        return add(type, listener, options);
      };
      signal.removeEventListener = (type, listener, options) => {
        if (type === "abort") active.delete(listener);
        return remove(type, listener, options);
      };
      const failure = new Error("reply failed");
      mock.onGet("/done").reply(() => {
        return status === "rejection" ? Promise.reject(failure) : [status, "body"];
      });
      let result;
      let error;
      try {
 result = await instance.get("/done", { signal });
} catch (value) {
 error = value;
}
      assert.strictEqual(active.size, 0);
      if (status === 200) assert.strictEqual(result.status, 200);
      else if (status === "rejection") assert.strictEqual(error, failure);
      else assert.strictEqual(error.response.status, 500);
      controller.abort();
    });
  });

  it("does not invoke a handler for an already aborted signal", async function () {
    const controller = new AbortController();
    controller.abort();
    mock.onGet("/never").reply(() => {
 throw new Error("unexpected reply");
});
    await assert.rejects(instance.get("/never", { signal: controller.signal }), axios.isCancel);
    assert.strictEqual(mock.history.get.length, 0);
  });

  it("consumes a late rejected reply after cancellation", async function () {
    const controller = new AbortController();
    let fail;
    mock.onGet("/slow").reply(() => new Promise((_resolve, reject) => {
 fail = reject;
}));
    let error;
    const pending = instance.get("/slow", { signal: controller.signal }).catch(value => {
 error = value;
});
    await nextTurn();
    controller.abort();
    await nextTurn();
    const immediate = error;
    fail(new Error("late failure"));
    await pending;
    await nextTurn();
    assert(axios.isCancel(immediate));
    assert.strictEqual(error, immediate);
  });
});
