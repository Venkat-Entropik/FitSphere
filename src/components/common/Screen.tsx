import type { ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a keyboard-aware ScrollView. */
  scroll?: boolean;
  /** Extra bottom padding so content clears the tab bar. */
  tabBarClearance?: boolean;
  /** Draw gutters (20px) and the 16px vertical rhythm used across Stitch screens. */
  padded?: boolean;
  /** Fixed element below the scroll area (e.g. a chat composer). */
  footer?: React.ReactNode;
  /** Ref for programmatic scrolling (e.g. chat auto-scroll). */
  scrollRef?: React.Ref<ComponentRef<typeof ScrollView>>;
  onContentSizeChange?: () => void;
}

/** Standard screen container: themed background, keyboard handling, gutters. */
export function Screen({
  children,
  scroll = false,
  tabBarClearance = false,
  padded = true,
  footer,
  scrollRef,
  onContentSizeChange,
}: ScreenProps) {
  const theme = useTheme();
  const content = {
    paddingHorizontal: padded ? theme.spacing.gutterX : 0,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg + (tabBarClearance ? 16 : 0),
    gap: theme.spacing.md,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={content}
          onContentSizeChange={onContentSizeChange}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}
      {footer}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
