import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from "axios";

type CallbackResponseSpecFunc = (config: AxiosRequestConfig) => any[] | Promise<any[]>;

type ResponseSpecFunc = (statusOrCallback: number | CallbackResponseSpecFunc, data?: any, headers?: any) => MockAdapter;

interface RequestHandler {
  reply: ResponseSpecFunc;
  replyOnce: ResponseSpecFunc;

  passThrough(): void;
  networkError(): void;
  timeout(): void;
}

interface MockAdapterOptions {
  delayResponse?: number;
}

interface RequestDataMatcher {
  [index: string]: any;
  params?: {
    [index: string]: any,
  };
}

type RequestMatcherFunc = (matcher?: string | RegExp, body?: string | RequestDataMatcher) => RequestHandler;

declare class MockAdapter {
  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions);

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

export default MockAdapter;
