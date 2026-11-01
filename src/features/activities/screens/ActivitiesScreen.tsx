import { useState } from 'react';
import { View } from 'react-native';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { MetricCard } from '@/components/cards/MetricCard';
import { Screen } from '@/components/common/Screen';
import { SectionHeader } from '@/components/common/SectionHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useHydrated } from '@/hooks/useHydrated';
import { toApiError } from '@/services/api/api-error';
import { useActivityRecordingStore } from '@/store/activity-recording.store';

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

export function ActivitiesScreen() {
  const hydrated = useHydrated(useActivityRecordingStore);
  const recorder = useActivityRecorder();
  const stats = useActivityStats();
  const [showSample, setShowSample] = useState(false);
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

  const label = KIND_OPTIONS.find((o) => o.kind === recorder.kind)?.label ?? 'Activity';
  const blocked =
    recorder.usesGps && recorder.availability !== 'ready' && recorder.availability !== 'checking';
  const recent = (stats.data ?? []).slice(0, RECENT_COUNT);

  return (
    <Screen scroll>
      <KindChips selected={recorder.kind} onSelect={recorder.setKind} />
      {recorder.availability !== 'not-needed' ? (
        <GpsStatusCard
          availability={recorder.availability}
          onRequestPermission={() => void recorder.requestPermission()}
        />
      ) : null}
      <View style={{ gap: 8 }}>
        <Button
          size="lg"
          label={`Start ${label}`}
          onPress={recorder.begin}
          disabled={blocked}
          leftIcon={<Icon name="play_arrow" size={26} color="onPrimary" />}
        />
        <SecondaryButton label="Preview with sample data" onPress={() => setShowSample(true)} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <MetricCard
            label="This week"
            icon="route"
            accent="primary"
            value={stats.week.distanceKm.toFixed(1)}
            unit="km"
            caption={`${stats.week.count} ${stats.week.count === 1 ? 'activity' : 'activities'}`}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            label="Best pace"
            icon="speed"
            accent="secondary"
            value={formatPace(stats.bests.fastestAvgPace)}
            unit="/km"
            caption={
              stats.bests.longestKm !== null
                ? `Longest ${stats.bests.longestKm.toFixed(1)} km`
                : undefined
            }
          />
        </View>
      </View>
      {recent.length > 0 ? (
        <View style={{ gap: 8 }}>
          <SectionHeader title="Recent activity" />
          {recent.map((record) => (
            <ActivityCard
              key={record.id}
              kind={record.kind === 'hiit' ? 'cardio' : record.kind}
              title={record.title}
              summary={`${record.distanceKm.toFixed(2)} km · ${formatDuration(record.durationSec)}`}
              isDemo={record.source === 'sample'}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
