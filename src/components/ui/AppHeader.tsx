import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { glow, useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export interface AppHeaderProps {
  /** Show the pulsing "LIVE" badge (present on every tab screen in the design). */
  live?: boolean;
}

/**
 * Brand header shared by all tab screens: wordmark, LIVE pill, avatar.
 * The Stitch brand-mark and avatar are remote photos that are not part of the export,
 * so the mark is omitted and the avatar is a neutral placeholder.
 */
export function AppHeader({ live = true }: AppHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
        {live ? (
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
        <View
          accessibilityRole="image"
          accessibilityLabel="Profile"
          style={[styles.avatar, { backgroundColor: theme.colors.surfaceHigh }]}
        >
          <Icon name="person" size={18} color="onSurfaceVariant" />
        </View>
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
