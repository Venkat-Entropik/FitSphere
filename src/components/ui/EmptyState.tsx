import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { SecondaryButton } from './SecondaryButton';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon = 'inbox',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { padding: theme.spacing.lg, gap: theme.spacing.sm }]}>
      <Icon name={icon} size={48} color="outline" />
      <AppText variant="headlineMd" style={styles.centered}>
        {title}
      </AppText>
      {message ? (
        <AppText color="onSurfaceVariant" style={styles.centered}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <SecondaryButton
          label={actionLabel}
          onPress={onAction}
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
