import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <AppText variant="labelUi" weight="semibold" accessibilityRole="header">
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          hitSlop={12}
          style={{ minHeight: theme.minTouchTarget / 2, justifyContent: 'center' }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
