import { View } from 'react-native';

import { Card } from '@/components/cards/Card';
import { BarChart, type BarSpec } from '@/components/charts/BarChart';
import { AppText } from '@/components/ui/AppText';

import type { StrainDay } from '../types/coach.types';

const FILL = { lime: 'primary', cyan: 'secondary', muted: 'surfaceHighest' } as const;

/** Maps strain days onto the shared BarChart (muted days use quiet surface tones). */
export function strainBars(days: readonly StrainDay[]): BarSpec[] {
  return days.map((d) => ({
    label: d.label,
    ratio: d.ratio,
    variant: d.tone === 'muted' ? 'muted' : 'solid',
    fill: FILL[d.tone],
    highlighted: d.isToday,
    glowing: d.isToday,
  }));
}

export interface StrainChartCardProps {
  title: string;
  caption: string;
  days: readonly StrainDay[];
}

export function StrainChartCard({ title, caption, days }: StrainChartCardProps) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="bodyMd" weight="bold">
          {title}
        </AppText>
        <AppText variant="labelCaps" color="primary">
          {caption}
        </AppText>
      </View>
      <BarChart bars={strainBars(days)} barAreaHeight={60} gap={6} accessibilityLabel={title} />
    </Card>
  );
}
