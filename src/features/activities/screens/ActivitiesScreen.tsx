import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { Card } from '@/components/cards/Card';
import { env } from '@/config/env';
import { Screen } from '@/components/common/Screen';
import { Reveal } from '@/components/motion/Reveal';
import { SectionHeader } from '@/components/common/SectionHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useHydrated } from '@/hooks/useHydrated';
import { toApiError } from '@/services/api/api-error';
import { useActivityRecordingStore } from '@/store/activity-recording.store';
import { useTheme, type ColorToken } from '@/theme';

import { ActivityDashboard } from '../components/ActivityDashboard';
import { GpsStatusCard } from '../components/GpsStatusCard';
import { KindChips } from '../components/KindChips';
import { RecordingControls } from '../components/RecordingControls';
import { SampleBanner } from '../components/SampleBanner';
import { useActivityStats } from '../hooks/useActivityHistory';
import { useActivityRecorder } from '../hooks/useActivityRecorder';
import { sampleActivity } from '../services/activity.mock';
import { formatDuration, formatPace, KIND_OPTIONS } from '../utils/activity.logic';

const RECENT_COUNT = 4;
const ALL_COUNT = 50;

function StatTile({
  icon,
  accent,
  label,
  value,
  unit,
  caption,
}: {
  icon: IconName;
  accent: ColorToken;
  label: string;
  value: string;
  unit: string;
  caption: string;
}) {
  const theme = useTheme();
  return (
    <Card
      accessibilityLabel={`${label}: ${value} ${unit}. ${caption}`}
      style={{ flex: 1, gap: 6, ...theme.shadows.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={16} color={accent} />
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <AppText variant="headlineLgMobile" tabular numberOfLines={1}>
          {value}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {unit}
        </AppText>
      </View>
      <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
        {caption}
      </AppText>
    </Card>
  );
}

export function ActivitiesScreen() {
  const hydrated = useHydrated(useActivityRecordingStore);
  const recorder = useActivityRecorder();
  const stats = useActivityStats();
  const router = useRouter();
  const [showSample, setShowSample] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const recording = recorder.status !== 'idle';

  if (!hydrated) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading activity" />
      </Screen>
    );
  }

  if (showSample) {
    return (
      <Screen scroll>
        <SampleBanner onExit={() => setShowSample(false)} />
        <ActivityDashboard snapshot={sampleActivity} />
      </Screen>
    );
  }

  if (recording && recorder.snapshot) {
    return (
      <Screen scroll>
        <KindChips selected={recorder.kind} onSelect={recorder.setKind} disabled />
        <ActivityDashboard snapshot={recorder.snapshot} />
        {recorder.saveError ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert">
            Couldn&apos;t save this activity: {toApiError(recorder.saveError).message} It&apos;s
            still recording — slide to finish again.
          </AppText>
        ) : null}
        <RecordingControls
          paused={recorder.status === 'paused'}
          onMarkLap={recorder.markLap}
          onPause={recorder.pause}
          onResume={recorder.resume}
          onFinish={recorder.finish}
        />
      </Screen>
    );
  }

  const chosen = KIND_OPTIONS.find((o) => o.kind === recorder.kind);
  const label = chosen?.label ?? 'Activity';
  const shortLabel = chosen?.short ?? 'Activity';
  const blocked =
    recorder.usesGps && recorder.availability !== 'ready' && recorder.availability !== 'checking';
  const all = stats.data ?? [];
  const recent = all.slice(0, showAll ? ALL_COUNT : RECENT_COUNT);

  return (
    <Screen scroll>
      <Reveal index={0}>
        <View style={{ gap: 4 }}>
          <AppText variant="headlineLgMobile" accessibilityRole="header">
            Ready to move?
          </AppText>
          <AppText variant="bodyMd" color="onSurfaceVariant">
            Pick an activity and start recording.
          </AppText>
        </View>
      </Reveal>
      <Reveal index={1}>
        <KindChips selected={recorder.kind} onSelect={recorder.setKind} />
      </Reveal>
      {recorder.availability !== 'not-needed' ? (
        <Reveal index={2}>
          <GpsStatusCard
            availability={recorder.availability}
            onRequestPermission={() => void recorder.requestPermission()}
          />
        </Reveal>
      ) : null}
      <Reveal index={3}>
        <View style={{ gap: 8 }}>
          <Button
            size="lg"
            label={`Start ${shortLabel}`}
            accessibilityLabel={`Start ${label}`}
            onPress={recorder.begin}
            disabled={blocked}
            leftIcon={<Icon name="play_arrow" size={26} color="onPrimary" />}
          />
          {/* Only in the offline demo: real accounts never see a sample activity. */}
          {env.useMocks ? (
            <SecondaryButton label="Preview with sample data" onPress={() => setShowSample(true)} />
          ) : null}
        </View>
      </Reveal>
      <Reveal index={4}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile
            icon="route"
            accent="primary"
            label="This week"
            value={stats.week.distanceKm.toFixed(1)}
            unit="km"
            caption={`${stats.week.count} ${stats.week.count === 1 ? 'activity' : 'activities'}`}
          />
          <StatTile
            icon="speed"
            accent="secondary"
            label="Best pace"
            value={formatPace(stats.bests.fastestAvgPace)}
            unit="/km"
            caption={
              stats.bests.longestKm !== null
                ? `Longest ${stats.bests.longestKm.toFixed(1)} km`
                : 'No runs yet'
            }
          />
        </View>
      </Reveal>
      <Reveal index={5}>
        <View style={{ gap: 8 }}>
          <SectionHeader
            title={showAll ? 'All activities' : 'Recent activity'}
            actionLabel={
              all.length > RECENT_COUNT
                ? showAll
                  ? 'Show less'
                  : `See all (${all.length})`
                : undefined
            }
            onActionPress={() => setShowAll((v) => !v)}
          />
          {recent.length > 0 ? (
            recent.map((record) => (
              <ActivityCard
                key={record.id}
                kind={record.kind === 'hiit' ? 'cardio' : record.kind}
                title={record.title}
                summary={`${record.distanceKm.toFixed(2)} km · ${formatDuration(record.durationSec)}`}
                isDemo={record.source === 'sample'}
                onPress={() =>
                  router.push({ pathname: '/activity-detail', params: { id: record.id } })
                }
              />
            ))
          ) : (
            <Card tone="low" style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
              <Icon name="directions_run" size={28} color="outline" />
              <AppText variant="labelUi" weight="semibold">
                No activities yet
              </AppText>
              <AppText variant="bodySm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
                Your runs, rides and walks will show up here.
              </AppText>
            </Card>
          )}
        </View>
      </Reveal>
    </Screen>
  );
}
