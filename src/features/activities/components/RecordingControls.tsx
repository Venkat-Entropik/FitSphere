import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SlideToConfirm } from '@/components/ui/SlideToConfirm';

export interface RecordingControlsProps {
  paused: boolean;
  onMarkLap: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}

export function RecordingControls({
  paused,
  onMarkLap,
  onPause,
  onResume,
  onFinish,
}: RecordingControlsProps) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button
            variant="secondary"
            label="Mark Lap"
            onPress={onMarkLap}
            disabled={paused}
            leftIcon={<Icon name="flag" size={18} />}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={paused ? 'Resume' : 'Pause'}
            onPress={paused ? onResume : onPause}
            leftIcon={<Icon name={paused ? 'play_arrow' : 'pause'} size={18} color="onPrimary" />}
          />
        </View>
      </View>
      <SlideToConfirm label="Slide to finish" onConfirm={onFinish} />
    </View>
  );
}
