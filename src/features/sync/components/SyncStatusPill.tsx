import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { glow, useTheme, type ColorToken } from '@/theme';

import { useSyncStatus, type SyncState } from '../useSyncStatus';
import { SyncSheet } from './SyncSheet';

const LOOK: Record<SyncState, { label: string; color: ColorToken }> = {
  synced: { label: 'Synced', color: 'primary' },
  syncing: { label: 'Syncing', color: 'secondary' },
  offline: { label: 'Offline', color: 'warning' },
  waiting: { label: 'Waiting', color: 'warning' },
  attention: { label: 'Needs attention', color: 'error' },
};

/**
 * The header's one glance at sync: a coloured dot and a word. Tap for details. Shows nothing for the
 * offline demo, which has no server to sync with.
 */
export function SyncStatusPill() {
  const theme = useTheme();
  const { enabled, state, pending, failed } = useSyncStatus();
  const [open, setOpen] = useState(false);
  if (!enabled) return null;

  const look = LOOK[state];
  const waiting = pending.length + failed.length;
  const label = waiting > 0 && state !== 'synced' ? `${look.label} · ${waiting}` : look.label;
  const spoken =
    waiting > 0
      ? `Sync status: ${look.label}, ${waiting} ${waiting === 1 ? 'change' : 'changes'} waiting. Opens details.`
      : `Sync status: ${look.label}. Opens details.`;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={spoken}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 9999,
          backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
        })}
      >
        <View
          style={[
            { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors[look.color] },
            glow(theme.colors[look.color], 0.9, 6),
          ]}
        />
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          {label}
        </AppText>
      </Pressable>
      <SyncSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
