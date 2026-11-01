import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import { Card } from './Card';

export type ActivityKind = 'run' | 'walk' | 'cycle' | 'cardio';

const ICONS: Record<ActivityKind, IconName> = {
  run: 'directions_run',
  walk: 'hiking',
  cycle: 'pedal_bike',
  cardio: 'favorite',
};

export interface ActivityCardProps {
  kind: ActivityKind;
  title: string;
  /** Pre-formatted, e.g. "5.2 km · 28:10". */
  summary: string;
  /** Marks sample data so it is never confused with a recorded activity. */
  isDemo?: boolean;
  onPress?: () => void;
}

export function ActivityCard({ kind, title, summary, isDemo = false, onPress }: ActivityCardProps) {
  const theme = useTheme();
  return (
    <Card
      tone="low"
      onPress={onPress}
      accessibilityLabel={`${title}, ${summary}${isDemo ? ', sample data' : ''}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.compact }}
    >
      <Icon name={ICONS[kind]} size={24} color="primary" />
      <View style={{ flex: 1 }}>
        <AppText variant="labelUi" weight="bold" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant">
          {summary}
        </AppText>
      </View>
      {isDemo ? (
        <AppText variant="labelCaps" color="onSurfaceVariant">
          SAMPLE
        </AppText>
      ) : null}
    </Card>
  );
}
