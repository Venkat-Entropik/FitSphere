import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import { Card } from './Card';

export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  /** Secondary line under the value, e.g. `Target 5'00"`. */
  caption?: string;
  captionColor?: ColorToken;
  captionIcon?: IconName;
  icon?: IconName;
  /** Tint of the label icon. */
  accent?: ColorToken;
  valueColor?: ColorToken;
  /** Small element at the label row's far end (zone chip, live dot). */
  badge?: React.ReactNode;
  onPress?: () => void;
}

/** Stat tile: label row with icon, large tabular value + unit, caption (Stitch `rounded-xl p-space-md`). */
export function MetricCard({
  label,
  value,
  unit,
  caption,
  captionColor = 'onSurfaceVariant',
  captionIcon,
  icon,
  accent = 'onSurfaceVariant',
  valueColor = 'onSurface',
  badge,
  onPress,
}: MetricCardProps) {
  const theme = useTheme();
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      style={{ gap: theme.spacing.xs, ...theme.shadows.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
          {icon ? <Icon name={icon} size={15} color={accent} /> : null}
          <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
            {label}
          </AppText>
        </View>
        {badge}
      </View>
      <AppText variant="headlineLgMobile" color={valueColor} tabular>
        {value}
        {unit ? (
          <AppText variant="bodySm" color="onSurfaceVariant" weight="regular">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      {caption ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {captionIcon ? <Icon name={captionIcon} size={13} color={captionColor} /> : null}
          <AppText variant={captionIcon ? 'labelCaps' : 'bodySm'} color={captionColor}>
            {caption}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
