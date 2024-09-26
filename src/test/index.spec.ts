import { FetchCustom } from '../FetchCustom';
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
});
