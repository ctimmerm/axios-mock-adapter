import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => any[] | Promise<any[]>;

type ResponseSpecFunc = (
  statusOrCallback: number | CallbackResponseSpecFunc,
  data?: any,
  headers?: any
) => MockAdapter;

interface RequestHandler {
  reply: ResponseSpecFunc;
  replyOnce: ResponseSpecFunc;
  timeoutOnce: ResponseSpecFunc;
  networkErrorOnce: ResponseSpecFunc;

  passThrough(): MockAdapter;
  networkError(): MockAdapter;
  timeout(): MockAdapter;
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
  restore(): void;
  
  history: { [method:string]:AxiosRequestConfig[]; };

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
