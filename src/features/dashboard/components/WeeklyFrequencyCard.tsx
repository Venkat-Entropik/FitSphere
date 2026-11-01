import { BarChart } from '@/components/charts/BarChart';
import { ChartCard } from '@/components/charts/ChartCard';

import type { WeeklyFrequencyDay } from '../types/dashboard.types';
import { countCompleted, weeklyFrequencyBars } from '../utils/telemetry';

export interface WeeklyFrequencyCardProps {
  days: readonly WeeklyFrequencyDay[];
  targetDays: number;
}

export function WeeklyFrequencyCard({ days, targetDays }: WeeklyFrequencyCardProps) {
  const completed = countCompleted(days);
  return (
    <ChartCard
      title="Weekly Frequency"
      icon="calendar_view_week"
      trailingText={`${completed} / ${targetDays} Target Met`}
      trailingColor="primary"
    >
      <BarChart
        bars={weeklyFrequencyBars(days)}
        accessibilityLabel={`${completed} of ${targetDays} workouts completed this week`}
      />
    </ChartCard>
  );
}
