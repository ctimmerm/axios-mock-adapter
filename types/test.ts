import axios from 'axios';
import MockAdapter = require('axios-mock-adapter');

const instance = axios.create();
let mock = new MockAdapter(instance);
mock = new MockAdapter.default(instance)

namespace AllowsConstructing {
  new MockAdapter(instance);
}

namespace AllowsConstructingWithOptions {
  new MockAdapter(instance, {
    delayResponse: 2000,
    onNoMatch: 'passthrough'
  });
}

namespace SupportsOnNoMatchThrowException {
  new MockAdapter(instance, {
    onNoMatch: 'throwException'
  });
}

namespace ExposesAdapter {
  mock.adapter();
}

namespace SupportsReset {
  mock.reset();
}

namespace SupportsResetHandlers {
  mock.resetHandlers();
}

namespace SupportsResetHistory {
  mock.resetHistory();
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
  mock.onList;
  mock.onLink;
  mock.onUnlink;
}

namespace SupportsAnyVerb {
  mock.onAny;
}

namespace AllowsVerbOnlyMatcher {
  mock.onGet();
}

namespace AllowsUrlMatcher {
  mock.onGet('/foo');
}

namespace AllowsUrlRegExpMatcher {
  mock.onGet(/\/fo+/);
}

namespace AllowsStringBodyMatcher {
  mock.onPatch('/foo', 'bar');
}

namespace AllowsBodyMatcher {
  mock.onGet('/foo', {
    id: 4,
    name: 'foo'
  });
}

namespace AllowsParameterMatcher {
  mock.onGet('/foo', {
    params: {
      searchText: 'John'
    }
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

namespace SupportsTimeoutOnce {
  mock.onGet().timeoutOnce();
}

namespace SupportsAbortRequest {
  mock.onGet().abortRequest();
}

namespace SupportsAbortRequestOnce {
  mock.onGet().abortRequestOnce();
}

namespace SupportsNetworkError {
  mock.onGet().networkError();
}

namespace SupportsNetworkErrorOnce {
  mock.onGet().networkErrorOnce();
}

namespace AllowsFunctionReply {
  mock.onGet().reply(config => {
    return [200, { data: 'foo' }, { RequestedURL: config.url }];
  });
}

namespace AllowsPromiseReply {
  mock.onGet().reply(config => {
    return Promise.resolve([
      200,
      { data: 'bar' },
      { RequestedURL: config.url }
    ]);
  });
}

namespace SupportsChaining {
  mock
    .onGet('/users')
    .reply(200, [])
    .onGet('/posts')
    .reply(200, []);
}

namespace ExportsRequestHandlerInterface {
  const handler: MockAdapter.RequestHandler = mock.onAny();
  handler.reply(200);
}
