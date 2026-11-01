import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { buildSparkline } from '@/features/analytics/utils/analytics.logic';
import { useTheme, type ColorToken } from '@/theme';

export interface SparklineProps {
  values: readonly number[];
  height?: number;
  color?: ColorToken;
  accessibilityLabel?: string;
}

/** Filled trend line that stretches to its container's width. */
export function Sparkline({
  values,
  height = 40,
  color = 'primary',
  accessibilityLabel,
}: SparklineProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const path = width > 0 ? buildSparkline(values, width, height) : null;
  const tint = theme.colors[color];
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height, alignSelf: 'stretch' }}
    >
      {path ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={tint} stopOpacity={0.3} />
              <Stop offset="1" stopColor={tint} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={path.area} fill="url(#sparkFill)" />
          <Path
            d={path.line}
            stroke={tint}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}
