import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export interface LoadingIndicatorProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({ label, fullScreen = false }: LoadingIndicatorProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <AppText variant="bodySm" color="onSurfaceVariant" style={{ marginTop: theme.spacing.sm }}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1 },
});
