import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RegisterScreen } from '@/features/authentication/screens/RegisterScreen';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '@/features/legal/legal.content';
import { PrivacyPolicyScreen, TermsScreen } from '@/features/legal/screens/LegalScreen';

const mockNavigate = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));

beforeEach(() => jest.clearAllMocks());

describe('legal pages', () => {
  it('shows every section of the privacy policy', async () => {
    await render(<PrivacyPolicyScreen />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    for (const section of PRIVACY_POLICY.sections) {
      expect(screen.getByText(section.heading)).toBeTruthy();
    }
    expect(screen.getByText(/Last updated/)).toBeTruthy();
  });

  it('shows every section of the terms', async () => {
    await render(<TermsScreen />);
    for (const section of TERMS_OF_SERVICE.sections) {
      expect(screen.getByText(section.heading)).toBeTruthy();
    }
  });

  it('is honest about what the app does: AI, location, deletion and third parties', () => {
    const text = JSON.stringify(PRIVACY_POLICY);
    for (const fact of [
      'Gemini',
      'GPS',
      'Delete account',
      'YouTube',
      'Open Food Facts',
      'hash',
      'under 16',
    ]) {
      expect(text).toContain(fact);
    }
    expect(JSON.stringify(TERMS_OF_SERVICE)).toMatch(/not medical advice/i);
  });

  it('goes back from the page', async () => {
    await render(<TermsScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('sign-up consent', () => {
  it('links to the terms and privacy policy before the user creates an account', async () => {
    const client = new QueryClient();
    await render(
      <QueryClientProvider client={client}>
        <RegisterScreen />
      </QueryClientProvider>,
    );
    await fireEvent.press(screen.getByRole('link', { name: 'Terms of Service' }));
    expect(mockNavigate).toHaveBeenCalledWith('/terms');
    await fireEvent.press(screen.getByRole('link', { name: 'Privacy Policy' }));
    expect(mockNavigate).toHaveBeenCalledWith('/privacy');
  });
});
