import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { DeleteAccountSheet } from '@/features/authentication/components/DeleteAccountSheet';
import { ForgotPasswordScreen } from '@/features/authentication/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/features/authentication/screens/LoginScreen';
import { ResetPasswordScreen } from '@/features/authentication/screens/ResetPasswordScreen';
import { authService } from '@/features/authentication/services/auth.service';
import {
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/features/authentication/types/auth.schemas';
import { ApiError } from '@/services/api/api-error';
import { useMockDb } from '@/services/mock-db/mock-db';
import { secureStorage } from '@/services/storage/secure-storage';
import { useAuthStore } from '@/store/auth.store';
import { usePreferencesStore } from '@/store/preferences.store';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

const renderWith = async (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

beforeEach(async () => {
  jest.restoreAllMocks();
  mockNavigate.mockClear();
  mockReplace.mockClear();
  mockParams = {};
  await secureStorage.clearTokens();
  useAuthStore.setState({ status: 'signedOut', user: null });
});

describe('schemas', () => {
  it('forgotPasswordSchema needs a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('resetPasswordSchema needs a 6-digit code and a matching strong password', () => {
    const valid = {
      email: 'a@b.co',
      code: '123456',
      password: 'abcdefg1',
      confirmPassword: 'abcdefg1',
    };
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ ...valid, code: '12345' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, code: '12345a' }).success).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ ...valid, password: 'short1', confirmPassword: 'short1' })
        .success,
    ).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'different1' }).success).toBe(
      false,
    );
  });

  it('deleteAccountSchema needs a password', () => {
    expect(deleteAccountSchema.safeParse({ password: '' }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ password: 'x' }).success).toBe(true);
  });
});

describe('LoginScreen', () => {
  it('links to password reset', async () => {
    await renderWith(<LoginScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Forgot password' }));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('confirms a finished reset', async () => {
    mockParams = { reset: '1' };
    await renderWith(<LoginScreen />);
    expect(screen.getByText(/Password updated/)).toBeTruthy();
  });
});

describe('ForgotPasswordScreen', () => {
  it('validates the email before calling the server', async () => {
    const forgot = jest.spyOn(authService, 'forgotPassword');
    await renderWith(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'nope');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset code' }));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(forgot).not.toHaveBeenCalled();
  });

  it('requests a code and moves on to entering it', async () => {
    const forgot = jest.spyOn(authService, 'forgotPassword').mockResolvedValue();
    await renderWith(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset code' }));
    await waitFor(() => expect(forgot).toHaveBeenCalledWith('alex@example.com'));
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/reset-password',
      params: { email: 'alex@example.com' },
    });
  });

  it('shows rate-limit errors instead of moving on', async () => {
    jest
      .spyOn(authService, 'forgotPassword')
      .mockRejectedValue(new ApiError('Too many reset requests. Try again later.', 'unknown', 429));
    await renderWith(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send reset code' }));
    expect(await screen.findByText('Too many reset requests. Try again later.')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordScreen', () => {
  const fill = async (code: string, password: string, confirm = password) => {
    await fireEvent.changeText(screen.getByLabelText('6-digit code'), code);
    await fireEvent.changeText(screen.getByLabelText('New password'), password);
    await fireEvent.changeText(screen.getByLabelText('Confirm new password'), confirm);
  };

  it('prefills the email, resets the password and returns to sign in', async () => {
    mockParams = { email: 'alex@example.com' };
    const reset = jest.spyOn(authService, 'resetPassword').mockResolvedValue();
    await renderWith(<ResetPasswordScreen />);
    await fill('123456', 'NewPassw0rd');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({
        email: 'alex@example.com',
        code: '123456',
        password: 'NewPassw0rd',
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/login', params: { reset: '1' } });
  });

  it('does not submit mismatched passwords or a short code', async () => {
    mockParams = { email: 'alex@example.com' };
    const reset = jest.spyOn(authService, 'resetPassword');
    await renderWith(<ResetPasswordScreen />);
    await fill('123', 'NewPassw0rd', 'Different1');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Passwords do not match')).toBeTruthy();
    expect(screen.getByText('Enter the 6-digit code from your email')).toBeTruthy();
    expect(reset).not.toHaveBeenCalled();
  });

  it('puts a rejected code on the code field', async () => {
    mockParams = { email: 'alex@example.com' };
    jest.spyOn(authService, 'resetPassword').mockRejectedValue(
      new ApiError('That code is invalid or has expired.', 'validation', 400, {
        code: 'That code is invalid or has expired.',
      }),
    );
    await renderWith(<ResetPasswordScreen />);
    await fill('000000', 'NewPassw0rd');
    await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('That code is invalid or has expired.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('can ask for a new code', async () => {
    mockParams = { email: 'alex@example.com' };
    const forgot = jest.spyOn(authService, 'forgotPassword').mockResolvedValue();
    await renderWith(<ResetPasswordScreen />);
    await fireEvent.press(screen.getByRole('link', { name: 'Send a new code' }));
    await waitFor(() => expect(forgot).toHaveBeenCalledWith('alex@example.com'));
  });
});

describe('DeleteAccountSheet', () => {
  const signedIn = async () => {
    await secureStorage.setTokens({ accessToken: 'a', refreshToken: 'r' });
    useAuthStore.setState({
      status: 'signedIn',
      user: { id: 'u1', name: 'Alex', email: 'alex@example.com' },
    });
  };

  it('needs the password before it calls the server', async () => {
    const del = jest.spyOn(authService, 'deleteAccount');
    await renderWith(<DeleteAccountSheet visible onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('Enter your password to confirm')).toBeTruthy();
    expect(del).not.toHaveBeenCalled();
  });

  it('keeps the account and session when the password is wrong', async () => {
    await signedIn();
    jest
      .spyOn(authService, 'deleteAccount')
      .mockRejectedValue(new ApiError('Incorrect password.', 'unknown', 403));
    await renderWith(<DeleteAccountSheet visible onClose={jest.fn()} />);
    await fireEvent.changeText(screen.getByLabelText('Confirm with your password'), 'WrongPass1');
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('Incorrect password.')).toBeTruthy();
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(await secureStorage.getTokens()).not.toBeNull();
  });

  it('deletes the account, then wipes this device and returns to sign in', async () => {
    await signedIn();
    usePreferencesStore.setState({ onboardingComplete: true, lastUserId: 'u1' });
    useMockDb.setState((s) => ({
      profile: { ...s.profile, profile: { ...s.profile.profile, weightKg: 123 } },
    }));
    const del = jest.spyOn(authService, 'deleteAccount').mockResolvedValue();
    await renderWith(<DeleteAccountSheet visible onClose={jest.fn()} />);
    await fireEvent.changeText(screen.getByLabelText('Confirm with your password'), 'Passw0rdOK');
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => expect(useAuthStore.getState().status).toBe('signedOut'));
    expect(del).toHaveBeenCalledWith('Passw0rdOK');
    expect(await secureStorage.getTokens()).toBeNull();
    expect(usePreferencesStore.getState()).toMatchObject({
      onboardingComplete: false,
      lastUserId: null,
    });
    expect(useMockDb.getState().profile.profile.weightKg).not.toBe(123);
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
