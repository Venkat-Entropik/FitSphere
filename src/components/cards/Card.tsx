import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export type CardTone = 'default' | 'low';

export interface CardProps {
  children: React.ReactNode;
  /** default = surface-container, low = surface-container-low (nested/secondary panels). */
  tone?: CardTone;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Shared surface for all cards: 12px radius, 16px padding (Stitch `rounded-xl p-space-md`). */
export function Card({
  children,
  tone = 'default',
  onPress,
  accessibilityLabel,
  style,
  testID,
}: CardProps) {
  const theme = useTheme();
  const base: ViewStyle = {
    backgroundColor: tone === 'low' ? theme.colors.surfaceLow : theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...(tone === 'low' ? theme.shadows.sm : theme.shadows.md),
  };

  if (!onPress) {
    return (
      <View testID={testID} style={[base, style]}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}
