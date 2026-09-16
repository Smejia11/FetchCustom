export type RequestInfo = string | URL | Request;

export interface RetryOptions {
  attempts: number;
  delayMs?: number;
  backoff?: 'fixed' | 'exponential';
  retryOn?: (error: Error | null, response: Response | null) => boolean;
}

export type RequestInterceptor = (
  input: RequestInfo,
  init?: RequestInit,
) =>
  | { input: RequestInfo; init?: RequestInit }
  | Promise<{ input: RequestInfo; init?: RequestInit }>;

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
