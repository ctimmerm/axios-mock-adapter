import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => any[] | Promise<any[]>;

type ResponseSpecFunc = <T = any>(
  statusOrCallback: number | CallbackResponseSpecFunc,
  data?: T,
  headers?: any
) => MockAdapter;

type RequestHandlerInfo = {
  passThrough: boolean
}

interface RequestHandler {
  reply: ResponseSpecFunc;
  replyOnce: ResponseSpecFunc;
  passThrough(): MockAdapter;
  networkError(): void;
  networkErrorOnce(): void;
  timeout(): void;
  timeoutOnce(): void;
}

interface MockAdapterOptions {
  delayResponse?: number;
}

interface RequestDataMatcher {
  [index: string]: any;
  params?: {
    [index: string]: any;
  };
}

interface HeadersMatcher {
  [header: string]: string;
}

type RequestMatcherFunc = (
  matcher?: string | RegExp,
  body?: string | RequestDataMatcher,
  headers?: HeadersMatcher
) => RequestHandler;

declare class MockAdapter {
  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  resetHandlers(): void;
  resetHistory(): void;
  restore(): void;

  history: { [method: string]: AxiosRequestConfig & {
    handler: RequestHandlerInfo
  }[] };

  onGet: RequestMatcherFunc;
  onPost: RequestMatcherFunc;
  onPut: RequestMatcherFunc;
  onHead: RequestMatcherFunc;
  onDelete: RequestMatcherFunc;
  onPatch: RequestMatcherFunc;
  onList: RequestMatcherFunc;
  onAny: RequestMatcherFunc;
}

export default MockAdapter;
