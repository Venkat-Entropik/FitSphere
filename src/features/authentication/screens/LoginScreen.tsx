import { useRouter } from 'expo-router';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/auth.store';

/** No Stitch design exists for sign-in yet; in mock mode a demo session lets you back into the app. */
export function LoginScreen() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState title="Sign in" message="No design has been provided for this screen yet." />
      {env.useMocks ? (
        <>
          <PrimaryButton
            label="Continue in demo mode"
            onPress={() => {
              void useAuthStore
                .getState()
                .signIn({ accessToken: 'demo-session', refreshToken: null })
                .then(() => router.replace('/'));
            }}
          />
          <AppText variant="bodySm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
            Demo mode uses sample data stored on this device.
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}
