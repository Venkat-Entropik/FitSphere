import { Pressable, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface SettingRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Replaces the default trailing element (chevron / switch). */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Renders a switch instead of a chevron. */
  toggle?: { value: boolean; onChange: (next: boolean) => void; disabled?: boolean };
  /** Greys the row and removes interaction (feature not available yet). */
  unavailable?: boolean;
}

export function SettingRow({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  toggle,
  unavailable = false,
}: SettingRowProps) {
  const theme = useTheme();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 48,
        opacity: unavailable ? 0.55 : 1,
      }}
    >
      {icon ? <Icon name={icon} size={20} color="onSurfaceVariant" /> : null}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMd" weight="semibold">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySm" color="onSurfaceVariant">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          accessibilityLabel={title}
          value={toggle.value}
          disabled={toggle.disabled || unavailable}
          onValueChange={toggle.onChange}
          trackColor={{ false: theme.colors.surfaceHighest, true: theme.colors.primary }}
          thumbColor={toggle.value ? theme.colors.onPrimary : theme.colors.outline}
        />
      ) : (
        (trailing ??
        (onPress ? <Icon name="chevron_right" size={20} color="onSurfaceVariant" /> : null))
      )}
    </View>
  );
  if (!onPress || toggle || unavailable) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {body}
    </Pressable>
  );
}
