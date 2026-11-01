import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme, type ColorToken } from '@/theme';

import type { ChipTone, ContextChip } from '../types/coach.types';

const TONE_COLOR: Record<ChipTone, ColorToken> = {
  lime: 'primary',
  cyan: 'secondary',
  violet: 'tertiary',
  neutral: 'onSurfaceVariant',
};

export function ContextChips({ chips }: { chips: readonly ContextChip[] }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 2, gap: 8 }}
    >
      {chips.map((chip) => {
        const color = TONE_COLOR[chip.tone];
        const emphasised = chip.id === 'recovery';
        return (
          <View
            key={chip.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Icon name={chip.icon} size={15} color={color} />
            <AppText
              variant="labelCaps"
              color={emphasised ? 'primary' : 'onSurface'}
              weight="semibold"
            >
              {chip.label}
            </AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}
