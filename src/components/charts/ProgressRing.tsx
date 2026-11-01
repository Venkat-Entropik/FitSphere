import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { useTheme, type ColorToken } from '@/theme';

export interface RingSpec {
  /** 0–1; values outside the range are clamped. */
  progress: number;
  color: ColorToken;
}

export interface ProgressRingProps {
  /** One ring, or several concentric rings (outermost first), as in the daily telemetry widget. */
  rings: readonly RingSpec[];
  size?: number;
  strokeWidth?: number;
  /** Gap between concentric rings. */
  ringGap?: number;
  /** Padding between the outermost ring and the edge of the box. */
  inset?: number;
  /** Large center text, e.g. "84". */
  centerValue?: string;
  centerUnit?: string;
  centerLabel?: string;
  /** Custom center content (e.g. an icon); shown instead of the value text. */
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

export function ProgressRing({
  rings,
  size = 112,
  strokeWidth = 7,
  ringGap = 5,
  inset = 0,
  centerValue,
  centerUnit,
  centerLabel,
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const theme = useTheme();
  const mid = size / 2;
  const average = rings.length
    ? rings.reduce((sum, r) => sum + clamp(r.progress), 0) / rings.length
    : 0;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(average * 100) }}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={styles.rotate}>
        {rings.map((ring, i) => {
          const r = (size - strokeWidth) / 2 - inset - i * (strokeWidth + ringGap);
          const circumference = 2 * Math.PI * r;
          return (
            <G key={i}>
              <Circle
                cx={mid}
                cy={mid}
                r={r}
                stroke={theme.colors.surfaceHighest}
                strokeOpacity={0.4}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={mid}
                cy={mid}
                r={r}
                stroke={theme.colors[ring.color]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - clamp(ring.progress))}
              />
            </G>
          );
        })}
      </Svg>
      {children ? (
        <View style={styles.center} pointerEvents="none">
          {children}
        </View>
      ) : centerValue ? (
        <View style={styles.center} pointerEvents="none">
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <AppText variant="metricLg" tabular style={{ lineHeight: 28 }}>
              {centerValue}
            </AppText>
            {centerUnit ? (
              <AppText variant="bodySm" color="onSurfaceVariant">
                {centerUnit}
              </AppText>
            ) : null}
          </View>
          {centerLabel ? (
            <AppText
              variant="labelCaps"
              color="onSurfaceVariant"
              uppercase
              style={{ fontSize: 9, lineHeight: 12 }}
            >
              {centerLabel}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rotate: { transform: [{ rotate: '-90deg' }] },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
