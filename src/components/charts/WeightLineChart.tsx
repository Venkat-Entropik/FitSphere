import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme';

export interface LinePoint {
  /** Position along the x axis (days); points are spaced by it, not evenly. */
  x: number;
  y: number;
}

export interface WeightLineChartProps {
  points: readonly LinePoint[];
  height?: number;
  startLabel?: string;
  endLabel?: string;
  unit?: string;
  accessibilityLabel?: string;
}

const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

/**
 * Line chart with gridlines, a dot per reading and the latest one called out. It measures its own
 * width, so it fits any screen, and the y scale hugs the data so small changes are still visible.
 */
export function WeightLineChart({
  points,
  height = 150,
  startLabel,
  endLabel,
  unit = 'kg',
  accessibilityLabel,
}: WeightLineChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const ys = points.map((p) => p.y);
  const lo = ys.length ? Math.min(...ys) : 0;
  const hi = ys.length ? Math.max(...ys) : 1;
  const pad = Math.max(0.5, (hi - lo) * 0.2);
  const yMin = lo - pad;
  const yMax = hi + pad;
  const xMax = Math.max(1, ...points.map((p) => p.x));
  const innerW = Math.max(1, width - PAD_X * 2);
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  const sx = (x: number) => PAD_X + (points.length === 1 ? innerW / 2 : (x / xMax) * innerW);
  const sy = (y: number) => PAD_TOP + (1 - (y - yMin) / (yMax - yMin)) * innerH;

  const coords = points.map((p) => ({ x: sx(p.x), y: sy(p.y) }));
  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const area = coords.length
    ? `${line} L${coords.at(-1)!.x.toFixed(1)} ${height} L${coords[0]!.x.toFixed(1)} ${height} Z`
    : '';
  const last = coords.at(-1);
  const showDots = points.length <= 40;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ gap: 6 }}
    >
      <View style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="wl-fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={theme.colors.primary} stopOpacity={0.28} />
                <Stop offset="1" stopColor={theme.colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 0.5, 1].map((r) => (
              <Line
                key={r}
                x1={PAD_X}
                x2={width - PAD_X}
                y1={PAD_TOP + r * innerH}
                y2={PAD_TOP + r * innerH}
                stroke={theme.colors.surfaceHigh}
                strokeWidth={1}
              />
            ))}
            {area ? <Path d={area} fill="url(#wl-fill)" /> : null}
            {coords.length > 1 ? (
              <Path
                d={line}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {showDots
              ? coords.map((c, i) => (
                  <Circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r={i === coords.length - 1 ? 5 : 2.5}
                    fill={i === coords.length - 1 ? theme.colors.primary : theme.colors.surface}
                    stroke={theme.colors.primary}
                    strokeWidth={i === coords.length - 1 ? 0 : 1.5}
                  />
                ))
              : last && <Circle cx={last.x} cy={last.y} r={5} fill={theme.colors.primary} />}
          </Svg>
        ) : null}
        {width > 0 && points.length > 0 ? (
          <>
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              style={{ position: 'absolute', left: PAD_X, top: 0, fontSize: 10 }}
            >
              {hi} {unit}
            </AppText>
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              style={{ position: 'absolute', left: PAD_X, bottom: 0, fontSize: 10 }}
            >
              {lo} {unit}
            </AppText>
          </>
        ) : null}
      </View>
      {startLabel || endLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {startLabel}
          </AppText>
          <AppText variant="bodySm" color="onSurfaceVariant">
            {endLabel}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
