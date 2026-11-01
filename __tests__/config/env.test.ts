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
});
