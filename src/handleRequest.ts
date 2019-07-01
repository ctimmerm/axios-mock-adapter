import * as utils from './utils';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import MockAdapter from './MockAdapter';
import { MockAdapterOptions, RespondingHandler, ResponseType } from './types';

function makeResponse(
  result: ResponseType,
  config: AxiosRequestConfig
): AxiosResponse {
  if (Array.isArray(result)) {
    const [status, rawData, headers] = result;
    const data = utils.isSimpleObject(rawData)
      ? JSON.parse(JSON.stringify(rawData))
      : rawData;
    return {
      status,
      statusText: `${status}`,
      data,  // may be undefined if result is 1-tuple
      headers, // may be undefined if result is 1-tuple or 2-tuple
      config
    };
  }
  if (result.config) {
    return { ...result };
  } else {
    throw new Error(
      'unexpected response object – either pass a 3-item array or a response'
    );
  }
}

function settleImmediate(
  resolve,
  reject,
  response: AxiosResponse,
  options: MockAdapterOptions
) {
  if (response.config && response.config.validateStatus) {
    if (response.config.validateStatus(response.status)) {
      return resolve(response);
    }
    return reject(
      createErrorResponse(
        'Request failed with status code ' + response.status,
        response.config,
        response
      )
    );
  } else {
    if (response.status >= 200 && response.status < 300) {
      resolve(response);
    } else {
      reject(response);
    }
  }
}

function settle(
  resolve,
  reject,
  response: AxiosResponse,
  options: MockAdapterOptions
) {
  if (options.delayResponse && options.delayResponse > 0) {
    setTimeout(() => {
      settleImmediate(resolve, reject, response, options);
    }, options.delayResponse);
    return;
  }

  return settleImmediate(resolve, reject, response, options);
}

function createErrorResponse(
  message: string,
  config: AxiosRequestConfig,
  response: AxiosResponse
): AxiosError {
  const error = new Error(message) as AxiosError;
  error.config = config;
  error.response = response;
  return error;
}

export default function handleRequest(
  mockAdapter: MockAdapter,
  resolve: (resp: AxiosResponse) => void,
  reject: (err: Error) => void,
  config: AxiosRequestConfig
): void {
  let url = config.url;
  if (config.baseURL && config.url && config.url.startsWith(config.baseURL)) {
    url = config.url.slice(config.baseURL.length);
  }
  if (!config.method) {
    reject(new Error('Missing method in request'));
    return;
  }

  delete config.adapter;
  mockAdapter.history[config.method].push(config);

  const handler = mockAdapter.findHandler(config, url);

  if (!handler) {
    // handler not found
    return settle(
      resolve,
      reject,
      makeResponse([404, 'No handler', undefined], config),
      mockAdapter.options
    );
  }

  if (handler.once) {
    mockAdapter.removeHandler(handler);
  }

  if (handler.type === 'passthrough') {
    // passThrough handler
    // tell axios to use the original adapter instead of our mock, fixes #35
    if (mockAdapter.originalAdapter && mockAdapter.axiosInstance) {
      config.adapter = mockAdapter.originalAdapter;
      mockAdapter.axiosInstance.request(config).then(resolve, reject);
      return;
    } else {
      return reject(new Error('Unable to passthrough request'));
    }
  } else if (handler.type === 'response') {
    const rh: RespondingHandler = handler as RespondingHandler;
    const response = rh.response;
    if (typeof response.status !== 'function') {
      return settle(
        resolve,
        reject,
        makeResponse(
          [response.status, response.body, response.headers],
          config
        ),
        mockAdapter.options
      );
    }
    const result = Promise.resolve(response.status(config));
    // TODO throw a sane exception when return value is incorrect
    result.then(
      result => {
        settle(
          resolve,
          reject,
          makeResponse(result, config),
          mockAdapter.options
        );
      },
      error => {
        if (mockAdapter.options.delayResponse > 0) {
          setTimeout(() => {
            reject(error);
          }, mockAdapter.options.delayResponse);
        } else {
          reject(error);
        }
      }
    );
  } else {
    reject(new Error('Unknown handler type'));
  }
}
