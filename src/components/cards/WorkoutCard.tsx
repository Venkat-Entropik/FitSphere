import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import { Card } from './Card';

export interface WorkoutCardProps {
  title: string;
  subtitle: string;
  /** Right-aligned value, e.g. "412 kcal". */
  trailingValue?: string;
  /** Lime caption under the trailing value, e.g. "100% Vol". */
  trailingCaption?: string;
  icon?: IconName;
  onPress?: () => void;
}

/** Workout list row (the "Recent Logs" item). */
export function WorkoutCard({
  title,
  subtitle,
  trailingValue,
  trailingCaption,
  icon = 'exercise',
  onPress,
}: WorkoutCardProps) {
  const theme = useTheme();
  return (
    <Card
      tone="low"
      onPress={onPress}
      accessibilityLabel={`${title}, ${subtitle}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.compact,
        borderRadius: theme.radius.sm,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.compact, flex: 1 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color="primary" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="labelUi" weight="bold" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
            {subtitle}
          </AppText>
        </View>
      </View>
      {trailingValue ? (
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="labelUi" weight="semibold" tabular>
            {trailingValue}
          </AppText>
          {trailingCaption ? (
            <AppText variant="labelCaps" color="primary">
              {trailingCaption}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
