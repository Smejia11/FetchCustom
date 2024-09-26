import { result } from './Result';
import type { RequestInfo } from './types';

export class ResponseError extends Error {
  response: Response;
  typeError!: number;
  constructor(message: string, res: Response) {
    super(message);
    this.response = res;
  }
}

export class FetchCustom {
  response: Response | null = null;
  private responseError: ResponseError | null = null;
  constructor() {
    this.fetchCustom = this.fetchCustom.bind(this);
  }

  isPlainObject = (value: unknown) => value?.constructor === Object;

  async fetchCustom(
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<FetchCustom> {
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
      if (error instanceof Error) this.responseError = error as ResponseError;
      console.error('RESPONSE_FETCH_ERR', this.responseError);
      return this;
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
