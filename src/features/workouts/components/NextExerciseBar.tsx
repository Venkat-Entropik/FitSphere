import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface NextExerciseBarProps {
  name: string;
  setCount: number;
}

export function NextExerciseBar({ name, setCount }: NextExerciseBarProps) {
  const theme = useTheme();
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="fitness_center" size={20} color="onSurfaceVariant" />
        </View>
        <View style={{ flexShrink: 1 }}>
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Next Exercise
          </AppText>
          <AppText variant="labelUi" weight="semibold" numberOfLines={1}>
            {name}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <AppText variant="labelCaps" color="onSurfaceVariant" weight="medium">
            {setCount} sets
          </AppText>
        </View>
        <Icon name="chevron_right" size={18} color="onSurfaceVariant" />
      </View>
    </Card>
  );
}
