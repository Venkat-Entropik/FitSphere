import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { discardChange, retryChange, syncNow } from '@/services/sync';
import { describeChange, formatAgo } from '@/services/sync/describe';
import { useTheme } from '@/theme';

import { useSyncStatus, type SyncState } from '../useSyncStatus';

const COPY: Record<SyncState, { title: string; body: string }> = {
  synced: {
    title: 'All synced',
    body: 'Everything is saved on this phone and in your account.',
  },
  syncing: {
    title: 'Syncing…',
    body: 'Sending your latest changes. You can keep using the app.',
  },
  offline: {
    title: "You're offline",
    body: 'Keep going. Workouts, meals, water and weigh-ins are saved on this phone and will sync automatically when you are back online.',
  },
  waiting: {
    title: "Can't reach the server",
    body: 'Your changes are safe on this phone. We will keep trying and sync as soon as the server answers. The first request after a quiet spell can take up to a minute.',
  },
  attention: {
    title: 'Some changes were not saved',
    body: 'The server refused these. Try again, or discard them to match what is in your account.',
  },
};

export interface SyncSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Explains sync in plain words, lists anything waiting or refused, and offers "Sync now". */
export function SyncSheet({ visible, onClose }: SyncSheetProps) {
  const theme = useTheme();
  const { state, pending, failed, online, lastSyncedAt } = useSyncStatus();
  const copy = COPY[state];

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.title}>
      <View style={{ gap: 14 }}>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          {copy.body}
        </AppText>

        {pending.length > 0 ? (
          <View style={{ gap: 6 }} accessibilityLabel="Changes waiting to sync">
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Waiting to sync ({pending.length})
            </AppText>
            {pending.slice(0, 5).map((item) => (
              <AppText key={item.id} variant="bodySm">
                • {describeChange(item.change)}
              </AppText>
            ))}
            {pending.length > 5 ? (
              <AppText variant="bodySm" color="onSurfaceVariant">
                …and {pending.length - 5} more
              </AppText>
            ) : null}
          </View>
        ) : null}

        {failed.length > 0 ? (
          <View style={{ gap: 10 }} accessibilityLabel="Changes that were not saved">
            {failed.map((item) => (
              <View
                key={item.id}
                style={{
                  gap: 8,
                  padding: 12,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.surfaceLow,
                }}
              >
                <AppText variant="bodyMd" weight="semibold">
                  {describeChange(item.change)}
                </AppText>
                {item.error ? (
                  <AppText variant="bodySm" color="onSurfaceVariant">
                    {item.error}
                  </AppText>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      label="Try again"
                      size="md"
                      onPress={() => retryChange(item.id)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      label="Discard"
                      size="md"
                      onPress={() => discardChange(item.id)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="bodySm" color="onSurfaceVariant">
          {lastSyncedAt
            ? `Last synced ${formatAgo(lastSyncedAt)}.`
            : 'Not synced yet this session.'}
        </AppText>

        <PrimaryButton
          label={state === 'syncing' ? 'Syncing…' : 'Sync now'}
          onPress={() => void syncNow('manual')}
          disabled={!online || state === 'syncing'}
        />
        <SecondaryButton label="Close" onPress={onClose} size="md" />
      </View>
    </BottomSheet>
  );
}
