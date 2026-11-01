import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** md = 48px (default), lg = 56px (hero CTA). */
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  /** Rendered at the far end; switches the layout to space-between. */
  rightContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightContent,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const isPrimary = variant === 'primary';
  const foreground = isPrimary ? theme.colors.onPrimary : theme.colors.onSurface;
  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'secondary'
        ? theme.colors.surfaceHigh
        : 'transparent';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderRadius: theme.radius.pill,
          minHeight: size === 'lg' ? 56 : 48,
          paddingVertical: 4,
          paddingHorizontal: size === 'lg' ? theme.spacing.lg : theme.spacing.md,
          justifyContent: rightContent ? 'space-between' : 'center',
          opacity: inactive ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        isPrimary && theme.shadows.primaryGlow,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          <View style={[styles.content, rightContent ? styles.contentGrow : null]}>
            {leftIcon}
            <AppText
              variant={size === 'lg' ? 'headlineMd' : 'bodyLg'}
              weight={size === 'lg' ? 'bold' : 'semibold'}
              style={{
                color: foreground,
                flexShrink: 1,
                textAlign: rightContent ? 'left' : 'center',
              }}
            >
              {label}
            </AppText>
          </View>
          {rightContent}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  contentGrow: { flex: 1, paddingRight: 8 },
});
