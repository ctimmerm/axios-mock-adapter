import {
  HandlerMatchSpec,
  HeadersMatcher,
  HttpVerb,
  PassthroughHandler,
  RequestDataMatcher,
  RespondingHandler,
  StatusOrCallback
} from './types';
import { AxiosError } from 'axios';
import MockAdapter from './MockAdapter';

export class HandlerConfigurator {
  private readonly mockAdapter: MockAdapter;
  private readonly method: HttpVerb | undefined;
  private readonly urlMatch: string | RegExp;
  private readonly bodyMatch?: string | RequestDataMatcher;
  private readonly headersMatch?: HeadersMatcher;

  public constructor(
    mockAdapter: MockAdapter,
    method: HttpVerb | undefined,
    urlMatch?: string | RegExp,
    bodyMatch?: string | RequestDataMatcher,
    headersMatch?: HeadersMatcher
  ) {
    this.mockAdapter = mockAdapter;
    this.method = method;
    this.urlMatch = urlMatch === undefined ? /.*/ : urlMatch;
    this.bodyMatch = bodyMatch;
    this.headersMatch = headersMatch;
  }

  public reply(
    status: StatusOrCallback,
    body?,
    headers?,
    once: boolean = false
  ): MockAdapter {
    const handler: RespondingHandler = {
      type: 'response',
      match: this.getMatch(),
      response: {
        status,
        body,
        headers
      },
      once
    };
    this.mockAdapter.addHandler(this.method, handler);
    return this.mockAdapter;
  }

  private getMatch(): HandlerMatchSpec {
    return {
      url: this.urlMatch,
      body: this.bodyMatch,
      headers: this.headersMatch
    };
  }

  public replyOnce(status: StatusOrCallback, body?, headers?): MockAdapter {
    return this.reply(status, body, headers, true);
  }

  public passThrough(): MockAdapter {
    const handler: PassthroughHandler = {
      type: 'passthrough',
      match: this.getMatch(),
      once: false
    };
    this.mockAdapter.addHandler(this.method, handler);
    return this.mockAdapter;
  }

  public networkError(once = false): void {
    this.reply(
      config => {
        const error: AxiosError = new Error('Network Error') as AxiosError;
        error.config = config;
        return Promise.reject(error);
      },
      undefined,
      undefined,
      once
    );
  }

  public networkErrorOnce(): void {
    return this.networkError(true);
  }

  public timeout(once = false): void {
    this.reply(
      config => {
        const error: AxiosError = new Error(
          `timeout of ${config.timeout}ms exceeded`
        ) as AxiosError;
        error.config = config;
        error.code = 'ECONNABORTED';
        return Promise.reject(error);
      },
      undefined,
      undefined,
      once
    );
  }
}
