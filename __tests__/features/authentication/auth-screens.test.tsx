import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LoginScreen } from '@/features/authentication/screens/LoginScreen';
import { RegisterScreen } from '@/features/authentication/screens/RegisterScreen';
import { authService } from '@/features/authentication/services/auth.service';
import { ApiError } from '@/services/api/api-error';
import { secureStorage } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: jest.fn() }),
}));

const session = {
  user: { id: 'u1', name: 'Alex Chen', email: 'alex@example.com' },
  tokens: { accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 },
};

const renderWith = async (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

beforeEach(async () => {
  jest.restoreAllMocks();
  mockNavigate.mockClear();
  await secureStorage.clearTokens();
  useAuthStore.setState({ status: 'signedOut', user: null });
  usePreferencesStore.setState({ lastUserId: null });
});

describe('LoginScreen', () => {
  const fill = async (email: string, password: string) => {
    await fireEvent.changeText(screen.getByLabelText('Email'), email);
    await fireEvent.changeText(screen.getByLabelText('Password'), password);
  };

  it('validates before calling the server', async () => {
    const login = jest.spyOn(authService, 'login');
    await renderWith(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    await fillAndSubmitBadEmail();
    expect(login).not.toHaveBeenCalled();

    async function fillAndSubmitBadEmail() {
      await fill('nope', 'x');
      await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
      expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    }
  });

  it('signs in: sends the credentials, stores the session, and activates it', async () => {
    const login = jest.spyOn(authService, 'login').mockResolvedValue(session);
    await renderWith(<LoginScreen />);
    await fill('alex@example.com', 'Passw0rdOK');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedIn'));
    expect(login).toHaveBeenCalledWith({ email: 'alex@example.com', password: 'Passw0rdOK' });
    expect(await secureStorage.getTokens()).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(useAuthStore.getState().user?.name).toBe('Alex Chen');
  });

  it('shows the server message for wrong credentials and stays signed out', async () => {
    jest
      .spyOn(authService, 'login')
      .mockRejectedValue(new ApiError('Invalid email or password.', 'unauthorized', 401));
    await renderWith(<LoginScreen />);
    await fill('alex@example.com', 'WrongPass1');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password.')).toBeTruthy();
    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(await secureStorage.getTokens()).toBeNull();
  });

  it('explains when the network is down or the account is locked', async () => {
    const login = jest
      .spyOn(authService, 'login')
      .mockRejectedValue(
        new ApiError('No connection. Check your internet and try again.', 'network'),
      );
    await renderWith(<LoginScreen />);
    await fill('alex@example.com', 'Passw0rdOK');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/No connection/)).toBeTruthy();

    login.mockRejectedValue(
      new ApiError('Too many failed attempts. Try again in 15 min.', 'unknown', 429),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText(/Too many failed attempts/)).toBeTruthy();
  });

  it('can reveal and hide the password', async () => {
    await renderWith(<LoginScreen />);
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });

  it('links to account creation', async () => {
    await renderWith(<LoginScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Create account' }));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('offers a clearly labelled offline demo in development with mock data', async () => {
    await renderWith(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue in demo mode' }));
    await waitFor(() => expect(useAuthStore.getState().user?.id).toBe('demo'));
    expect(screen.getByText(/No account is created/)).toBeTruthy();
  });
});

describe('RegisterScreen', () => {
  const fill = async (v: {
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }) => {
    await fireEvent.changeText(screen.getByLabelText('Name'), v.name ?? 'Alex Chen');
    await fireEvent.changeText(screen.getByLabelText('Email'), v.email ?? 'alex@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), v.password ?? 'Passw0rdOK');
    await fireEvent.changeText(
      screen.getByLabelText('Confirm password'),
      v.confirm ?? v.password ?? 'Passw0rdOK',
    );
  };

  it('validates name, email, password strength and confirmation', async () => {
    const register = jest.spyOn(authService, 'register');
    await renderWith(<RegisterScreen />);
    await fill({ name: 'A', email: 'bad', password: 'short', confirm: 'different' });
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Enter your name')).toBeTruthy();
    expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters')).toBeTruthy();

    await fill({ password: 'Passw0rdOK', confirm: 'Different1' });
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(register).not.toHaveBeenCalled();
  });

  it('creates the account without sending the confirmation field, then signs in', async () => {
    const register = jest.spyOn(authService, 'register').mockResolvedValue(session);
    await renderWith(<RegisterScreen />);
    await fill({});
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedIn'));
    expect(register).toHaveBeenCalledWith({
      name: 'Alex Chen',
      email: 'alex@example.com',
      password: 'Passw0rdOK',
    });
    expect(usePreferencesStore.getState().lastUserId).toBe('u1');
  });

  it("puts the server's duplicate-email error on the email field", async () => {
    jest
      .spyOn(authService, 'register')
      .mockRejectedValue(
        new ApiError('An account with this email already exists.', 'validation', 409, {
          email: 'An account with this email already exists.',
        }),
      );
    await renderWith(<RegisterScreen />);
    await fill({});
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('An account with this email already exists.')).toBeTruthy();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('links back to sign in', async () => {
    await renderWith(<RegisterScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Sign in' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
