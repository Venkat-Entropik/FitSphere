import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppErrorScreen } from '@/components/common/AppErrorScreen';
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/theme';
import { fontAssets } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

/** Expo Router renders this when any screen throws, in place of a white screen. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorScreen error={error} onRetry={retry} />;
}

/** Route gate: signed-out users only see (auth); signed-in users only see the app and onboarding. */
function RootStack() {
  const theme = useTheme();
  const signedIn = useAuthStore((s) => s.status === 'signedIn');
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="routine-editor" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const authStatus = useAuthStore((s) => s.status);

  // Read the stored session once, before any route renders.
  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  const ready = (fontsLoaded || fontError !== null) && authStatus !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}
