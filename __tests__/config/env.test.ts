import { parseEnv } from '@/config/env';

describe('parseEnv', () => {
  it('applies defaults and parses values', () => {
    expect(parseEnv({ EXPO_PUBLIC_API_URL: 'https://api.example.com' })).toEqual({
      apiUrl: 'https://api.example.com',
      apiTimeoutMs: 15000,
      useMocks: true,
    });
    expect(
      parseEnv({
        EXPO_PUBLIC_API_URL: 'https://api.example.com',
        EXPO_PUBLIC_API_TIMEOUT_MS: '5000',
        EXPO_PUBLIC_USE_MOCKS: 'false',
      }),
    ).toMatchObject({ apiTimeoutMs: 5000, useMocks: false });
  });

  it('throws a helpful error when the API URL is missing or invalid', () => {
    expect(() => parseEnv({})).toThrow(/EXPO_PUBLIC_API_URL/);
    expect(() => parseEnv({ EXPO_PUBLIC_API_URL: 'not a url' })).toThrow(/\.env\.example/);
  });

  it('refuses a release build that uses sample data or an unencrypted server', () => {
    const real = { EXPO_PUBLIC_API_URL: 'https://api.example.com', EXPO_PUBLIC_USE_MOCKS: 'false' };
    expect(() => parseEnv(real, true)).not.toThrow();
    expect(() => parseEnv({ ...real, EXPO_PUBLIC_USE_MOCKS: 'true' }, true)).toThrow(
      /USE_MOCKS=false/,
    );
    expect(() => parseEnv({ EXPO_PUBLIC_API_URL: 'https://api.example.com' }, true)).toThrow(
      /USE_MOCKS=false/,
    );
    expect(() =>
      parseEnv({ ...real, EXPO_PUBLIC_API_URL: 'http://192.168.1.5:3000' }, true),
    ).toThrow(/https/);
    // The dev server may use either.
    expect(() => parseEnv({ EXPO_PUBLIC_API_URL: 'http://localhost:3000' }, false)).not.toThrow();
  });

  it('reads an optional support email and ignores a blank one', () => {
    const base = { EXPO_PUBLIC_API_URL: 'https://api.example.com' };
    expect(
      parseEnv({ ...base, EXPO_PUBLIC_SUPPORT_EMAIL: 'help@example.com' }, false).supportEmail,
    ).toBe('help@example.com');
    expect(
      parseEnv({ ...base, EXPO_PUBLIC_SUPPORT_EMAIL: '' }, false).supportEmail,
    ).toBeUndefined();
    expect(() => parseEnv({ ...base, EXPO_PUBLIC_SUPPORT_EMAIL: 'nope' }, false)).toThrow(
      /SUPPORT_EMAIL/,
    );
  });
});
