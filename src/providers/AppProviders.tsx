import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setUnauthorizedHandler } from '@/services/api/api-client';
import { createQueryClient } from '@/services/api/query-client';
import { useAuthStore } from '@/store/auth.store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
    // A 401 from any request signs the user out and drops cached server data.
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().signOut();
      queryClient.clear();
    });
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
