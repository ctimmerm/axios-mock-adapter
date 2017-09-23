import { AxiosInstance, AxiosRequestConfig } from "axios";

type ResponseSpecFunc = (status: number, data?: any, headers?: any) => MockAdapter;
type FunctionResponseSpecFunc = (config: AxiosRequestConfig) => Array<any>;
type PromiseResponseSpecFunc = (config: AxiosRequestConfig) => Promise<Array<any>>;

type ResponseSpec = ResponseSpecFunc | FunctionResponseSpecFunc | PromiseResponseSpecFunc;

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

type RequestMatcherFunc = (matcher?: string | RegExp, body?: IRequestDataMatcher) => RequestHandler;

declare class MockAdapter {
  constructor(axiosInstance: AxiosInstance, options?: IMockAdapterOptions);

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
