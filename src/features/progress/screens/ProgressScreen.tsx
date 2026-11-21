import { useState } from 'react';
import { Share } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

import { BadgesSection } from '../components/BadgesSection';
import { InsightsSection } from '../components/InsightsSection';
import { WeightHistoryCard } from '../components/WeightHistoryCard';
import { LogWeighInSheet } from '../components/LogWeighInSheet';
import { PersonalRecordsSection } from '../components/PersonalRecordsSection';
import { ProgressHeader } from '../components/ProgressHeader';
import { StreakCard } from '../components/StreakCard';
import { SynthesisBanner } from '../components/SynthesisBanner';
import { TransformationSection } from '../components/TransformationSection';
import { useInsights } from '../hooks/useInsights';
import { useProgress } from '../hooks/useProgress';
import { useWeightEntries } from '../hooks/useWeightHistory';
import { useProgressPhotos } from '../hooks/useProgressPhoto';

export function ProgressScreen() {
  const { data, isPending, error, refetch } = useProgress();
  const insights = useInsights();
  const weights = useWeightEntries();
  const photo = useProgressPhotos();
  const [weighInOpen, setWeighInOpen] = useState(false);

  if (isPending) {
    return (
      <Screen>
        <LoadingIndicator fullScreen label="Loading your progress" />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  const share = () =>
    void Share.share({
      message: `I'm on a ${data.streak.days}-day streak on FitSphere with ${data.badges.unlocked} of ${data.badges.total} badges unlocked.`,
    }).catch(() => undefined);

  return (
    <Screen scroll>
      <ProgressHeader label={data.macrocycleLabel} onShare={share} />
      <StreakCard streak={data.streak} />
      <SynthesisBanner synthesis={data.synthesis} />
      {insights.data ? <InsightsSection insights={insights.data} /> : null}
      <PersonalRecordsSection records={data.personalRecords} />
      <TransformationSection
        data={data.transformation}
        photos={photo.photos}
        photoStatus={photo.status}
        onLogPhoto={() => void photo.capture()}
        onRemovePhoto={photo.remove}
        onLogWeighIn={() => setWeighInOpen(true)}
      />
      {weights.data ? <WeightHistoryCard weights={weights.data} /> : null}
      <LogWeighInSheet visible={weighInOpen} onClose={() => setWeighInOpen(false)} />
      <BadgesSection badges={data.badges} />
    </Screen>
  );
}
