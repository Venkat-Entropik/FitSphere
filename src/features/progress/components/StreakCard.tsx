import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { ProgressOverview } from '../types/progress.types';
import { adherencePercent } from '../utils/progress.logic';

export function StreakCard({ streak }: { streak: ProgressOverview['streak'] }) {
  const theme = useTheme();
  const rows = [streak.heatmap.slice(0, 7), streak.heatmap.slice(7, 14)];
  const lastDay = streak.heatmap[streak.heatmap.length - 1]?.day;
  return (
    <Card style={{ padding: 20, gap: 16, backgroundColor: theme.colors.surfaceHigh }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 }}>
          <View
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceLowest,
              },
              glow(theme.colors.primary, 0.35, 20),
            ]}
          >
            <Icon name="local_fire_department" size={28} color="primary" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <AppText variant="headlineMd">{streak.days}-Day Streak</AppText>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: theme.radius.pill,
                  backgroundColor: 'rgba(197, 242, 106, 0.2)',
                }}
              >
                <AppText variant="labelCaps" color="primary" uppercase>
                  Unbroken
                </AppText>
              </View>
            </View>
            <AppText variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 2 }}>
              Longest streak: {streak.bestStreak} {streak.bestStreak === 1 ? 'day' : 'days'}
            </AppText>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="metricLg" color="primary" tabular>
            {streak.weekDone}/{streak.weekTarget}
          </AppText>
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            Wk Goal
          </AppText>
        </View>
      </View>
      <View
        style={{ borderTopWidth: 1, borderTopColor: theme.colors.surface, paddingTop: 14, gap: 8 }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            style={{ letterSpacing: 0.9 }}
          >
            Telemetry Heat Map
          </AppText>
          <AppText variant="labelCaps" color="primary" weight="medium">
            {adherencePercent(streak.heatmap)}% Adherence
          </AppText>
        </View>
        <View style={{ gap: 6 }}>
          {rows.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
              {row.map((cell) => {
                const rest = cell.kind === 'rest';
                const tint = rest
                  ? theme.colors.surfaceHighest
                  : cell.kind === 'cardio'
                    ? theme.colors.secondary
                    : theme.colors.primary;
                const isLast = cell.day === lastDay;
                return (
                  <View
                    key={cell.day}
                    accessibilityLabel={`Day ${cell.day}, ${rest ? 'rest day' : `${cell.kind} session`}`}
                    style={[
                      {
                        flex: 1,
                        height: 28,
                        borderRadius: theme.radius.xs,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: tint,
                        opacity: isLast || rest ? 1 : 0.9,
                      },
                      !rest && glow(tint, isLast ? 0.6 : 0.25, isLast ? 12 : 8),
                      isLast &&
                        !rest && { borderWidth: 2, borderColor: 'rgba(197, 242, 106, 0.6)' },
                    ]}
                  >
                    <AppText
                      variant="labelCaps"
                      color={
                        rest
                          ? 'onSurfaceVariant'
                          : cell.kind === 'cardio'
                            ? 'onSecondary'
                            : 'onPrimary'
                      }
                      weight="bold"
                      style={{ fontSize: 9 }}
                    >
                      {cell.day}
                    </AppText>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
