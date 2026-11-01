import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.root, { backgroundColor: theme.colors.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            theme.shadows.md,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
            },
          ]}
        >
          <AppText variant="headlineMd">{title}</AppText>
          {message ? <AppText color="onSurfaceVariant">{message}</AppText> : null}
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={destructive ? { backgroundColor: theme.colors.error } : undefined}
            />
            <SecondaryButton label={cancelLabel} onPress={onCancel} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { alignSelf: 'stretch' },
});
