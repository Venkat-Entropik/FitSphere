import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export interface AnalyticsHeaderProps {
  athleteLine: string;
  onExport: () => void;
}

export function AnalyticsHeader({ athleteLine, onExport }: AnalyticsHeaderProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="headlineLgMobile" weight="extrabold" accessibilityRole="header">
            Performance Bio
          </AppText>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surfaceHighest,
            }}
          >
            <AppText variant="labelCaps" color="onSurfaceVariant" uppercase>
              Telemetry
            </AppText>
          </View>
        </View>
        <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
          {athleteLine}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Export telemetry report"
        onPress={onExport}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.7 : 1,
          ...theme.shadows.md,
        })}
      >
        <Icon name="ios_share" size={20} color="onSurfaceVariant" />
      </Pressable>
    </View>
  );
}
