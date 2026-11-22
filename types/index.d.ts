import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

declare namespace MockAdapter {
  export interface AxiosHeaders {
    [key: string]: string | number | boolean | null | undefined;
  }

  export type MockArrayResponse = [
    status: number,
    data?: any,
    headers?: AxiosHeaders
  ];

  export type MockObjectResponse = {
    status: number;
    data: any;
    headers?: AxiosHeaders,
    config?: AxiosRequestConfig
  };

  export type MockResponse = MockArrayResponse | MockObjectResponse;

  export type CallbackResponseSpecFunc = (
    config: AxiosRequestConfig
  ) => MockResponse | Promise<MockResponse>;

  export type ResponseSpecFunc = <T = any>(
    statusOrCallback: number | CallbackResponseSpecFunc,
    data?: T,
    headers?: AxiosHeaders
  ) => MockAdapter;

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

  export interface MockAdapterOptions {
    delayResponse?: number;
    onNoMatch?: 'passthrough' | 'throwException';
  }

  export interface AsymmetricMatcher {
    asymmetricMatch: Function;
  }

  export interface ParamsMatcher {
    [param: string]: any;
  }

  export interface HeadersMatcher {
    [header: string]: string;
  }

  export type UrlMatcher = string | RegExp;
  export type AsymmetricParamsMatcher = AsymmetricMatcher | ParamsMatcher;
  export type AsymmetricHeadersMatcher = AsymmetricMatcher | HeadersMatcher;
  export type AsymmetricRequestDataMatcher = AsymmetricMatcher | any;

  export interface ConfigMatcher {
    params?: AsymmetricParamsMatcher;
    headers?: AsymmetricHeadersMatcher;
    data?: AsymmetricRequestDataMatcher;
  }

  export type RequestMatcherFunc = (
    matcher?: UrlMatcher,
    body?: AsymmetricRequestDataMatcher,
    config?: ConfigMatcher
  ) => MockAdapter.RequestHandler;

  export type NoBodyRequestMatcherFunc = (
    matcher?: UrlMatcher,
    config?: ConfigMatcher
  ) => MockAdapter.RequestHandler;

  export type verb =
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

  export type HistoryArray = AxiosRequestConfig[] & Record<verb, AxiosRequestConfig[]>
}

declare class MockAdapter {
  static default: typeof MockAdapter;

  constructor(axiosInstance: AxiosInstance, options?: MockAdapter.MockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  resetHandlers(): void;
  resetHistory(): void;
  restore(): void;

  history: MockAdapter.HistoryArray;

  onAny: MockAdapter.NoBodyRequestMatcherFunc;
  onGet: MockAdapter.NoBodyRequestMatcherFunc;
  onDelete: MockAdapter.NoBodyRequestMatcherFunc;
  onHead: MockAdapter.NoBodyRequestMatcherFunc;
  onOptions: MockAdapter.NoBodyRequestMatcherFunc;
  onPost: MockAdapter.RequestMatcherFunc;
  onPut: MockAdapter.RequestMatcherFunc;
  onPatch: MockAdapter.RequestMatcherFunc;
  onList: MockAdapter.RequestMatcherFunc;
  onLink: MockAdapter.RequestMatcherFunc;
  onUnlink: MockAdapter.RequestMatcherFunc;
}

export = MockAdapter;
