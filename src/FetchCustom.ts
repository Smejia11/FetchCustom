import build from 'fast-json-stringify';
import { result } from './Result/result.js';
import type {
  FetchCustomOptions,
  FetchCustomRequestInit,
  Interceptors,
  RequestInfo,
  RetryOptions,
} from './types.js';

export class ResponseError extends Error {
  response: Response;
  status: number;
  statusText: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
  constructor(message: string, res: Response) {
    super(message);
    this.name = 'ResponseError';
    this.response = res;
    this.status = res.status ?? 500;
    this.statusText = res.statusText ?? 'Unknown_ERROR';
    this.url = res.url ?? 'Unknown_URL';
    this.headers = ResponseError.serializeHeaders(res.headers);
    this.body = res.body;
    this.timestamp = new Date().toISOString();
  }
  static serializeHeaders(headers: Headers): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  toStringResponseError(): string {
    return `${this.name}: ${this.message}
            Status: ${this.status} ${this.statusText}
            URL: ${this.url}
            Headers: ${JSON.stringify(this.headers)}
            Body: ${JSON.stringify(this.body)}
            Timestamp: ${this.timestamp}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const compiledStringifiers = new WeakMap<object, (data: unknown) => string>();

function stringifyBody(body: unknown, schema?: object): string {
  if (!schema) return JSON.stringify(body);

  let stringify = compiledStringifiers.get(schema);
  if (!stringify) {
    stringify = build(schema as Parameters<typeof build>[0]);
    compiledStringifiers.set(schema, stringify);
  }
  return stringify(body);
}

function combineSignals(
  signals: Array<AbortSignal | null | undefined>,
): AbortSignal | undefined {
  const valid = signals.filter((signal): signal is AbortSignal => !!signal);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];

  const controller = new AbortController();
  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }
  return controller.signal;
}

export class FetchCustom {
  response: Response | null = null;
  private responseError: ResponseError | null = null;
  public fetchTimeMs: number | null = null;
  domException?: DOMException;
  isTimeoutError: boolean = false;
  isAbortError: boolean = false;
  isNetworkError: boolean = false;
  isUnknownDomError: boolean = false;
  isSecurityError: boolean = false;
  private isShowLogsFetch: boolean = true;
  private timeoutMs?: number;
  private retryOptions?: RetryOptions;
  private interceptorsOptions?: Interceptors;

  constructor(options?: FetchCustomOptions) {
    this.fetchCustom = this.fetchCustom.bind(this);
    this.isShowLogsFetch = options?.isShowLogsFetch ?? true;
    this.timeoutMs = options?.timeout;
    this.retryOptions = options?.retry;
    this.interceptorsOptions = options?.interceptors;
  }

  public get _isShowLogsFetch(): boolean {
    return this.isShowLogsFetch ?? false;
  }

  isPlainObject = (value: unknown) => value?.constructor === Object;

  public showResponseErrorClass() {
    if (this.responseError) return this.responseError;
  }

  public showResponseErrorClassToString() {
    if (this.responseError) return this.responseError.toStringResponseError();
  }

  private resetState() {
    this.response = null;
    this.responseError = null;
    this.fetchTimeMs = null;
    this.domException = undefined;
    this.isTimeoutError = false;
    this.isAbortError = false;
    this.isNetworkError = false;
    this.isUnknownDomError = false;
    this.isSecurityError = false;
  }

  private handleFetchError(error: unknown): Error {
    if (error instanceof ResponseError) {
      this.responseError = error;
      if (this.isShowLogsFetch)
        console.error('RESPONSE_FETCH_ERR', this.responseError);
      return error;
    }

    if (error instanceof DOMException) {
      this.domException = error;
      if (this.isShowLogsFetch)
        console.error(`DOMException: [${error.name}] ${error.message}`);

      if (error.name === 'AbortError') this.isAbortError = true;
      else if (error.name === 'NetworkError') this.isNetworkError = true;
      else if (error.name === 'SecurityError') this.isSecurityError = true;
      else if (error.name === 'TimeoutError') this.isTimeoutError = true;
      else this.isUnknownDomError = true;

      this.response = new Response(JSON.stringify({ error: error.name }), {
        status:
          error.name === 'AbortError' || error.name === 'TimeoutError'
            ? 408
            : 520,
        statusText: error.name,
        headers: { 'Content-Type': 'application/json' },
      });
      this.responseError = new ResponseError(
        `DOMException: ${error.name}`,
        this.response,
      );
      if (this.isShowLogsFetch)
        console.error('RESPONSE_FETCH_ERR', this.responseError);
      return this.responseError;
    }

    // Network failures (connection refused, DNS errors, etc.) surface from
    // Node's fetch implementation as a plain TypeError, not a DOMException.
    if (error instanceof TypeError) {
      this.isNetworkError = true;
      this.response = new Response(JSON.stringify({ error: error.message }), {
        status: 599,
        statusText: 'NetworkError',
        headers: { 'Content-Type': 'application/json' },
      });
      this.responseError = new ResponseError(
        `NetworkError: ${error.message}`,
        this.response,
      );
      if (this.isShowLogsFetch)
        console.error('RESPONSE_FETCH_ERR', this.responseError);
      return this.responseError;
    }

    const unknownError =
      error instanceof Error ? error : new Error(String(error));
    if (this.isShowLogsFetch) console.error('RESPONSE_FETCH_ERR', unknownError);
    return unknownError;
  }

  private defaultRetryOn(): boolean {
    if (this.isNetworkError || this.isTimeoutError) return true;
    if (this.response && this.response.status >= 500) return true;
    return false;
  }

  private getRetryDelay(retry: RetryOptions, attemptIndex: number): number {
    const base = retry.delayMs ?? 300;
    if (retry.backoff === 'exponential') return base * 2 ** attemptIndex;
    return base;
  }

  async fetchCustom(
    input: RequestInfo,
    init?: FetchCustomRequestInit,
  ): Promise<FetchCustom> {
    this.resetState();
    const start = new Date();
    const totalAttempts = Math.max(1, this.retryOptions?.attempts ?? 1);

    try {
      for (let attempt = 0; attempt < totalAttempts; attempt++) {
        try {
          let requestInput: RequestInfo = input;
          let initOptions = init;

          if (this.interceptorsOptions?.request) {
            const intercepted = await this.interceptorsOptions.request(
              requestInput,
              initOptions,
            );
            requestInput = intercepted.input;
            initOptions = intercepted.init;
          }

          // If we specified a RequestInit for fetch
          if (initOptions?.body) {
            // If we have passed a body property and it is a plain object or array
            if (
              Array.isArray(initOptions.body) ||
              this.isPlainObject(initOptions.body)
            ) {
              // Create a new options object serializing the body and ensuring we
              // have a content-type header
              const { bodySchema, ...rest } = initOptions;
              initOptions = {
                ...rest,
                body: stringifyBody(initOptions.body, bodySchema),
                headers: {
                  'Content-Type': 'application/json',
                  ...initOptions.headers,
                },
              };
            }
          }

          if (this.timeoutMs) {
            initOptions = {
              ...initOptions,
              signal: combineSignals([
                initOptions?.signal,
                AbortSignal.timeout(this.timeoutMs),
              ]),
            };
          }

          let res = await fetch(requestInput, initOptions);

          if (this.interceptorsOptions?.response) {
            res = await this.interceptorsOptions.response(res);
          }

          this.response = res;
          if (!res.ok) {
            throw new ResponseError(
              `Bad response statusText: ${res.statusText}, statusCode:${res.status}`,
              res,
            );
          }
          return this;
        } catch (error) {
          const handledError = this.handleFetchError(error);
          const isLastAttempt = attempt === totalAttempts - 1;
          if (isLastAttempt) return this;

          const shouldRetry = this.retryOptions?.retryOn
            ? this.retryOptions.retryOn(handledError, this.response)
            : this.defaultRetryOn();
          if (!shouldRetry) return this;

          await sleep(this.getRetryDelay(this.retryOptions!, attempt));
        }
      }
      return this;
    } finally {
      const end = new Date();
      this.fetchTimeMs = end.getTime() - start.getTime();
      if (this.isShowLogsFetch)
        console.log(`Fetch took ${this.fetchTimeMs} ms`);
    }
  }
  async toJson<T>() {
    if (!this.response) {
      throw new Error('Response is not available');
    }
    const [err, res] = await result<T>(this.response.json() as Promise<T>);
    if (err) return { error: err, data: undefined };
    if (res) return { data: res as T, error: undefined };
    throw new Error('Unknown error');
  }

  async toText<T>() {
    if (!this.response) {
      throw new Error('Response is not available');
    }
    const [err, res] = await result<T>(this.response.text() as Promise<T>);
    if (err) return { error: err, data: undefined };
    if (res) return { data: res as T, error: undefined };
    throw new Error('Unknown error');
  }

  async toBlob<T>() {
    if (!this.response) {
      throw new Error('Response is not available');
    }
    const [err, res] = await result<T>(this.response.blob() as Promise<T>);
    if (err) return { error: err, data: undefined };
    if (res) return { data: res as T, error: undefined };
    throw new Error('Unknown error');
  }
}
