import deepEqual from 'deep-equal';

import { HttpVerb } from './types';

export const VERBS: HttpVerb[] = [
  'get',
  'post',
  'head',
  'delete',
  'patch',
  'put',
  'options',
  'list'
];

export function getVerbObject<T>(): { [method in HttpVerb]: T[] } {
  return {
    get: [],
    post: [],
    head: [],
    delete: [],
    patch: [],
    put: [],
    options: [],
    list: []
  };
}

export function isEqual<T>(a: T, b: T): boolean {
  return deepEqual(a, b, { strict: true });
}

export function combineUrls(baseURL: string, url: string) {
  if (baseURL) {
    return baseURL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
  }

  return url;
}

export function isSimpleObject(value: any): boolean {
  return (
    value !== null &&
    value !== undefined &&
    value.toString() === '[object Object]'
  );
}
