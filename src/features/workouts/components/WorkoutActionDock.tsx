import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface WorkoutActionDockProps {
  logLabel: string;
  canLog: boolean;
  onLog: () => void;
  onFinish: () => void;
}

export function WorkoutActionDock({ logLabel, canLog, onLog, onFinish }: WorkoutActionDockProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10, paddingTop: 8, paddingBottom: 16 }}>
      <Button
        label={logLabel}
        onPress={onLog}
        disabled={!canLog}
        leftIcon={<Icon name="check_circle" size={22} color="onPrimary" />}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Finish Workout Session"
        onPress={onFinish}
        style={({ pressed }) => ({
          height: 44,
          borderRadius: theme.radius.pill,
          backgroundColor: pressed ? theme.colors.surfaceBright : theme.colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        })}
      >
        <Icon name="stop_circle" size={18} color="error" />
        <AppText variant="labelUi" color="onSurfaceVariant" weight="semibold">
          Finish Workout Session
        </AppText>
      </Pressable>
    </View>
  );
}
