import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { fontFor, glow, useTheme } from '@/theme';

export interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending: boolean;
}

export function ChatComposer({ value, onChangeText, onSend, sending }: ChatComposerProps) {
  const theme = useTheme();
  const canSend = value.trim().length > 0 && !sending;
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 8,
          borderRadius: 16,
          backgroundColor: 'rgba(30, 32, 34, 0.95)',
          ...theme.shadows.md,
        }}
      >
        {/* Attachments and voice input need native pickers/recording; shown as in the design but inactive. */}
        <View
          accessibilityRole="button"
          accessibilityLabel="Attach biometric or workout log (coming soon)"
          accessibilityState={{ disabled: true }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceHigh,
            opacity: 0.6,
          }}
        >
          <Icon name="post_add" size={20} color="onSurfaceVariant" />
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSend}
            returnKeyType="send"
            blurOnSubmit={false}
            placeholder="Ask FitSphere AI coach..."
            placeholderTextColor={theme.colors.outline}
            selectionColor={theme.colors.primary}
            accessibilityLabel="Message the coach"
            maxLength={1000}
            style={{
              height: 44,
              paddingHorizontal: 14,
              paddingRight: 40,
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceLowest,
              color: theme.colors.onSurface,
              fontFamily: fontFor('inter', 'regular'),
              fontSize: 14,
            }}
          />
          <View
            style={{ position: 'absolute', right: 10, opacity: 0.6 }}
            accessibilityElementsHidden
          >
            <Icon name="mic" size={19} color="onSurfaceVariant" />
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send query"
          accessibilityState={{ disabled: !canSend, busy: sending }}
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [
            {
              width: 40,
              height: 40,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
              opacity: canSend ? 1 : 0.5,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
            canSend && glow(theme.colors.primary, 0.35, 18),
          ]}
        >
          <Icon name="send" size={20} color="onPrimary" />
        </Pressable>
      </View>
    </View>
  );
}
