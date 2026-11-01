import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

export interface StartWorkoutCtaProps {
  scheduledLabel: string;
  weekNumber: number;
  programWeeks: number;
  onStart: () => void;
}

export function StartWorkoutCta({
  scheduledLabel,
  weekNumber,
  programWeeks,
  onStart,
}: StartWorkoutCtaProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Button
        size="lg"
        label="Start Workout"
        onPress={onStart}
        leftIcon={<Icon name="fitness_center" size={26} color="onPrimary" />}
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppText variant="labelCaps" color="onPrimary" uppercase style={{ opacity: 0.8 }}>
              Ready
            </AppText>
            <Icon name="arrow_forward" size={20} color="onPrimary" />
          </View>
        }
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <View
            style={[
              { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
              glow(theme.colors.primary, 0.8, 4),
            ]}
          />
          <AppText variant="bodySm" numberOfLines={1}>
            {scheduledLabel}
          </AppText>
        </View>
        <AppText variant="labelCaps" color="primary">
          Week {weekNumber} / {programWeeks}
        </AppText>
      </View>
    </View>
  );
}
