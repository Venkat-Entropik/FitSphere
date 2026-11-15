import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SyncStatusPill } from '@/features/sync/components/SyncStatusPill';
import { env } from '@/config/env';
import { glow, useTheme } from '@/theme';
import { useStreak } from '@/features/progress/hooks/useStreak';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface AppHeaderProps {
  /** Show the pulsing "LIVE" badge (present on every tab screen in the design). */
  live?: boolean;
}

/**
 * Brand header shared by all tab screens: wordmark, sync status, and the current training streak (opens Progress).
 */
export function AppHeader({ live = true }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const streak = useStreak();
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingHorizontal: theme.spacing.gutterX,
          backgroundColor: 'rgba(18, 20, 22, 0.92)',
        },
      ]}
    >
      <AppText variant="headlineMd" accessibilityRole="header">
        FitSphere
      </AppText>
      <View style={styles.right}>
        {/* With the real backend the pill reports sync; the offline demo keeps the LIVE badge. */}
        {!env.useMocks ? <SyncStatusPill /> : null}
        {live && env.useMocks ? (
          <View style={[styles.live, { backgroundColor: theme.colors.surface }]}>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.primary },
                glow(theme.colors.primary, 0.9, 6),
              ]}
            />
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Live
            </AppText>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${streak} day streak. Open progress`}
          hitSlop={8}
          onPress={() => router.navigate('/progress')}
          style={[styles.live, { backgroundColor: theme.colors.surface }]}
        >
          <Icon
            name="local_fire_department"
            size={16}
            color={streak > 0 ? 'primary' : 'onSurfaceVariant'}
          />
          <AppText variant="labelUi" weight="semibold" tabular>
            {streak}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
