import { useState } from 'react';
import { View } from 'react-native';

import { ActivityCard } from '@/components/cards/ActivityCard';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { ActivityDashboard } from '../components/ActivityDashboard';
import { GpsStatusCard } from '../components/GpsStatusCard';
import { KindChips } from '../components/KindChips';
import { RecordingControls } from '../components/RecordingControls';
import { SampleBanner } from '../components/SampleBanner';
import { useActivityRecorder } from '../hooks/useActivityRecorder';
import { sampleActivity } from '../services/activity.mock';
import { formatDuration, KIND_OPTIONS } from '../utils/activity.logic';

export function ActivitiesScreen() {
  const recorder = useActivityRecorder();
  const [showSample, setShowSample] = useState(false);
  const recording = recorder.status !== 'idle';

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
  const last = recorder.lastSummary;

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
      {last ? (
        <ActivityCard
          kind={last.kind === 'hiit' ? 'cardio' : last.kind}
          title={`Last activity · ${last.title}`}
          summary={`${last.distanceKm.toFixed(2)} km · ${formatDuration(last.durationSec)}`}
        />
      ) : null}
    </Screen>
  );
}
