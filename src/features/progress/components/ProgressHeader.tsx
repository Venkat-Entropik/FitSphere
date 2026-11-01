import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export function ProgressHeader({ label, onShare }: { label: string; onShare: () => void }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 0.9 }}>
          {label}
        </AppText>
        <AppText variant="headlineLgMobile" style={{ marginTop: 2 }} accessibilityRole="header">
          Progress &amp; Milestones
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share achievements"
        onPress={onShare}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon name="share" size={20} />
      </Pressable>
    </View>
  );
}
