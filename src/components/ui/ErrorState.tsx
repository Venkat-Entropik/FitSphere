import { StyleSheet, View } from 'react-native';

import { toApiError } from '@/services/api/api-error';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { SecondaryButton } from './SecondaryButton';

export interface ErrorStateProps {
  /** Any thrown value; normalized to a user-presentable message. */
  error?: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = 'Something went wrong', onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const message = error ? toApiError(error).message : undefined;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { padding: theme.spacing.lg, gap: theme.spacing.sm }]}
    >
      <Icon name="error_outline" size={48} color="error" />
      <AppText variant="headlineMd" style={styles.centered}>
        {title}
      </AppText>
      {message ? (
        <AppText color="onSurfaceVariant" style={styles.centered}>
          {message}
        </AppText>
      ) : null}
      {onRetry ? (
        <SecondaryButton
          label="Try again"
          onPress={onRetry}
          fullWidth={false}
          style={{ marginTop: theme.spacing.md }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centered: { textAlign: 'center' },
});
