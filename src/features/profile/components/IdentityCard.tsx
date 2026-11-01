import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { AppText } from '@/components/ui/AppText';
import { glow, useTheme, type ColorToken } from '@/theme';

export interface IdentityCardProps {
  name: string;
  tierLabel: string;
  subtitle: string;
  massKg: number;
  heightCm: number;
  bodyFatPercent: number | null;
  streak: number;
}

function Stat({
  value,
  label,
  color = 'onSurface',
}: {
  value: string;
  label: string;
  color?: ColorToken;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        gap: 2,
        paddingVertical: 12,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceLow,
      }}
    >
      <AppText variant="headlineMd" color={color} tabular>
        {value}
      </AppText>
      <AppText variant="labelCaps" color="onSurfaceVariant" uppercase style={{ fontSize: 10 }}>
        {label}
      </AppText>
    </View>
  );
}

export function IdentityCard({
  name,
  tierLabel,
  subtitle,
  massKg,
  heightCm,
  bodyFatPercent,
  streak,
}: IdentityCardProps) {
  const theme = useTheme();
  return (
    <Card style={{ gap: 16, backgroundColor: theme.colors.surfaceHigh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View accessibilityLabel={`${name}'s avatar`}>
          <View
            style={[
              {
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceLowest,
              },
              glow(theme.colors.primary, 0.25, 16),
            ]}
          >
            <AppText variant="headlineLgMobile" color="primary">
              {name.slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          <View
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: theme.colors.primary,
              borderWidth: 2,
              borderColor: theme.colors.surfaceHigh,
            }}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <AppText variant="headlineMd" accessibilityRole="header">
              {name}
            </AppText>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: theme.radius.pill,
                backgroundColor: 'rgba(197, 242, 106, 0.2)',
              }}
            >
              <AppText variant="labelCaps" color="primary" uppercase>
                {tierLabel}
              </AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.primary,
              }}
            />
            <AppText variant="bodySm" color="onSurfaceVariant" style={{ flexShrink: 1 }}>
              {subtitle}
            </AppText>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat value={String(massKg)} label="Kg mass" />
        <Stat value={String(heightCm)} label="Cm height" />
        <Stat
          value={bodyFatPercent === null ? '--' : `${bodyFatPercent}%`}
          label="Body fat"
          color="secondary"
        />
        <Stat value={`🔥${streak}`} label="Streak" color="primary" />
      </View>
    </Card>
  );
}
