import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { glow, useTheme } from '@/theme';

import type { GpsQuality, LatLng } from '../types/activity.types';
import { projectRoute } from '../utils/activity.logic';

const QUALITY_LABEL: Record<GpsQuality, string> = {
  high: 'GPS High',
  medium: 'GPS Medium',
  low: 'GPS Low',
  none: 'No GPS fix',
};

export interface RouteMapCardProps {
  title: string;
  route: readonly LatLng[];
  quality: GpsQuality;
  /** Text shown while there are not enough points to draw a route. */
  emptyLabel?: string;
}

/**
 * Draws the *recorded* route as a vector trace on the Stitch map-style grid.
 * There is no base map: the line comes only from real (or clearly sample) coordinates.
 */
export function RouteMapCard({
  title,
  route,
  quality,
  emptyLabel = 'Waiting for GPS signal…',
}: RouteMapCardProps) {
  const theme = useTheme();
  const [size, setSize] = useState({ width: 0, height: 224 });
  const projected = size.width > 0 ? projectRoute(route, size.width, size.height, 44) : null;

  return (
    <View
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: 224 })}
      style={{
        height: 224,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceLow,
        overflow: 'hidden',
        ...theme.shadows.md,
      }}
    >
      {size.width > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
              <Path
                d="M 28 0 L 0 0 0 28"
                fill="none"
                stroke={theme.colors.surfaceHighest}
                strokeWidth={0.75}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" opacity={0.35} />
          {projected ? (
            <>
              <Path
                d={projected.path}
                stroke={theme.colors.primary}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Circle
                cx={projected.start.x}
                cy={projected.start.y}
                r={4.5}
                fill={theme.colors.background}
                stroke={theme.colors.primary}
                strokeWidth={2.5}
              />
              <Circle
                cx={projected.end.x}
                cy={projected.end.y}
                r={6}
                fill={theme.colors.background}
                stroke={theme.colors.primary}
                strokeWidth={3}
              />
            </>
          ) : null}
        </Svg>
      ) : null}
      {!projected ? (
        <View
          style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText variant="bodySm" color="onSurfaceVariant">
            {emptyLabel}
          </AppText>
        </View>
      ) : null}
      <View
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: theme.radius.pill,
          backgroundColor: 'rgba(30, 32, 34, 0.9)',
        }}
      >
        <View
          style={[
            { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
            glow(theme.colors.primary, 0.9, 6),
          ]}
        />
        <AppText variant="labelCaps" uppercase style={{ letterSpacing: 0.9 }}>
          {title}
        </AppText>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: theme.radius.sm,
          backgroundColor: 'rgba(30, 32, 34, 0.9)',
        }}
      >
        <Icon name="satellite_alt" size={14} color="primary" />
        <AppText variant="labelCaps" color="onSurfaceVariant" weight="medium">
          {QUALITY_LABEL[quality]}
        </AppText>
      </View>
    </View>
  );
}
