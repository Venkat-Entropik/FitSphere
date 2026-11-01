import { secureStorage } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth.store';

const user = { id: 'u1', name: 'Alex Chen', email: 'alex@example.com' };

describe('auth store', () => {
  beforeEach(async () => {
    await secureStorage.clearTokens();
    useAuthStore.setState({ status: 'loading', user: null });
  });

  it('hydrates to signedOut when no tokens are stored', async () => {
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('signIn persists tokens in secure storage and keeps the user profile in state', async () => {
    await useAuthStore.getState().signIn({ accessToken: 'a', refreshToken: 'r' }, user);
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(useAuthStore.getState().user).toEqual(user);
    expect(await secureStorage.getTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('hydrates to signedIn from stored tokens, and signOut clears tokens and user', async () => {
    await secureStorage.setTokens({ accessToken: 'a', refreshToken: null });
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().status).toBe('signedIn');

    await useAuthStore.getState().signIn({ accessToken: 'a', refreshToken: 'r' }, user);
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(useAuthStore.getState().user).toBeNull();
    expect(await secureStorage.getTokens()).toBeNull();
  });

  it('never puts tokens in the persisted (AsyncStorage) state', () => {
    const persisted = useAuthStore.persist.getOptions().partialize?.(useAuthStore.getState());
    expect(Object.keys(persisted ?? {})).toEqual(['user']);
  });
});
