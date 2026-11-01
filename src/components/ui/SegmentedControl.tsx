import { Pressable, View } from 'react-native';

import { useTheme, type ColorToken } from '@/theme';

import { AppText } from './AppText';

export interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** Track background; defaults to surface-container-low. */
  trackColor?: ColorToken;
  /** Glow behind the selected segment (onboarding style). */
  glowing?: boolean;
  /** Options that are shown but can't be chosen (e.g. not available yet). */
  disabledOptions?: readonly T[];
}

/** Pill segmented control (Stitch time-range selector). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  trackColor = 'surfaceLow',
  glowing = false,
  disabledOptions = [],
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors[trackColor],
      }}
    >
      {options.map((option) => {
        const selected = option === value;
        const disabled = disabledOptions.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            accessibilityLabel={option}
            onPress={() => onChange(option)}
            style={{
              flex: 1,
              paddingVertical: 6,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
              opacity: disabled ? 0.4 : 1,
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              ...(selected && glowing ? theme.shadows.softPrimaryGlow : {}),
            }}
          >
            <AppText
              variant="labelUi"
              color={selected ? 'onPrimary' : 'onSurfaceVariant'}
              weight={selected ? 'semibold' : 'medium'}
            >
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
