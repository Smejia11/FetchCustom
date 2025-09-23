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
    await instance.fetchCustom(url, { signal: AbortSignal.timeout(2) });
    const res = await instance.toJson();
    expect(res.data).exist;
    expect(instance.isTimeoutError).equal(true);
  });
});
