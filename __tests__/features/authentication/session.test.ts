import { QueryClient } from '@tanstack/react-query';

import { startSession } from '@/features/authentication/services/session';
import { describeAuthFailure } from '@/features/authentication/utils/auth-errors';
import { ApiError } from '@/services/api/api-error';
import { useMockDb } from '@/services/mock-db/mock-db';
import { secureStorage } from '@/services/storage/secure-storage';
import { useActiveWorkoutStore } from '@/store/active-workout.store';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

const session = (id: string, name: string) => ({
  user: { id, name, email: `${id}@example.com` },
  tokens: { accessToken: `a-${id}`, refreshToken: `r-${id}`, expiresIn: 900 },
});

describe('startSession', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      lastUserId: null,
      onboardingComplete: false,
      onboardingSkipped: false,
    });
    useAuthStore.setState({ status: 'signedOut', user: null });
  });

  it('stores tokens, activates the session and clears cached server data', async () => {
    const client = new QueryClient();
    client.setQueryData(['x'], 1);
    await startSession(session('u1', 'Sam Lee'), client);
    expect(await secureStorage.getTokens()).toEqual({ accessToken: 'a-u1', refreshToken: 'r-u1' });
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      user: { id: 'u1', name: 'Sam Lee' },
    });
    expect(client.getQueryData(['x'])).toBeUndefined();
  });

  it("gives a new user a clean slate named after them instead of the previous user's data", async () => {
    usePreferencesStore.setState({ lastUserId: 'old', onboardingComplete: true });
    useMockDb.setState((s) => ({
      profile: { ...s.profile, profile: { ...s.profile.profile, weightKg: 123 } },
    }));
    await startSession(session('u2', 'Sam Lee'), new QueryClient());
    const db = useMockDb.getState();
    expect(db.profile.identity.name).toBe('Sam Lee');
    expect(db.profile.profile.weightKg).toBe(68.5);
    expect(usePreferencesStore.getState()).toMatchObject({
      lastUserId: 'u2',
      onboardingComplete: false,
    });
  });

  it('keeps everything when the same user signs back in', async () => {
    usePreferencesStore.setState({ lastUserId: 'u2', onboardingComplete: true });
    useMockDb.setState((s) => ({
      profile: { ...s.profile, profile: { ...s.profile.profile, weightKg: 77 } },
    }));
    await startSession(session('u2', 'Sam Lee'), new QueryClient());
    expect(useMockDb.getState().profile.profile.weightKg).toBe(77);
    expect(usePreferencesStore.getState().onboardingComplete).toBe(true);
  });

  it('drops a live workout belonging to the previous account', async () => {
    useActiveWorkoutStore.setState({ session: { id: 's' } as never, rest: null });
    usePreferencesStore.setState({ lastUserId: 'old' });
    await startSession(session('u3', 'New Person'), new QueryClient());
    expect(useActiveWorkoutStore.getState().session).toBeNull();
  });
});

describe('describeAuthFailure', () => {
  const fields = ['email', 'password'] as const;

  it('puts field errors on their inputs and leaves no banner', () => {
    const error = new ApiError('An account with this email already exists.', 'validation', 409, {
      email: 'An account with this email already exists.',
    });
    expect(describeAuthFailure(error, fields)).toEqual({
      fieldErrors: { email: 'An account with this email already exists.' },
      banner: null,
    });
  });

  it('ignores field errors for inputs the form does not have, falling back to the banner', () => {
    const error = new ApiError('Bad name', 'validation', 400, { name: 'Bad name' });
    expect(describeAuthFailure(error, fields)).toEqual({ fieldErrors: {}, banner: 'Bad name' });
  });

  it('uses the banner for credential, rate-limit and network failures', () => {
    expect(
      describeAuthFailure(new ApiError('Invalid email or password.', 'unauthorized', 401), fields)
        .banner,
    ).toBe('Invalid email or password.');
    expect(describeAuthFailure(new Error('boom'), fields).banner).toBe('boom');
  });
});
