import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useMotionEnabled } from '@/components/motion/useReducedMotion';
import { AppText } from '@/components/ui/AppText';
import { glow, useTheme, type ColorToken } from '@/theme';

export interface TrendBar {
  label: string;
  value: number;
  /** Text above the bar. Shown only for the highlighted bar so a row of eight stays readable. */
  valueLabel?: string;
}

export interface TrendBarsProps {
  bars: readonly TrendBar[];
  /** Index of the bar to emphasise; defaults to the last one. */
  highlight?: number;
  /** A reference value drawn as a dashed line, e.g. the recent average. */
  reference?: number;
  referenceLabel?: string;
  color?: ColorToken;
  height?: number;
  accessibilityLabel?: string;
}

function Bar({
  ratio,
  index,
  color,
  highlighted,
}: {
  ratio: number;
  index: number;
  color: string;
  highlighted: boolean;
}) {
  const motion = useMotionEnabled();
  const grown = useSharedValue(motion ? 0 : 1);
  useEffect(() => {
    grown.value = motion
      ? withDelay(index * 50, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }))
      : 1;
  }, [motion, index, grown]);
  const style = useAnimatedStyle(() => ({ height: `${ratio * grown.value * 100}%` }));
  return (
    <Animated.View
      style={[
        {
          width: '100%',
          minHeight: 3,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          backgroundColor: color,
          opacity: highlighted ? 1 : 0.55,
        },
        highlighted && glow(color, 0.35, 8),
        style,
      ]}
    />
  );
}

/**
 * Equal-width column chart that stretches to whatever width it is given, so it holds up from small
 * phones to tablets. Bars grow in once, and values never overflow because only one label is drawn.
 */
export function TrendBars({
  bars,
  highlight,
  reference,
  referenceLabel,
  color = 'primary',
  height = 120,
  accessibilityLabel,
}: TrendBarsProps) {
  const theme = useTheme();
  const active = highlight ?? bars.length - 1;
  const max = Math.max(1, ...bars.map((b) => b.value), reference ?? 0) * 1.25;
  const tint = theme.colors[color];
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ gap: 6 }}>
      <View style={{ height, justifyContent: 'flex-end' }}>
        {/* gridlines */}
        {[0.5, 1].map((r) => (
          <View
            key={r}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${r * 100 - (r === 1 ? 1 : 0)}%`,
              height: 1,
              backgroundColor: theme.colors.surfaceHigh,
            }}
          />
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%' }}>
          {bars.map((bar, i) => (
            <View
              key={`${bar.label}-${i}`}
              style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
            >
              {i === active && bar.valueLabel ? (
                <AppText
                  variant="labelCaps"
                  color="primary"
                  numberOfLines={1}
                  style={{ textAlign: 'center', fontSize: 10, marginBottom: 2 }}
                >
                  {bar.valueLabel}
                </AppText>
              ) : null}
              <View
                style={{
                  width: '100%',
                  justifyContent: 'flex-end',
                  height: `${(bar.value / max) * 100}%`,
                }}
              >
                <Bar ratio={1} index={i} color={tint} highlighted={i === active} />
              </View>
            </View>
          ))}
        </View>
        {reference !== undefined && reference > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${(reference / max) * 100}%`,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.colors.onSurfaceVariant,
            }}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {bars.map((bar, i) => (
          <AppText
            key={`${bar.label}-${i}`}
            variant="labelCaps"
            color={i === active ? 'primary' : 'onSurfaceVariant'}
            numberOfLines={1}
            style={{ flex: 1, textAlign: 'center', fontSize: 10 }}
          >
            {bar.label}
          </AppText>
        ))}
      </View>
      {reference !== undefined && reference > 0 && referenceLabel ? (
        <AppText variant="bodySm" color="onSurfaceVariant">
          - - - {referenceLabel}
        </AppText>
      ) : null}
    </View>
  );
}
