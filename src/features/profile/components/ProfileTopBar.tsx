import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

export interface ProfileTopBarProps {
  onShare: () => void;
  onEdit: () => void;
}

export function ProfileTopBar({ onShare, onEdit }: ProfileTopBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
      }}
    >
      <AppText variant="headlineLgMobile" accessibilityRole="header">
        Profile &amp; Settings
      </AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <RoundButton icon="ios_share" label="Export telemetry" onPress={onShare} />
        <RoundButton icon="tune" label="Edit profile" onPress={onEdit} />
      </View>
    </View>
  );
}
