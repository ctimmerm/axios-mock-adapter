import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from "axios";

type CallbackResponseSpecFunc = (config: AxiosRequestConfig) => Array<any> | Promise<Array<any>>;

type ResponseSpecFunc = (statusOrCallback: number | CallbackResponseSpecFunc, data?: any, headers?: any) => MockAdapter;

type RequestHandler = {
  reply: ResponseSpecFunc;
  replyOnce: ResponseSpecFunc;

  passThrough(): void;
  networkError(): void;
  timeout(): void;
}

interface IMockAdapterOptions {
  delayResponse?: number;
}

interface IRequestDataMatcher {
  [index: string]: any;
  params?: {
    [index: string]: any,
  }
}

type RequestMatcherFunc = (matcher?: string | RegExp, body?: string | IRequestDataMatcher) => RequestHandler;

declare class MockAdapter {
  constructor(axiosInstance: AxiosInstance, options?: IMockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  restore(): void;

  onGet: RequestMatcherFunc;
  onPost: RequestMatcherFunc;
  onPut: RequestMatcherFunc;
  onHead: RequestMatcherFunc;
  onDelete: RequestMatcherFunc;
  onPatch: RequestMatcherFunc;
  onAny: RequestMatcherFunc;
}

export = MockAdapter;
