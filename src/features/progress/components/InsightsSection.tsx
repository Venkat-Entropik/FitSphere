import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { RangeBar } from '@/components/charts/RangeBar';
import { Sparkline } from '@/components/charts/Sparkline';
import { TrendBars } from '@/components/charts/TrendBars';
import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import {
  cardioCopy,
  consistencyCopy,
  muscleCopy,
  statusLabel,
  strengthCopy,
  summaryCopy,
  tileSummary,
  volumeCopy,
} from '../utils/insights.copy';
import {
  compactNumber,
  formatVolume,
  paceLabel,
  SETS_SCALE_MAX,
  SETS_TARGET,
  type Change,
  type MuscleLoad,
  type StrengthTrend,
  type TrainingInsights,
} from '../utils/insights.logic';

function Chip({ text, color }: { text: string; color: ColorToken }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceHigh,
        alignSelf: 'flex-start',
      }}
    >
      <AppText variant="labelCaps" color={color} weight="bold" numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

/** Title, one-line takeaway, the chart, then a plain explanation of what it means. */
function InsightCard({
  icon,
  title,
  headline,
  detail,
  trailing,
  children,
}: {
  icon: IconName;
  title: string;
  headline: string;
  detail: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={icon} size={18} color="primary" />
          <AppText
            variant="labelCaps"
            color="onSurfaceVariant"
            uppercase
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {title}
          </AppText>
          {trailing}
        </View>
        <AppText variant="bodyLg" weight="semibold">
          {headline}
        </AppText>
      </View>
      {children}
      <View
        style={{
          gap: 4,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surfaceHigh,
        }}
      >
        <AppText variant="labelCaps" color="outline" uppercase>
          What this means
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {detail}
        </AppText>
      </View>
    </Card>
  );
}

const changeColor = (c: Change): ColorToken =>
  c.direction === 'up' ? 'primary' : c.direction === 'down' ? 'warning' : 'onSurfaceVariant';

function changeText(c: Change): string {
  if (c.direction === 'none') return 'New';
  if (c.direction === 'flat') return 'Same as usual';
  return `${c.direction === 'up' ? '▲' : '▼'} ${Math.abs(c.percent!)}% vs usual`;
}

