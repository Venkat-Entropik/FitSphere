import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

interface TabSpec {
  icon: IconName;
  /** The AI Coach tab is a pill with a lime spark + "AI" in the design. */
  special?: boolean;
}

/** Only these routes appear in the bar; other routes in the group (nutrition, analytics…) stay hidden. */
const TABS: Record<string, TabSpec> = {
  index: { icon: 'dashboard' },
  workouts: { icon: 'fitness_center' },
  activity: { icon: 'local_fire_department' },
  coach: { icon: 'auto_awesome', special: true },
  profile: { icon: 'person' },
};

export function BottomTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: 'rgba(18, 20, 22, 0.94)',
          paddingBottom: insets.bottom,
          paddingHorizontal: theme.spacing.xs,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const spec = TABS[route.name];
        if (!spec) return null;
        const { options } = descriptors[route.key]!;
        const focused = state.index === index;
        const label = options.title ?? route.name;
        const color = focused ? 'primary' : 'onSurfaceVariant';

        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={spec.special ? `AI ${label}` : label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={[styles.tab, { minHeight: theme.minTouchTarget }]}
          >
            {spec.special ? (
              <View style={[styles.aiPill, { backgroundColor: theme.colors.surface }]}>
                <View style={glow(theme.colors.primary, 0.35, 12)}>
                  <Icon name={spec.icon} size={20} color="primary" />
                </View>
                <AppText variant="labelCaps" color="primary" weight="semibold">
                  AI
                </AppText>
              </View>
            ) : (
              <Icon name={spec.icon} size={24} color={color} />
            )}
            <AppText variant="labelCaps" color={color} weight={focused ? 'semibold' : 'semibold'}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 80,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
});
