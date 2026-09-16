import { FetchCustom } from '../src/FetchCustom';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import TestServer from './utils/server';

describe('FetchCustom', () => {
  const local = new TestServer('localhost');
  let base = '';

  beforeEach(async () => {
    await local.start();
    base = `http://${local.hostname}:${local.port}/`;
  });

  afterEach(async () => {
    return local.stop();
  });

  it('should make a successful request', async () => {
    const url = `${base}json-type`;
    const instance = new FetchCustom();
    await instance.fetchCustom(url);
    expect(instance).to.be.an.instanceof(FetchCustom);
    expect(instance.response).to.be.an.instanceof(Response);
    const { data } = await instance.toJson();
    expect(data).toEqual({
      test: 'json',
    });
  });

  it('should make a successful request 400', async () => {
    const url = `${base}json-type-400-status`;
    const instance = new FetchCustom();
    await instance.fetchCustom(url);
    expect(instance).to.be.an.instanceof(FetchCustom);
    expect(instance.response).to.be.an.instanceof(Response);
    const { data } = await instance.toJson();
    expect(data).toEqual({
      test: 'json',
    });
  });

  it('should make a successful request validate isShowResponseErrorClass', async () => {
    const url = `${base}json-type-400-status`;
    const instance = new FetchCustom();
    await instance.fetchCustom(url);
    expect(instance).to.be.an.instanceof(FetchCustom);
    expect(instance.response).to.be.an.instanceof(Response);
    console.log('isShowResponseErrorClass', instance.showResponseErrorClass());
    expect(instance.showResponseErrorClass).to.be.an.instanceOf(Function);
  });

  it('should make a successful request validate isShowResponseErrorClassToString', async () => {
    const url = `${base}json-type-400-status`;
    const instance = new FetchCustom();
    await instance.fetchCustom(url);
    expect(instance).to.be.an.instanceof(FetchCustom);
    expect(instance.response).to.be.an.instanceof(Response);
    console.log(
      'isShowResponseErrorClass',
      instance.showResponseErrorClassToString(),
    );
    expect(instance.showResponseErrorClassToString).is.string;
  });

  it('should make a successful request validate options isShowLogsFetch', async () => {
    const url = `${base}json-type-400-status`;
    const instance = new FetchCustom({ isShowLogsFetch: false });
    await instance.fetchCustom(url);
    expect(instance).to.be.an.instanceof(FetchCustom);
    expect(instance.response).to.be.an.instanceof(Response);
    expect(instance._isShowLogsFetch).equal(false);
  });

  it('should timeOut', async () => {
    const url = `${base}json-type-time-out`;
    const instance = new FetchCustom();
    await instance.fetchCustom(url, { signal: AbortSignal.timeout(50) });
    const res = await instance.toJson();
    expect(res.data).exist;
    expect(instance.isTimeoutError).equal(true);
  });

  it('should timeOut using the constructor timeout option', async () => {
    const url = `${base}json-type-time-out`;
    const instance = new FetchCustom({ timeout: 50, isShowLogsFetch: false });
    await instance.fetchCustom(url);
    expect(instance.isTimeoutError).equal(true);
  });

  it('should reset error flags between calls on the same instance', async () => {
    const instance = new FetchCustom({ isShowLogsFetch: false });
    await instance.fetchCustom(`${base}json-type-time-out`, {
      signal: AbortSignal.timeout(50),
    });
    expect(instance.isTimeoutError).equal(true);

    await instance.fetchCustom(`${base}json-type`);
    expect(instance.isTimeoutError).equal(false);
    expect(instance.showResponseErrorClass()).toBeUndefined();
  });

  it('should retry on 5xx responses until it succeeds', async () => {
    local.failuresBeforeSuccess = 2;
    const url = `${base}flaky`;
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      retry: { attempts: 3, delayMs: 1 },
    });
    await instance.fetchCustom(url);
    const { data } = await instance.toJson();
    expect(data).toEqual({ test: 'ok' });
  });

  it('should stop retrying after exhausting attempts', async () => {
    const url = `${base}always-fails`;
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      retry: { attempts: 3, delayMs: 1 },
    });
    await instance.fetchCustom(url);
    expect(instance.showResponseErrorClass()?.status).toEqual(503);
  });

  it('should run request and response interceptors', async () => {
    const url = `${base}json-type`;
    const seen: string[] = [];
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      interceptors: {
        request: (input, init) => {
          seen.push('request');
          return {
            input,
            init: { ...init, headers: { ...init?.headers, 'X-Test': '1' } },
          };
        },
        response: (response) => {
          seen.push('response');
          return response;
        },
      },
    });
    await instance.fetchCustom(url);
    expect(seen).toEqual(['request', 'response']);
    expect(instance.response?.ok).equal(true);
  });

  it('should serialize the body with fast-json-stringify when bodySchema is provided', async () => {
    const url = `${base}echo`;
    const bodySchema = {
      title: 'Payload',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    };
    const instance = new FetchCustom({ isShowLogsFetch: false });
    await instance.fetchCustom(url, {
      method: 'POST',
      body: { name: 'Ada', age: 30 } as unknown as BodyInit,
      bodySchema,
    });
    const { data } = await instance.toJson<{ receivedBody: string }>();
    expect(JSON.parse(data!.receivedBody)).toEqual({ name: 'Ada', age: 30 });
  });

  it('should keep dangerous keys as-is by default (stripDangerousKeys is opt-in)', async () => {
    const url = `${base}echo`;
    const body = JSON.parse(
      '{"name":"Ada","__proto__":{"polluted":true},"nested":{"prototype":{"x":1},"safe":"ok"}}',
    );
    const instance = new FetchCustom({ isShowLogsFetch: false });
    await instance.fetchCustom(url, {
      method: 'POST',
      body: body as unknown as BodyInit,
    });
    const { data } = await instance.toJson<{ receivedBody: string }>();
    expect(data!.receivedBody).toContain('__proto__');
    expect(data!.receivedBody).toContain('prototype');
  });

  it('should strip __proto__/constructor/prototype keys when stripDangerousKeys is enabled', async () => {
    const url = `${base}echo`;
    const body = JSON.parse(
      '{"name":"Ada","__proto__":{"polluted":true},"nested":{"prototype":{"x":1},"safe":"ok"}}',
    );
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      stripDangerousKeys: true,
    });
    await instance.fetchCustom(url, {
      method: 'POST',
      body: body as unknown as BodyInit,
    });
    const { data } = await instance.toJson<{ receivedBody: string }>();
    expect(data!.receivedBody).not.toContain('__proto__');
    expect(data!.receivedBody).not.toContain('prototype');
    expect(JSON.parse(data!.receivedBody)).toEqual({
      name: 'Ada',
      nested: { safe: 'ok' },
    });
  });

  it('should reject a body nested deeper than the strip limit instead of recursing forever', async () => {
    const url = `${base}echo`;
    let deeplyNested: Record<string, unknown> = { value: 'bottom' };
    for (let i = 0; i < 25; i++) {
      deeplyNested = { child: deeplyNested };
    }
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      stripDangerousKeys: true,
    });
    await instance.fetchCustom(url, {
      method: 'POST',
      body: deeplyNested as unknown as BodyInit,
    });
    expect(instance.showResponseErrorClass()?.message).toContain('max depth');
  });

  it('should reject a circular body instead of recursing forever', async () => {
    const url = `${base}echo`;
    const circular: Record<string, unknown> = { name: 'Ada' };
    circular.self = circular;
    const instance = new FetchCustom({
      isShowLogsFetch: false,
      stripDangerousKeys: true,
    });
    await instance.fetchCustom(url, {
      method: 'POST',
      body: circular as unknown as BodyInit,
    });
    expect(instance.showResponseErrorClass()?.message).toContain('max depth');
  });
});
