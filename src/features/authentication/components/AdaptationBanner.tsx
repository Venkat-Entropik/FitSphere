import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/theme';

export function AdaptationBanner() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        minHeight: 128,
        paddingHorizontal: 16,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLowest,
      }}
    >
      <View style={{ flex: 1, maxWidth: '65%' }}>
        <AppText variant="labelCaps" color="primary" uppercase style={{ letterSpacing: 0.9 }}>
          Dynamic Adaptation
        </AppText>
        <AppText variant="headlineMd" color="onSurface" style={{ marginTop: 2 }}>
          Real-time load recalculation
        </AppText>
        <AppText variant="bodySm" color="onSurfaceVariant" style={{ marginTop: 4 }}>
          Adapts automatically if sleep score drops below 65%.
        </AppText>
      </View>
      {/* The reference artwork is a remote asset that isn't in the export. */}
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surface,
        }}
      >
        <Icon name="monitoring" size={36} color="outline" />
      </View>
    </View>
  );
}
