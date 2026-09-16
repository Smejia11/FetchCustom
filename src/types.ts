export type RequestInfo = string | URL | Request;

export interface FetchCustomRequestInit extends RequestInit {
  /**
   * A fast-json-stringify JSON Schema describing the shape of `body`.
   * When provided, the body is serialized with a compiled fast-json-stringify
   * function instead of the native `JSON.stringify`. Pass the same schema
   * object reference across calls so the compiled serializer gets cached.
   */
  bodySchema?: object;
}

export interface RetryOptions {
  attempts: number;
  delayMs?: number;
  backoff?: 'fixed' | 'exponential';
  retryOn?: (error: Error | null, response: Response | null) => boolean;
}

export type RequestInterceptor = (
  input: RequestInfo,
  init?: FetchCustomRequestInit,
) =>
  | { input: RequestInfo; init?: FetchCustomRequestInit }
  | Promise<{ input: RequestInfo; init?: FetchCustomRequestInit }>;

export type ResponseInterceptor = (
  response: Response,
) => Response | Promise<Response>;

export interface Interceptors {
  request?: RequestInterceptor;
  response?: ResponseInterceptor;
}

export interface FetchCustomOptions {
  isShowLogsFetch?: boolean;
  timeout?: number;
  retry?: RetryOptions;
  interceptors?: Interceptors;
}
