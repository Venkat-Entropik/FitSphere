import { Share } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

import { BadgesSection } from '../components/BadgesSection';
import { PersonalRecordsSection } from '../components/PersonalRecordsSection';
import { ProgressHeader } from '../components/ProgressHeader';
import { StreakCard } from '../components/StreakCard';
import { SynthesisBanner } from '../components/SynthesisBanner';
import { TransformationSection } from '../components/TransformationSection';
import { useProgress } from '../hooks/useProgress';
import { useProgressPhoto } from '../hooks/useProgressPhoto';

export function ProgressScreen() {
  const { data, isPending, error, refetch } = useProgress();
  const photo = useProgressPhoto();

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
      <PersonalRecordsSection records={data.personalRecords} />
      <TransformationSection
        data={data.transformation}
        photoUri={photo.uri}
        photoStatus={photo.status}
        onLogPhoto={() => void photo.capture()}
      />
      <BadgesSection badges={data.badges} />
    </Screen>
  );
}
