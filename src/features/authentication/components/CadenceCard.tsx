import { Pressable, View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { glow, useTheme } from '@/theme';

import { WEEKDAYS } from '../utils/onboarding.logic';

export interface CadenceCardProps {
  days: number;
  label: string;
  rest: string;
  onChange: (days: number) => void;
}

/** Tap the n-th bar to train n days a week; tapping the current last bar steps down by one. */
export function CadenceCard({ days, label, rest, onChange }: CadenceCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 12 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View>
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Weekly Cadence
          </AppText>
          <AppText
            variant="metricLg"
            color="onSurface"
            accessibilityLabel={`${days} days per week`}
          >
            {days} {days === 1 ? 'Day' : 'Days'} / Week
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <AppText variant="labelCaps" color="primary">
              {label}
            </AppText>
          </View>
          <AppText
            variant="bodySm"
            color="onSurfaceVariant"
            style={{ marginTop: 2, textAlign: 'right' }}
          >
            {rest}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, paddingTop: 4 }}>
        {WEEKDAYS.map((day, i) => {
          const active = i < days;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={`Train ${i + 1} days per week`}
              accessibilityState={{ selected: i === days - 1 }}
              hitSlop={{ top: 12, bottom: 12 }}
              onPress={() => onChange(i + 1 === days && days > 1 ? days - 1 : i + 1)}
              style={{ flex: 1 }}
            >
              <View
                style={[
                  {
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceHighest,
                  },
                  active &&
                    glow(theme.colors.primary, i === days - 1 ? 0.9 : 0.6, i === days - 1 ? 12 : 8),
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 2 }}>
        {WEEKDAYS.map((day, i) => (
          <AppText
            key={day}
            variant="labelCaps"
            color={i < days ? 'onSurfaceVariant' : 'outline'}
            style={{ flex: 1, textAlign: 'center' }}
          >
            {day}
          </AppText>
        ))}
      </View>
    </Card>
  );
}
