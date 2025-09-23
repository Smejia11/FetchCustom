import { result } from './Result/result.js';
import type { RequestInfo } from './types.js';

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

export class FetchCustom {
  response: Response | null = null;
  private responseError: ResponseError | null = null;
  public fetchTimeMs: number | null = null;
  domException!: DOMException;
  isTimeoutError: boolean = false;
  isAbortError: boolean = false;
  isNetworkError: boolean = false;
  isUnknownDomError: boolean = false;
  isSecurityError: boolean = false;
  private isShowLogsFetch: boolean = true;

  constructor(options?: { isShowLogsFetch?: boolean }) {
    this.fetchCustom = this.fetchCustom.bind(this);
    this.isShowLogsFetch = options?.isShowLogsFetch ?? true;
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

  async fetchCustom(
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<FetchCustom> {
    const start = new Date();

    try {
      let initOptions = init;
      // If we specified a RequestInit for fetch
      if (initOptions?.body) {
        // If we have passed a body property and it is a plain object or array
        if (
          Array.isArray(initOptions.body) ||
          this.isPlainObject(initOptions.body)
        ) {
          // Create a new options object serializing the body and ensuring we
          // have a content-type header
          initOptions = {
            ...initOptions,
            body: JSON.stringify(initOptions.body),
            headers: {
              'Content-Type': 'application/json',
              ...initOptions.headers,
            },
          };
        }
      }
      const res = await fetch(input, initOptions);
      this.response = res;
      if (!res.ok) {
        throw new ResponseError(
          `Bad response statusText: ${res.statusText}, statusCode:${res.status}`,
          res,
        );
      }
      return this;
    } catch (error) {
      if (error instanceof ResponseError)
        this.responseError = error as ResponseError;
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
          status: error.name === 'AbortError' ? 408 : 520,
          statusText: error.name,
          headers: { 'Content-Type': 'application/json' },
        });
        this.responseError = new ResponseError(
          `DOMException: ${error.name}`,
          this.response,
        );
      }
      if (this.isShowLogsFetch)
        console.error('RESPONSE_FETCH_ERR', this.responseError);
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
