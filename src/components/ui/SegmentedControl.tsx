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
}

/** Pill segmented control (Stitch time-range selector). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  trackColor = 'surfaceLow',
  glowing = false,
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
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option}
            onPress={() => onChange(option)}
            style={{
              flex: 1,
              paddingVertical: 6,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.radius.pill,
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
