import axios, { AxiosAdapter, AxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';

const instance = axios.create();
const mock = new MockAdapter(instance);
new MockAdapter(axios);
new MockAdapter.default(instance);

const adapter: AxiosAdapter = mock.adapter();
instance.defaults.adapter = adapter;
const history: AxiosRequestConfig[] = mock.history.get;
const handler: MockAdapter.RequestHandler = mock.onGet('/example');
handler.reply((config: AxiosRequestConfig) => [200, config.url]);
mock.onPost('/example').reply(config => {
  const request: AxiosRequestConfig = config;
  return { status: 200, data: history, config: request };
});

// @ts-expect-error A plain object is not an Axios instance.
new MockAdapter({});
// @ts-expect-error URL matchers must be strings or regular expressions.
mock.onGet(123);
