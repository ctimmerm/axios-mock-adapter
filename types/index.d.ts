import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

interface AxiosHeaders {
  [key: string]: string | number | boolean | null | undefined;
}

type MockArrayResponse = [
  status: number,
  data?: any,
  headers?: AxiosHeaders
];

type MockObjectResponse = {
  status: number;
  data: any;
  headers?: AxiosHeaders,
  config?: AxiosRequestConfig
};

type MockResponse = MockArrayResponse | MockObjectResponse;

type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => MockResponse | Promise<MockResponse>;

type ResponseSpecFunc = <T = any>(
  statusOrCallback: number | CallbackResponseSpecFunc,
  data?: T,
  headers?: AxiosHeaders
) => MockAdapter;

declare namespace MockAdapter {
  export interface RequestHandler {
    withDelayInMs(delay: number): RequestHandler;
    reply: ResponseSpecFunc;
    replyOnce: ResponseSpecFunc;
    passThrough(): MockAdapter;
    abortRequest(): MockAdapter;
    abortRequestOnce(): MockAdapter;
    networkError(): MockAdapter;
    networkErrorOnce(): MockAdapter;
    timeout(): MockAdapter;
    timeoutOnce(): MockAdapter;
  }
}

interface MockAdapterOptions {
  delayResponse?: number;
  onNoMatch?: 'passthrough' | 'throwException';
}

interface AsymmetricMatcher {
  asymmetricMatch: Function;
}

interface ParamsMatcher {
  [param: string]: any;
}

interface HeadersMatcher {
  [header: string]: string;
}

type UrlMatcher = string | RegExp;
type AsymmetricParamsMatcher = AsymmetricMatcher | ParamsMatcher;
type AsymmetricHeadersMatcher = AsymmetricMatcher | HeadersMatcher;
type AsymmetricRequestDataMatcher = AsymmetricMatcher | any;

interface ConfigMatcher {
  params?: AsymmetricParamsMatcher;
  headers?: AsymmetricHeadersMatcher;
  data?: AsymmetricRequestDataMatcher;
}

type RequestMatcherFunc = (
  matcher?: UrlMatcher,
  body?: AsymmetricRequestDataMatcher,
  config?: ConfigMatcher
) => MockAdapter.RequestHandler;

type NoBodyRequestMatcherFunc = (
  matcher?: UrlMatcher,
  config?: ConfigMatcher
) => MockAdapter.RequestHandler;

type verb =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head'
  | 'list'
  | 'link'
  | 'unlink';

type HistoryArray = AxiosRequestConfig[] & Record<verb, AxiosRequestConfig[]>

declare class MockAdapter {
  static default: typeof MockAdapter;

  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  resetHandlers(): void;
  resetHistory(): void;
  restore(): void;

  history: HistoryArray;

  onAny: NoBodyRequestMatcherFunc;
  onGet: NoBodyRequestMatcherFunc;
  onDelete: NoBodyRequestMatcherFunc;
  onHead: NoBodyRequestMatcherFunc;
  onOptions: NoBodyRequestMatcherFunc;
  onPost: RequestMatcherFunc;
  onPut: RequestMatcherFunc;
  onPatch: RequestMatcherFunc;
  onList: RequestMatcherFunc;
  onLink: RequestMatcherFunc;
  onUnlink: RequestMatcherFunc;
}

export = MockAdapter;
