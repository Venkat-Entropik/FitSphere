import { forwardRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { fontFor, useTheme } from '@/theme';

import { AppText } from './AppText';

export interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  rightAdornment?: React.ReactNode;
}

export const CustomInput = forwardRef<ComponentRef<typeof TextInput>, CustomInputProps>(
  function CustomInput(
    { label, error, helperText, rightAdornment, onFocus, onBlur, style, ...rest },
    ref,
  ) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    const borderColor = error
      ? theme.colors.error
      : focused
        ? theme.colors.primary
        : theme.colors.outlineVariant;

    return (
      <View style={styles.container}>
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase style={styles.label}>
          {label}
        </AppText>
        <View
          style={[
            styles.field,
            {
              borderColor,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceLow,
              minHeight: theme.minTouchTarget,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
        >
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            placeholderTextColor={theme.colors.outline}
            selectionColor={theme.colors.primary}
            {...rest}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              { color: theme.colors.onSurface, fontFamily: fontFor('inter', 'regular') },
              style,
            ]}
          />
          {rightAdornment}
        </View>
        {error ? (
          <AppText variant="bodySm" color="error" accessibilityRole="alert" style={styles.message}>
            {error}
          </AppText>
        ) : helperText ? (
          <AppText variant="bodySm" color="onSurfaceVariant" style={styles.message}>
            {helperText}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch' },
  label: { marginBottom: 4 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, paddingVertical: 10, fontSize: 16 },
  message: { marginTop: 4 },
});
