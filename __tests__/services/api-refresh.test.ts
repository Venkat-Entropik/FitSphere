import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { createApiClient, setUnauthorizedHandler } from '@/services/api/api-client';
import { ApiError } from '@/services/api/api-error';
import { secureStorage } from '@/services/storage/secure-storage';

type Responder = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown };

/** An in-memory server: records every request and answers via `respond`. */
function fakeServer(respond: Responder) {
  const calls: { url: string; auth: string | undefined }[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push({
      url: config.url ?? '',
      auth: config.headers.get('Authorization') as string | undefined,
    });
    const { status, data = {} } = respond(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response);
    return response;
  };
  const client = createApiClient('http://api.test', 1000);
  client.defaults.adapter = adapter;
  return { client, calls };
}

const tokens = (n: number) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}` });

describe('401 → refresh → retry', () => {
  const unauthorized = jest.fn();
  let refresh: jest.SpyInstance;

  beforeEach(async () => {
    unauthorized.mockClear();
    setUnauthorizedHandler(unauthorized);
    await secureStorage.setTokens(tokens(1));
    refresh = jest.spyOn(axios, 'post').mockResolvedValue({ data: { tokens: tokens(2) } });
  });
  afterEach(() => {
    refresh.mockRestore();
    setUnauthorizedHandler(null);
  });

  it('renews the session and replays the request with the new token', async () => {
    const { client, calls } = fakeServer((c) =>
      c.headers.get('Authorization') === 'Bearer access-2'
        ? { status: 200, data: { ok: 1 } }
        : { status: 401 },
    );
    const res = await client.get('/profile');
    expect(res.data).toEqual({ ok: 1 });
    expect(calls.map((c) => c.auth)).toEqual(['Bearer access-1', 'Bearer access-2']);
    expect(refresh).toHaveBeenCalledWith(
      'http://api.test.local/auth/refresh',
      { refreshToken: 'refresh-1' },
      expect.anything(),
    );
    expect(await secureStorage.getTokens()).toEqual(tokens(2));
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('shares one refresh between simultaneous 401s (rotation would otherwise look like theft)', async () => {
    const { client } = fakeServer((c) =>
      c.headers.get('Authorization') === 'Bearer access-2' ? { status: 200 } : { status: 401 },
    );
    await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('signs the user out and clears tokens when the refresh token is rejected', async () => {
    refresh.mockRejectedValue(
      new AxiosError('no', '401', undefined, null, {
        status: 401,
        data: {},
        statusText: '',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      }),
    );
    const { client } = fakeServer(() => ({ status: 401 }));
    await expect(client.get('/profile')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(await secureStorage.getTokens()).toBeNull();
  });

  it('signs out when the retried request is still unauthorised', async () => {
    const { client, calls } = fakeServer(() => ({ status: 401 }));
    await expect(client.get('/profile')).rejects.toBeInstanceOf(ApiError);
    expect(calls).toHaveLength(2); // original + exactly one retry, no loop
    expect(unauthorized).toHaveBeenCalled();
  });

  it('keeps the session when refreshing fails only because the network is down', async () => {
    refresh.mockRejectedValue(new AxiosError('offline', 'ERR_NETWORK'));
    const { client } = fakeServer(() => ({ status: 401 }));
    await expect(client.get('/profile')).rejects.toMatchObject({ kind: 'network' });
    expect(unauthorized).not.toHaveBeenCalled();
    expect(await secureStorage.getTokens()).toEqual(tokens(1));
  });

  it('does not refresh or sign out on a wrong-password 401 from sign-in', async () => {
    const { client } = fakeServer(() => ({
      status: 401,
      data: { message: 'Invalid email or password.' },
    }));
    await expect(client.post('/auth/login', {})).rejects.toMatchObject({
      message: 'Invalid email or password.',
    });
    expect(refresh).not.toHaveBeenCalled();
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('passes through non-401 errors untouched', async () => {
    const { client } = fakeServer(() => ({ status: 500 }));
    await expect(client.get('/x')).rejects.toMatchObject({ kind: 'server' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
