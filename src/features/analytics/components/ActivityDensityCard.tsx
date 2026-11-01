import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { AnalyticsOverview } from '../types/analytics.types';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ActivityDensityCard({ density }: { density: AnalyticsOverview['density'] }) {
  const theme = useTheme();
  const rows: AnalyticsOverview['density']['days'][] = [];
  for (let i = 0; i < density.days.length; i += 7) rows.push(density.days.slice(i, i + 7));

  return (
    <Card style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="headlineMd" weight="bold">
              Activity Density
            </AppText>
            <Icon name="local_fire_department" size={18} color="primary" />
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant">
            30-day frequency &amp; streak discipline
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText
            variant="metricLg"
            color="primary"
            weight="extrabold"
            tabular
            style={{ lineHeight: 28 }}
          >
            {density.streakDays}
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Day Streak
          </AppText>
        </View>
      </View>
      <View style={{ paddingTop: 8, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {WEEKDAYS.map((d, i) => (
            <AppText
              key={i}
              variant="labelCaps"
              color="onSurfaceVariant"
              style={{ flex: 1, textAlign: 'center', fontSize: 9 }}
            >
              {d}
            </AppText>
          ))}
        </View>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
            {row.map((cell) => (
              <View
                key={cell.day}
                accessibilityLabel={`Day ${cell.day}, ${cell.active ? 'active session' : 'rest day'}`}
                style={[
                  {
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: cell.active
                      ? theme.colors.primary
                      : theme.colors.surfaceHighest,
                  },
                  cell.active && glow(theme.colors.primary, 0.3, 6),
                ]}
              >
                <AppText
                  variant="labelCaps"
                  color={cell.active ? 'onPrimary' : 'onSurfaceVariant'}
                  weight={cell.active ? 'bold' : 'semibold'}
                  style={{ fontSize: 9 }}
                >
                  {cell.day}
                </AppText>
              </View>
            ))}
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 16, paddingTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.surfaceHighest,
              }}
            />
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
              Rest Day
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.colors.primary,
              }}
            />
            <AppText variant="labelCaps" color="onSurfaceVariant" weight="regular">
              Active Session
            </AppText>
          </View>
        </View>
      </View>
    </Card>
  );
}
