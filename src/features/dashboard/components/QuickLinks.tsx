import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

const LINKS = [
  { label: 'Nutrition', hint: 'Log food and water', icon: 'restaurant', href: '/nutrition' },
  { label: 'Progress', hint: 'Weight and history', icon: 'trending_up', href: '/progress' },
  { label: 'Analytics', hint: 'Trends and charts', icon: 'insights', href: '/analytics' },
] as const;

/** Nutrition, Progress and Analytics are not in the tab bar, so Home is the way in. */
export function QuickLinks() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {LINKS.map((link) => (
        <Pressable
          key={link.label}
          accessibilityRole="button"
          accessibilityLabel={`${link.label}. ${link.hint}`}
          onPress={() => router.navigate(link.href)}
          style={({ pressed }) => ({
            flex: 1,
            gap: 6,
            padding: 12,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surfaceLow,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Icon name={link.icon} size={22} color="primary" />
          <AppText variant="labelUi" weight="semibold">
            {link.label}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={2}>
            {link.hint}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
