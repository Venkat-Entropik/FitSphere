import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

export interface CoachStatusCardProps {
  statusLabel: string;
  syncLabel: string;
}

export function CoachStatusCard({ statusLabel, syncLabel }: CoachStatusCardProps) {
  const theme = useTheme();
  return (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        ...theme.shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.surfaceHigh,
          }}
        >
          <Icon name="auto_awesome" size={18} color="primary" />
          <View
            style={[
              {
                position: 'absolute',
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.colors.primary,
              },
              glow(theme.colors.primary, 0.9, 5),
            ]}
          />
        </View>
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="bodyMd" weight="bold" style={{ fontFamily: undefined }}>
              FitSphere AI Coach
            </AppText>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: theme.radius.pill,
                backgroundColor: 'rgba(197, 242, 106, 0.2)',
              }}
            >
              <AppText
                variant="labelCaps"
                color="primary"
                uppercase
                style={{ fontSize: 9, lineHeight: 12 }}
              >
                {statusLabel}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySm" color="onSurfaceVariant" numberOfLines={1}>
            Synced with biometric &amp; workout history
          </AppText>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surfaceHigh,
        }}
      >
        <Icon name="sync" size={14} color="secondary" />
        <AppText variant="labelCaps" color="secondary">
          {syncLabel}
        </AppText>
      </View>
    </Card>
  );
}
