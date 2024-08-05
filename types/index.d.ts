import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => any[] | Promise<any[]>;

type ResponseSpecFunc = <T = any>(
  statusOrCallback: number | CallbackResponseSpecFunc,
  data?: T,
  headers?: any
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

declare class MockAdapter {
  static default: typeof MockAdapter;

  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  resetHandlers(): void;
  resetHistory(): void;
  restore(): void;

  history: { [method: string]: AxiosRequestConfig[] };

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
