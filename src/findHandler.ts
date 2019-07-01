import { Handler, HandlerMap, HeadersMatcher, HttpVerb } from './types';
import { combineUrls, isEqual } from './utils';

const allowedParamsMethods: HttpVerb[] = ['delete', 'get', 'head', 'options'];

export function findHandler(
  handlers: HandlerMap,
  method: string | undefined,
  url: string,
  body: any,
  parameters: any,
  headers: any,
  baseURL: string
): Handler | undefined {
  if (!method) {
    return undefined;
  }
  return (handlers[method.toLowerCase()] || []).find((handler: Handler) => {
    let urlMatches = false;
    if (typeof handler.match.url === 'string') {
      urlMatches =
        isUrlMatching(url, handler.match.url) ||
        isUrlMatching(combineUrls(baseURL, url), handler.match.url);
    } else if (handler.match.url instanceof RegExp) {
      urlMatches =
        handler.match.url.test(url) ||
        handler.match.url.test(combineUrls(baseURL, url));
    }
    return (
      urlMatches &&
      isBodyOrParametersMatching(
        method,
        body,
        parameters,
        handler.match.body
      ) &&
      isRequestHeadersMatching(headers, handler.match.headers)
    );
  });
}

function isUrlMatching(url: string, required: string): boolean {
  return url.replace(/^\//, '') === required.replace(/^\//, '');
}

function isRequestHeadersMatching(
  requestHeaders: HeadersMatcher,
  required?: HeadersMatcher
): boolean {
  if (required === undefined) {
    return true;
  }
  return isEqual(requestHeaders, required);
}

function isBodyOrParametersMatching(
  method: string,
  body: any,
  parameters: any,
  required?: any
): boolean {
  if (allowedParamsMethods.indexOf(method.toLowerCase() as HttpVerb) >= 0) {
    let params = required ? required.params : undefined;
    return isParametersMatching(parameters, params);
  } else {
    return isBodyMatching(body, required);
  }
}

function isParametersMatching(parameters: any, required?: any): boolean {
  if (required === undefined) {
    return true;
  }

  return isEqual(parameters, required);
}

function isBodyMatching(body: any, requiredBody?: any): boolean {
  if (requiredBody === undefined) {
    return true;
  }
  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (e) {}
  return parsedBody
    ? isEqual(parsedBody, requiredBody)
    : isEqual(body, requiredBody);
}
