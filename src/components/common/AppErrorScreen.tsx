import { View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useTheme } from '@/theme';

export interface AppErrorScreenProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Shown instead of a blank screen when a screen crashes. Users get a calm message and a retry; the
 * technical message appears only in development.
 */
export function AppErrorScreen({ error, onRetry }: AppErrorScreenProps) {
  const theme = useTheme();
  return (
    <Screen>
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <Icon name="error_outline" size={32} color="error" />
        </View>
        <AppText variant="headlineMd" style={{ textAlign: 'center' }} accessibilityRole="header">
          Something went wrong
        </AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
          The app hit an unexpected problem. Your logged data is safe. Try again, and if it keeps
          happening, close and reopen the app.
        </AppText>
        {__DEV__ ? (
          <AppText variant="bodySm" color="error" style={{ textAlign: 'center' }}>
            {error.message}
          </AppText>
        ) : null}
        <PrimaryButton label="Try again" onPress={onRetry} />
      </View>
    </Screen>
  );
}
