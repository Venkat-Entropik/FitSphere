import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'plain' | 'filled';
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'plain',
  size = 24,
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: theme.minTouchTarget,
          height: theme.minTouchTarget,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'filled' ? theme.colors.surfaceHigh : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size} />
    </Pressable>
  );
}
