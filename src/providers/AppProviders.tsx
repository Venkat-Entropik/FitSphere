import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEMO_USER_ID } from '@/features/authentication/hooks/useDemoSession';
import { authService } from '@/features/authentication/services/auth.service';
import { setUnauthorizedHandler } from '@/services/api/api-client';
import { createQueryClient } from '@/services/api/query-client';
import { useAuthStore } from '@/store/auth.store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // A dead session (refresh failed, or a 401 after refresh) signs the user out and drops cached data.
    // The route gate then returns them to Sign in.
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().signOut();
      queryClient.clear();
    });

    // Refresh the display profile in the background; the cached copy renders immediately.
    const { status, user } = useAuthStore.getState();
    if (status === 'signedIn' && user?.id !== DEMO_USER_ID) {
      void authService
        .me()
        .then((fresh) => useAuthStore.getState().setUser(fresh))
        .catch(() => undefined);
    }
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
