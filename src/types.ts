import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from 'axios';

export type HttpVerb =
  | 'get'
  | 'post'
  | 'head'
  | 'delete'
  | 'patch'
  | 'put'
  | 'options'
  | 'list';

export type HandlerMap = {
  [method in HttpVerb]: Handler[];
};

export interface Headers {
  [key: string]: string;
}

export type HeadersMatcher = Headers;

export type ResponseTriple = [
  number, // status
  any | undefined, // body
  Headers | undefined // headers
];
export type ResponseTuple = [
  number, // status
  any | undefined // body
];

export type ResponseType = ResponseTuple | ResponseTriple | AxiosResponse;
export type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => ResponseType | Promise<ResponseType> | AxiosPromise;

export type StatusOrCallback = number | CallbackResponseSpecFunc;

export interface MockAdapterOptions {
  delayResponse?: number;
}

export interface RequestDataMatcher {
  [index: string]: any;

  params?: {
    [index: string]: any;
  };
}

export interface HandlerMatchSpec {
  url: string | RegExp;
  body?: string | RequestDataMatcher;
  headers?: Headers;
}

export interface Handler {
  match: HandlerMatchSpec;
  once: boolean;
  type: 'response' | 'passthrough';
}

export interface RespondingHandler extends Handler {
  type: 'response';
  response: {
    status: StatusOrCallback;
    body: any;
    headers?: Headers;
  };
}

export interface PassthroughHandler extends Handler {
  type: 'passthrough';
}
