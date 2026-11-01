import { secureStorage } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth.store';

describe('auth store', () => {
  beforeEach(async () => {
    await secureStorage.clearTokens();
    useAuthStore.setState({ status: 'loading' });
  });

  it('hydrates to signedOut when no tokens are stored', async () => {
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signIn persists tokens in secure storage and updates status', async () => {
    await useAuthStore.getState().signIn({ accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(await secureStorage.getTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('hydrates to signedIn from stored tokens, and signOut clears them', async () => {
    await secureStorage.setTokens({ accessToken: 'a', refreshToken: null });
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('signedIn');

    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(await secureStorage.getTokens()).toBeNull();
  });
});