function Tile({ label, value, change }: { label: string; value: string; change: Change }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${changeText(change)}`}
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        minWidth: 130,
        gap: 4,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="headlineMd" tabular numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="bodySm" color={changeColor(change)} numberOfLines={1}>
        {changeText(change)}
      </AppText>
    </View>
  );
}

const STRENGTH_TONE: Record<StrengthTrend['status'], ColorToken> = {
  improving: 'primary',
  steady: 'onSurfaceVariant',
  dipping: 'warning',
  baseline: 'secondary',
};

function StrengthRow({ trend }: { trend: StrengthTrend }) {
  const theme = useTheme();
  const tone = STRENGTH_TONE[trend.status];
  return (
    <View
      style={{
        gap: 8,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppText variant="labelUi" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
          {trend.name}
        </AppText>
        <Chip text={statusLabel(trend.status)} color={tone} />
      </View>
      {trend.points.length >= 2 ? (
        <Sparkline
          values={trend.points}
          height={44}
          color={tone === 'onSurfaceVariant' ? 'secondary' : tone === 'warning' ? 'tertiary' : tone}
          accessibilityLabel={`${trend.name} estimated one rep max over ${trend.sessions} sessions`}
        />
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <AppText
          variant="bodySm"
          color="onSurfaceVariant"
          numberOfLines={1}
          style={{ flexShrink: 1 }}
        >
          Best set {trend.bestSet.kg} kg × {trend.bestSet.reps}
        </AppText>
        <AppText variant="bodySm" tabular numberOfLines={1}>
          1RM ~{trend.current} kg
          {trend.status !== 'baseline' && trend.changePercent !== 0
            ? ` (${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%)`
            : ''}
        </AppText>
      </View>
    </View>
  );
}

const MUSCLE_TONE: Record<MuscleLoad['status'], ColorToken> = {
  none: 'outline',
  low: 'warning',
  good: 'primary',
  high: 'tertiary',
};
const MUSCLE_TEXT: Record<MuscleLoad['status'], string> = {
  none: 'None',
  low: 'Low',
  good: 'On target',
  high: 'High',
};

function MuscleRow({ muscle, index }: { muscle: MuscleLoad; index: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppText variant="labelUi" weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
          {muscle.label}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant" tabular>
          {muscle.sets} {muscle.sets === 1 ? 'set' : 'sets'}
        </AppText>
        <Chip text={MUSCLE_TEXT[muscle.status]} color={MUSCLE_TONE[muscle.status]} />
      </View>
      <RangeBar
        value={muscle.sets}
        max={SETS_SCALE_MAX}
        band={SETS_TARGET}
        color={MUSCLE_TONE[muscle.status]}
        index={index}
        accessibilityLabel={`${muscle.label}: ${muscle.sets} sets this week, target ${SETS_TARGET[0]} to ${SETS_TARGET[1]}`}
      />
    </View>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
        gap: 2,
        padding: 10,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="labelUi" weight="bold" tabular numberOfLines={1}>
        {value}
      </AppText>
      {sub ? (
        <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

export function InsightsSection({ insights }: { insights: TrainingInsights }) {
  const i = insights;
  const summary = summaryCopy(i);
  const volume = volumeCopy(i);
  const strength = strengthCopy(i.strength);
  const muscle = muscleCopy(i.muscles);
  const cardio = cardioCopy(i);
  const consistency = consistencyCopy(i);
  const loadChip = {
    baseline: { text: 'Building baseline', color: 'secondary' as const },
    light: { text: 'Light week', color: 'onSurfaceVariant' as const },
    steady: { text: 'Steady', color: 'primary' as const },
    ramping: { text: 'Ramping up', color: 'warning' as const },
  }[i.load.status];
  const paceChange =
    i.cardio.paceNow && i.cardio.pacePrev ? i.cardio.pacePrev - i.cardio.paceNow : null;

  return (
    <View style={{ gap: 12 }}>
      <AppText variant="headlineMd" accessibilityRole="header">
        Training insights
      </AppText>

      <InsightCard
        icon="insights"
        title="This week vs your average"
        headline={summary.headline}
        detail={summary.detail}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {tileSummary(i).map((t) => (
            <Tile key={t.label} {...t} />
          ))}
        </View>
      </InsightCard>

      <InsightCard
        icon="bar_chart"
        title="Weekly training volume"
        headline={volume.headline}
        detail={volume.detail}
        trailing={<Chip text={loadChip.text} color={loadChip.color} />}
      >
        <TrendBars
          bars={i.weeks.map((w) => ({
            label: w.label,
            value: w.volumeKg,
            valueLabel: compactNumber(w.volumeKg),
          }))}
          reference={i.average.volumeKg}
          referenceLabel={`Average of the 4 weeks before this one (${formatVolume(i.average.volumeKg)} kg)`}
          accessibilityLabel="Weekly volume over the last 8 weeks"
        />
      </InsightCard>

      <InsightCard
        icon="fitness_center"
        title="Strength trends"
        headline={strength.headline}
        detail={strength.detail}
      >
        {i.strength.length > 0 ? (
          <View style={{ gap: 10 }}>
            {i.strength.map((t) => (
              <StrengthRow key={t.id} trend={t} />
            ))}
          </View>
        ) : (
          <AppText variant="bodySm" color="onSurfaceVariant">
            Log a workout and your main lifts appear here with their trend.
          </AppText>
        )}
      </InsightCard>

      <InsightCard
        icon="accessibility_new"
        title="Muscle balance"
        headline={muscle.headline}
        detail={muscle.detail}
      >
        <View style={{ gap: 14 }}>
          {i.muscles.map((m, n) => (
            <MuscleRow key={m.id} muscle={m} index={n} />
          ))}
          <AppText variant="bodySm" color="onSurfaceVariant">
            The shaded part of each bar is the {SETS_TARGET[0]} to {SETS_TARGET[1]} set target.
          </AppText>
        </View>
      </InsightCard>

      <InsightCard
        icon="directions_run"
        title="Cardio and activities"
        headline={cardio.headline}
        detail={cardio.detail}
      >
        <View style={{ gap: 12 }}>
          <TrendBars
            color="secondary"
            bars={i.weeks.map((w) => ({
              label: w.label,
              value: w.distanceKm,
              valueLabel: compactNumber(w.distanceKm),
            }))}
            accessibilityLabel="Distance per week over the last 8 weeks"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat label="Total" value={`${i.cardio.totalKm} km`} />
            <Stat
              label="Longest"
              value={i.cardio.longestKm === null ? '--' : `${i.cardio.longestKm} km`}
            />
            <Stat
              label="Run pace"
              value={paceLabel(i.cardio.paceNow)}
              sub={
                paceChange === null || Math.abs(paceChange) < 3
                  ? '/km'
                  : paceChange > 0
                    ? `${Math.round(paceChange)}s faster`
                    : `${Math.round(-paceChange)}s slower`
              }
            />
          </View>
        </View>
      </InsightCard>

      <InsightCard
        icon="event_available"
        title="Consistency"
        headline={consistency.headline}
        detail={consistency.detail}
        trailing={<Chip text={`Goal ${i.consistency.targetDays}/wk`} color="primary" />}
      >
        <TrendBars
          color="tertiary"
          bars={i.consistency.perWeek.map((d, n) => ({
            label: i.weeks[n]!.label,
            value: d,
            valueLabel: String(d),
          }))}
          reference={i.consistency.targetDays}
          referenceLabel="Your weekly goal"
          accessibilityLabel="Active days per week over the last 8 weeks"
        />
      </InsightCard>
    </View>
  );
}
