import { Linking, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import type { Exercise } from '../types/workout-record.types';
import { isYouTubeId, youtubeSearchUrl, youtubeWatchUrl } from '../utils/youtube';
import { YouTubePlayer } from './YouTubePlayer';

export interface ExerciseVideoSheetProps {
  /** The exercise to demonstrate; null keeps the sheet closed. */
  exercise: Exercise | null;
  onClose: () => void;
}

/** "How to do it": the demo video, form cues and a way out to YouTube. */
export function ExerciseVideoSheet({ exercise, onClose }: ExerciseVideoSheetProps) {
  const video = exercise?.video && isYouTubeId(exercise.video.youtubeId) ? exercise.video : null;
  return (
    <BottomSheet visible={exercise !== null} onClose={onClose} title={exercise?.name}>
      {exercise ? (
        <View style={{ gap: 14 }}>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {exercise.muscles}
          </AppText>
          {video ? (
            <YouTubePlayer videoId={video.youtubeId} title={video.title} />
          ) : (
            <AppText variant="bodyMd" color="onSurfaceVariant">
              There is no curated video for this exercise yet.
            </AppText>
          )}
          {exercise.cues?.length ? (
            <View style={{ gap: 8 }} accessibilityLabel="Form cues">
              {exercise.cues.map((cue) => (
                <View key={cue} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="check_circle" size={16} color="primary" />
                  <AppText variant="bodySm" style={{ flex: 1 }}>
                    {cue}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
          <SecondaryButton
            label={video ? 'Watch on YouTube' : 'Search YouTube'}
            leftIcon={<Icon name="open_in_new" size={18} color="primary" />}
            onPress={() =>
              void Linking.openURL(
                video ? youtubeWatchUrl(video.youtubeId) : youtubeSearchUrl(exercise.name),
              )
            }
            size="md"
          />
          <AppText variant="bodySm" color="onSurfaceVariant">
            Videos play from YouTube and belong to their creators. Cues are general guidance, not
            medical advice; stop if something hurts.
          </AppText>
        </View>
      ) : null}
    </BottomSheet>
  );
}
