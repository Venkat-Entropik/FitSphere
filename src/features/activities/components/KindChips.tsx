import { Pressable, ScrollView } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

import type { ActivityKind } from '../types/activity.types';
import { KIND_OPTIONS } from '../utils/activity.logic';

export interface KindChipsProps {
  selected: ActivityKind;
  onSelect: (kind: ActivityKind) => void;
  disabled?: boolean;
}

export function KindChips({ selected, onSelect, disabled = false }: KindChipsProps) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 4, gap: 4 }}
    >
      {KIND_OPTIONS.map((option) => {
        const active = option.kind === selected;
        return (
          <Pressable
            key={option.kind}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={option.label}
            disabled={disabled}
            onPress={() => onSelect(option.kind)}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                opacity: disabled && !active ? 0.5 : 1,
              },
              active && theme.shadows.softPrimaryGlow,
            ]}
          >
            <Icon name={option.icon} size={18} color={active ? 'onPrimary' : 'onSurfaceVariant'} />
            <AppText variant="labelUi" color={active ? 'onPrimary' : 'onSurfaceVariant'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
