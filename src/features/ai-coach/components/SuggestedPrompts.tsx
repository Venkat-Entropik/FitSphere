import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { ChipTone, SuggestedPrompt } from '../types/coach.types';

const TONE_COLOR: Record<ChipTone, ColorToken> = {
  lime: 'primary',
  cyan: 'secondary',
  violet: 'tertiary',
  neutral: 'onSurfaceVariant',
};

export interface SuggestedPromptsProps {
  prompts: readonly SuggestedPrompt[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function SuggestedPrompts({ prompts, onSelect, disabled = false }: SuggestedPromptsProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 2,
        }}
      >
        <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
          Suggested Inquiries
        </AppText>
        <Icon name="bolt" size={16} color="onSurfaceVariant" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4, gap: 8 }}
      >
        {prompts.map((prompt) => (
          <Pressable
            key={prompt.id}
            accessibilityRole="button"
            accessibilityLabel={prompt.text}
            disabled={disabled}
            onPress={() => onSelect(prompt.text)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: theme.radius.pill,
              backgroundColor: pressed ? theme.colors.surfaceHigh : theme.colors.surface,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Icon name={prompt.icon} size={16} color={TONE_COLOR[prompt.tone]} />
            <AppText variant="labelUi">{prompt.text}</AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
