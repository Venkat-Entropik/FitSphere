import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

export type ChipTone = 'neutral' | 'lime' | 'cyan' | 'violet';

const TONES: Record<ChipTone, { text: ColorToken; bg: string }> = {
  neutral: { text: 'onSurfaceVariant', bg: '#282a2c' },
  lime: { text: 'primary', bg: 'rgba(197, 242, 106, 0.2)' },
  cyan: { text: 'secondary', bg: 'rgba(0, 166, 224, 0.2)' },
  violet: { text: 'tertiary', bg: '#282a2c' },
};

export interface ChipProps {
  label: string;
  icon?: IconName;
  tone?: ChipTone;
  /** Selected chips use the lime filled style from the workout/activity selectors. */
  selected?: boolean;
  uppercase?: boolean;
  /** lg = the larger filter pill used by category selectors. */
  size?: 'md' | 'lg';
  trailingDot?: boolean;
  onPress?: () => void;
}

export function Chip({
  label,
  icon,
  tone = 'neutral',
  selected = false,
  uppercase = false,
  size = 'md',
  trailingDot = false,
  onPress,
}: ChipProps) {
  const theme = useTheme();
  const palette = TONES[tone];
  const textColor: ColorToken = selected ? 'onPrimary' : palette.text;
  const body = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: size === 'lg' ? 16 : 10,
          paddingVertical: size === 'lg' ? 8 : 4,
          borderRadius: theme.radius.pill,
          backgroundColor: selected ? theme.colors.primary : palette.bg,
          alignSelf: 'flex-start',
        },
        selected && theme.shadows.softPrimaryGlow,
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'lg' ? 16 : 14} color={textColor} /> : null}
      <AppText
        variant="labelCaps"
        color={textColor}
        uppercase={uppercase}
        weight={selected ? 'semibold' : 'semibold'}
      >
        {label}
      </AppText>
      {trailingDot ? (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.colors[textColor],
          }}
        />
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
    >
      {body}
    </Pressable>
  );
}
