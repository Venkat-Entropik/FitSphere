import { useRef, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
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
  return (
    <Pressable
      onPress={() => ref.current?.focus()}
      style={{
        flex: 1,
        gap: 4,
        padding: 12,
        borderRadius: theme.radius.md,
        backgroundColor: highlighted ? theme.colors.surfaceHigh : theme.colors.surfaceLow,
        borderWidth: error ? 1 : 0,
        borderColor: theme.colors.error,
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
          keyboardType="decimal-pad"
          accessibilityLabel={label}
          selectTextOnFocus
          selectionColor={theme.colors.primary}
          style={[
            VALUE_STYLE,
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
  idLabel: string;
  sex: Sex;
  onToggleSex: () => void;
  height: { value: string; onChange: (v: string) => void; error?: string };
  weight: { value: string; onChange: (v: string) => void; error?: string };
  target: { value: string; onChange: (v: string) => void; error?: string; badge: string };
}

export function BiometricMatrix({
  idLabel,
  sex,
  onToggleSex,
  height,
  weight,
  target,
}: BiometricMatrixProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText
          variant="labelCaps"
          color="onSurfaceVariant"
          uppercase
          style={{ letterSpacing: 0.9 }}
        >
          Biometric Matrix
        </AppText>
        <AppText variant="labelCaps" color="onSurfaceVariant">
          {idLabel}
        </AppText>
      </View>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Biological sex: ${sex}. Tap to change`}
            onPress={onToggleSex}
            style={{
              flex: 1,
              gap: 4,
              padding: 12,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceLow,
            }}
          >
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Biological Sex
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText variant="metricLg" color="onSurface" style={{ textTransform: 'capitalize' }}>
                {sex}
              </AppText>
              <Icon name={sex === 'male' ? 'male' : 'female'} size={18} color="onSurfaceVariant" />
            </View>
          </Pressable>
          <NumberField
            label="Height"
            unit="cm"
            value={height.value}
            onChangeText={height.onChange}
            error={height.error}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <NumberField
            label="Current Mass"
            unit="kg"
            value={weight.value}
            onChangeText={weight.onChange}
            error={weight.error}
          />
          <NumberField
            label="Target Mass"
            unit="kg lean"
            value={target.value}
            onChangeText={target.onChange}
            error={target.error}
            accent
            highlighted
            badge={target.badge}
          />
        </View>
      </View>
    </View>
  );
}
