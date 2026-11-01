import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { Sparkline } from '@/components/charts/Sparkline';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { AnalyticsOverview } from '../types/analytics.types';
import { signed } from '../utils/analytics.logic';

interface SignalTileProps {
  label: string;
  icon: IconName;
  iconColor: ColorToken;
  value: string;
  unit: string;
  caption: string;
  captionColor: ColorToken;
  captionIcon?: IconName;
  captionStrong?: boolean;
}

function SignalTile({
  label,
  icon,
  iconColor,
  value,
  unit,
  caption,
  captionColor,
  captionIcon,
  captionStrong,
}: SignalTileProps) {
  return (
    <Card style={{ flex: 1, padding: 14, justifyContent: 'space-between', ...{ minHeight: 100 } }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          {label}
        </AppText>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <AppText variant="metricLg" weight="extrabold" tabular>
            {value}
          </AppText>
          <AppText variant="labelUi" color="onSurfaceVariant">
            {unit}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
          {captionIcon ? <Icon name={captionIcon} size={13} color={captionColor} /> : null}
          <AppText
            variant={captionIcon ? 'bodySm' : 'labelCaps'}
            color={captionColor}
            weight={captionStrong ? 'semibold' : 'medium'}
          >
            {caption}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

export function BodySignals({ data }: { data: AnalyticsOverview }) {
  const theme = useTheme();
  const { weight } = data;
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText
          variant="labelCaps"
          color="onSurfaceVariant"
          uppercase
          style={{ letterSpacing: 0.9 }}
        >
          Body Density &amp; Recovery Signals
        </AppText>
        <AppText variant="labelCaps" color="primary">
          Live InBody Sync
        </AppText>
      </View>
      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Body Weight
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <AppText variant="metricLg" weight="extrabold" tabular>
                {weight.kg}
              </AppText>
              <AppText variant="labelUi" color="onSurfaceVariant">
                kg
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
                <Icon
                  name={weight.deltaKg <= 0 ? 'trending_down' : 'trending_up'}
                  size={14}
                  color="primary"
                />
                <AppText variant="labelCaps" color="primary" weight="semibold">
                  {' '}
                  {signed(weight.deltaKg)} kg
                </AppText>
              </View>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              uppercase
              style={{ fontSize: 10 }}
            >
              {weight.focusLabel}
            </AppText>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Sparkline values={weight.trend} height={40} accessibilityLabel="Body weight trend" />
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SignalTile
          label="Skeletal Muscle"
          icon="fitness_center"
          iconColor="primary"
          value={String(data.skeletalMuscle.kg)}
          unit="kg"
          caption={`${signed(data.skeletalMuscle.deltaKg)} kg lean gain`}
          captionColor="primary"
          captionIcon={data.skeletalMuscle.deltaKg >= 0 ? 'arrow_upward' : 'arrow_downward'}
        />
        <SignalTile
          label="Body Fat %"
          icon="pie_chart"
          iconColor="secondary"
          value={String(data.bodyFat.percent)}
          unit="%"
          caption={`${signed(data.bodyFat.deltaPercent)}% this cycle`}
          captionColor="secondary"
          captionIcon={data.bodyFat.deltaPercent <= 0 ? 'arrow_downward' : 'arrow_upward'}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <SignalTile
          label="Resting HR"
          icon="favorite"
          iconColor="error"
          value={String(data.restingHr.bpm)}
          unit="bpm"
          caption={data.restingHr.label}
          captionColor="onSurfaceVariant"
        />
        <SignalTile
          label="HRV Recovery"
          icon="ecg_heart"
          iconColor="tertiary"
          value={String(data.hrv.ms)}
          unit="ms"
          caption={data.hrv.label}
          captionColor="primary"
          captionStrong
        />
      </View>
    </View>
  );
}
