import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { noFocusRing } from '@/components/ui/no-focus-ring';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { fontFor, useTheme } from '@/theme';

import type { Sex } from '../types/onboarding.types';

const VALUE_STYLE = { fontSize: 28, lineHeight: 32, padding: 0, minWidth: 60 } as const;

function NumberField({
  label,
  unit,
  value,
  onChangeText,
  error,
  accent = false,
  badge,
  highlighted = false,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  accent?: boolean;
  badge?: string;
  highlighted?: boolean;
}) {
  const theme = useTheme();
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={{
        flex: 1,
        gap: 4,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: highlighted ? theme.colors.surfaceHigh : theme.colors.surfaceLow,
        borderWidth: 1,
        borderColor: error ? theme.colors.error : focused ? theme.colors.primary : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText
          variant="labelCaps"
          color={accent ? 'primary' : 'onSurfaceVariant'}
          uppercase
          weight={accent ? 'semibold' : 'semibold'}
        >
          {label}
        </AppText>
        {badge ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceLowest,
            }}
          >
            <AppText variant="labelCaps" color="primary">
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
      >
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="decimal-pad"
          accessibilityLabel={label}
          selectTextOnFocus
          selectionColor={theme.colors.primary}
          style={[
            VALUE_STYLE,
            noFocusRing,
            {
              fontFamily: fontFor('jakarta', 'bold'),
              color: accent ? theme.colors.primary : theme.colors.onSurface,
            },
          ]}
        />
        <AppText
          variant="bodySm"
          color={accent ? 'primary' : 'onSurfaceVariant'}
          weight={accent ? 'medium' : 'regular'}
        >
          {unit}
        </AppText>
      </View>
      {error ? (
        <AppText variant="bodySm" color="error" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </Pressable>
  );
}

export interface BiometricMatrixProps {
  sex: Sex;
  onChangeSex: (sex: Sex) => void;
  height: { value: string; onChange: (v: string) => void; error?: string };
  weight: { value: string; onChange: (v: string) => void; error?: string };
  target: { value: string; onChange: (v: string) => void; error?: string; badge: string };
}

const SEX_OPTIONS: { id: Sex; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export function BiometricMatrix({
  sex,
  onChangeSex,
  height,
  weight,
  target,
}: BiometricMatrixProps) {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          Sex
        </AppText>
        <SegmentedControl
          options={SEX_OPTIONS.map((o) => o.label)}
          value={SEX_OPTIONS.find((o) => o.id === sex)!.label}
          onChange={(label) => onChangeSex(SEX_OPTIONS.find((o) => o.label === label)!.id)}
          accessibilityLabel="Sex"
          trackColor="surfaceLowest"
        />
        <AppText variant="bodySm" color="onSurfaceVariant">
          Used only to estimate your daily calories.
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <NumberField
          label="Height"
          unit="cm"
          value={height.value}
          onChangeText={height.onChange}
          error={height.error}
        />
        <NumberField
          label="Weight"
          unit="kg"
          value={weight.value}
          onChangeText={weight.onChange}
          error={weight.error}
        />
      </View>
      <NumberField
        label="Goal weight"
        unit="kg"
        value={target.value}
        onChangeText={target.onChange}
        error={target.error}
        accent
        highlighted
        badge={target.badge}
      />
    </View>
  );
}
