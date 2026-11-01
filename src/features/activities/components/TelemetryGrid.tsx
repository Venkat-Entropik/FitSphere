import { View } from 'react-native';

import { MetricCard } from '@/components/cards/MetricCard';
import { AppText } from '@/components/ui/AppText';
import { glow, useTheme } from '@/theme';

import type { ActivitySnapshot } from '../types/activity.types';
import { formatDuration, formatPace } from '../utils/activity.logic';

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function TelemetryGrid({ snapshot: s }: { snapshot: ActivitySnapshot }) {
  const theme = useTheme();
  const paceInTarget =
    s.currentPaceSecPerKm !== null &&
    s.targetPaceSecPerKm !== null &&
    s.currentPaceSecPerKm <= s.targetPaceSecPerKm;

  return (
    <View style={{ gap: 8 }}>
      <Row>
        <Cell>
          <MetricCard
            label="Duration"
            icon="schedule"
            value={formatDuration(s.durationSec)}
            caption={`Moving time ${formatDuration(s.movingSec)}`}
          />
        </Cell>
        <Cell>
          <MetricCard
            label="Current Pace"
            icon="speed"
            accent="primary"
            value={formatPace(s.currentPaceSecPerKm)}
            unit="/km"
            valueColor="primary"
            caption={paceInTarget ? 'Target zone' : 'Building pace'}
            captionIcon="trending_up"
            captionColor="primary"
            badge={
              <View
                style={[
                  { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
                  glow(theme.colors.primary, 0.8, 4),
                ]}
              />
            }
          />
        </Cell>
      </Row>
      <Row>
        <Cell>
          <MetricCard
            label="Avg Pace"
            icon="av_timer"
            value={formatPace(s.avgPaceSecPerKm)}
            unit="/km"
            caption={
              s.targetPaceSecPerKm ? `Target ${formatPace(s.targetPaceSecPerKm)}` : undefined
            }
          />
        </Cell>
        <Cell>
          <MetricCard
            label="Burned"
            icon="local_fire_department"
            accent="secondary"
            value={String(s.kcal)}
            unit="kcal"
            caption={s.isDemo ? 'Active burn' : 'Estimated'}
          />
        </Cell>
      </Row>
      <Row>
        <Cell>
          <MetricCard
            label="Heart Rate"
            icon="favorite"
            accent="error"
            value={s.heartRateBpm !== null ? String(s.heartRateBpm) : '--'}
            unit="bpm"
            caption={s.heartRateBpm !== null ? 'Threshold aerobic' : 'No sensor connected'}
            badge={
              s.heartZone ? (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: theme.radius.xs,
                    backgroundColor: theme.colors.errorContainer,
                  }}
                >
                  <AppText variant="labelCaps" color="onErrorContainer">
                    {s.heartZone}
                  </AppText>
                </View>
              ) : undefined
            }
          />
        </Cell>
        <Cell>
          <MetricCard
            label="Elev Gain"
            icon="landscape"
            accent="secondary"
            value={`+${s.elevationGainM}`}
            unit="m"
            caption={s.maxGradePct !== null ? `Max grade ${s.maxGradePct}%` : undefined}
          />
        </Cell>
      </Row>
    </View>
  );
}
