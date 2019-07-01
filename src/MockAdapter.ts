import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  Handler,
  HeadersMatcher,
  HttpVerb,
  MockAdapterOptions,
  RequestDataMatcher,
  HandlerMap
} from './types';
import handleRequest from './handleRequest';
import { HandlerConfigurator } from './HandlerConfigurator';
import { getVerbObject, VERBS, isEqual } from './utils';
import { findHandler } from './findHandler';

type ConfiguratorAcquirer = (
  url?: string | RegExp,
  body?: string | RequestDataMatcher,
  requestHeaders?: HeadersMatcher
) => HandlerConfigurator;

export default class MockAdapter {
  public readonly axiosInstance?: AxiosInstance;
  public readonly originalAdapter: AxiosAdapter | undefined;
  public readonly options: MockAdapterOptions;
  public handlers: HandlerMap = getVerbObject();
  public history: {
    [method in HttpVerb]: AxiosRequestConfig[];
  } = getVerbObject();

  public constructor(
    axiosInstance: AxiosInstance,
    options?: Partial<MockAdapterOptions>
  ) {
    this.options = {
      delayResponse: 0,
      ...options
    };
    if (axiosInstance) {
      this.axiosInstance = axiosInstance;
      this.originalAdapter = axiosInstance.defaults.adapter;
      axiosInstance.defaults.adapter = this.adapter();
    }
  }

  public adapter(): AxiosAdapter {
    const mock = this;
    return (config: AxiosRequestConfig) =>
      new Promise((resolve, reject) =>
        handleRequest(mock, resolve, reject, config)
      );
  }

  public reset(): void {
    this.resetHandlers();
    this.resetHistory();
  }

  public resetHandlers() {
    this.handlers = getVerbObject();
  }

  public resetHistory() {
    this.history = getVerbObject();
  }

  public restore(): void {
    if (this.axiosInstance) {
      this.axiosInstance.defaults.adapter = this.originalAdapter;
    }
  }

  public onAny: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator(undefined, matcher, body, headers);
  public onDelete: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('delete', matcher, body, headers);
  public onGet: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('get', matcher, body, headers);
  public onHead: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('head', matcher, body, headers);
  public onList: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('list', matcher, body, headers);
  public onOptions: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('options', matcher, body, headers);
  public onPatch: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('patch', matcher, body, headers);
  public onPost: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('post', matcher, body, headers);
  public onPut: ConfiguratorAcquirer = (matcher, body, headers) =>
    this.getConfigurator('put', matcher, body, headers);

  private getConfigurator(
    method: HttpVerb | undefined,
    matcher?: string | RegExp,
    body?: string | RequestDataMatcher,
    requestHeaders?: HeadersMatcher
  ) {
    return new HandlerConfigurator(this, method, matcher, body, requestHeaders);
  }

  private findInHandlers(method: HttpVerb, handler: Handler): number {
    for (let i = 0; i < this.handlers[method].length; i += 1) {
      const item = this.handlers[method][i];
      const comparePaths =
        item.match.url instanceof RegExp && handler.match.url instanceof RegExp
          ? String(item.match.url) === String(handler.match.url)
          : item.match.url === handler.match.url;
      const isSame =
        comparePaths &&
        isEqual(item.match.body, handler.match.body) &&
        isEqual(item.match.headers, handler.match.headers);
      if (isSame && !item.once) {
        return i;
      }
    }
    return -1;
  }

  public addHandler(method: HttpVerb | undefined, handler: Handler): void {
    if (method === undefined) {
      VERBS.forEach(verb => {
        this.addHandler(verb, handler);
      });
    } else {
      const indexOfExistingHandler = this.findInHandlers(method, handler);
      if (indexOfExistingHandler > -1 && !handler.once) {
        this.handlers[method].splice(indexOfExistingHandler, 1, handler);
      } else {
        this.handlers[method].push(handler);
      }
    }
  }

  public removeHandler(handler: Handler): void {
    Object.keys(this.handlers).forEach(key => {
      let index = this.handlers[key].indexOf(handler);
      if (index > -1) {
        this.handlers[key].splice(index, 1);
      }
    });
  }

  public findHandler(config: AxiosRequestConfig, url?: string) {
    return findHandler(
      this.handlers,
      config.method,
      url || config.url || '',
      config.data,
      config.params,
      config.headers,
      config.baseURL || ''
    );
  }
}
