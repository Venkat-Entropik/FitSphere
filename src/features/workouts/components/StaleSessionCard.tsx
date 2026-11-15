import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

export interface StaleSessionCardProps {
  title: string;
  startedLabel: string;
  setsDone: number;
  onResume: () => void;
  onDiscard: () => void;
}

/** A workout left open for hours. Asking beats showing a clock that has been running for days. */
export function StaleSessionCard({
  title,
  startedLabel,
  setsDone,
  onResume,
  onDiscard,
}: StaleSessionCardProps) {
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="history" size={20} color="warning" />
        <AppText variant="labelUi" weight="semibold" accessibilityRole="header">
          Unfinished workout
        </AppText>
      </View>
      <View style={{ gap: 4 }}>
        <AppText variant="headlineMd">{title}</AppText>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          Started {startedLabel}. {setsDone} {setsDone === 1 ? 'set' : 'sets'} logged.
        </AppText>
      </View>
      <View style={{ gap: 8 }}>
        <Button label="Resume workout" onPress={onResume} />
        <SecondaryButton label="Discard it" onPress={onDiscard} />
      </View>
    </Card>
  );
}
