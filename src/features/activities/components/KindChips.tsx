import { Pressable, View } from 'react-native';

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

/** All five activity types in one row of equal tiles, so none is hidden off-screen. */
export function KindChips({ selected, onSelect, disabled = false }: KindChipsProps) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 8 }}>
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
            style={({ pressed }) => [
              {
                flex: 1,
                alignItems: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: theme.radius.md,
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                opacity: disabled && !active ? 0.5 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
              active && theme.shadows.softPrimaryGlow,
            ]}
          >
            <Icon name={option.icon} size={22} color={active ? 'onPrimary' : 'onSurfaceVariant'} />
            <AppText
              variant="labelUi"
              numberOfLines={1}
              weight={active ? 'bold' : 'medium'}
              color={active ? 'onPrimary' : 'onSurfaceVariant'}
            >
              {option.short}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
