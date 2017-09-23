import axios from "axios";
import MockAdapter = require("axios-mock-adapter");

const instance = axios.create();
const mock = new MockAdapter(instance);

namespace AllowsConstructing {
  new MockAdapter(instance);
}

namespace AllowsConstructingWithOptions {
  new MockAdapter(instance, {
    delayResponse: 2000,
  });
}

namespace SupportsReset {
  mock.reset();
}

namespace SupportsRestore {
  mock.restore();
}

namespace SupportsAllHttpVerbs {
  mock.onGet;
  mock.onPost;
  mock.onPut;
  mock.onHead;
  mock.onDelete;
  mock.onPatch;
}

namespace SupportsAnyVerb {
  mock.onAny;
}

namespace AllowsVerbOnlyMatcher {
  mock.onGet();
}

namespace AllowsUrlMatcher {
  mock.onGet("/foo");
}

namespace AllowsUrlRegExpMatcher {
  mock.onGet(/\/fo+/);
}

namespace AllowsBodyMatcher {
  mock.onGet("/foo", {
    id: 4,
    name: "foo",
  });
}

namespace AllowsParameterMatcher {
  mock.onGet("/foo", {
    params: {
      searchText: "John",
    },
  });
}

namespace AllowsReplyWithStatus {
  mock.onGet().reply(200);
}

namespace SupportsReplyOnce {
  mock.onGet().replyOnce(200);
}

namespace SupportsPassThrough {
  mock.onGet().passThrough();
}

namespace SupportsTimeout {
  mock.onGet().timeout();
}

namespace AllowsFunctionReply {
  // TODO
}

namespace AllowsPromiseReply {
  // TODO
}

namespace SupportsChanining {
  mock
    .onGet("/users").reply(200, [/* users */])
    .onGet("/posts").reply(200, [/* posts */]);
}
