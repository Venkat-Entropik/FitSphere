import type { Badge, HeatCell, ProgressOverview } from '../types/progress.types';

const HEATMAP: HeatCell[] = Array.from({ length: 14 }, (_, i) => ({
  day: i + 1,
  kind: i + 1 === 6 || i + 1 === 12 ? 'cardio' : 'strength',
}));

const BADGES: Badge[] = [
  {
    id: 'iron',
    title: 'Iron Discipline',
    description: 'Completed 14 consecutive active workout days without rest violation.',
    icon: 'workspace_premium',
    tone: 'primary',
    status: 'earned',
  },
  {
    id: 'titan',
    title: 'Hypertrophy Titan',
    description: 'Surpassed 25,000 kg total weekly compound tonnage.',
    icon: 'military_tech',
    tone: 'neutral',
    status: 'earned',
  },
  {
    id: 'pace',
    title: 'Pace Breaker',
    description: 'Clocked sub-4\'50" split during full 10k outdoor session.',
    icon: 'speed',
    tone: 'secondary',
    status: 'earned',
  },
  {
    id: 'centurion',
    title: 'Centurion Club',
    description: 'Log 100 verified workouts in FitSphere ecosystem.',
    icon: 'lock',
    tone: 'neutral',
    status: 'locked',
    progress: { current: 74, target: 100, unit: '' },
  },
  {
    id: 'century-volume',
    title: 'Century Volume Club',
    description: 'Accumulate 100,000 kg lifetime resistance volume.',
    icon: 'lock',
    tone: 'neutral',
    status: 'locked',
    progress: { current: 62800, target: 100000, unit: 'kg' },
  },
];

/** Sample data mirroring the Stitch reference. */
export const mockProgress: ProgressOverview = {
  macrocycleLabel: 'Hypertrophy Macrocycle · Wk 4/6',
  streak: { days: 14, topPercent: 4, weekDone: 4, weekTarget: 5, heatmap: HEATMAP },
  synthesis: { weeklyVolumePercent: 4.2, milestoneKg: 70, weeksToMilestone: 5 },
  personalRecords: {
    totalCount: 28,
    items: [
      {
        id: 'pr1',
        exercise: 'Incline DB Press',
        value: '32 kg',
        detail: '× 10 reps',
        chip: { label: 'NEW PR · 2D AGO', tone: 'primary', icon: 'star' },
        icon: 'fitness_center',
        iconTone: 'neutral',
        footLeft: { text: '+2.0 kg milestone bump', tone: 'primary' },
        footRight: '1RM Est: 42 kg',
      },
      {
        id: 'pr2',
        exercise: 'Conventional Deadlift',
        value: '145 kg',
        detail: '× 6 reps',
        chip: { label: 'CONFIRMED · 7D AGO', tone: 'neutral' },
        icon: 'bolt',
        iconTone: 'neutral',
        footLeft: { text: '+5.0 kg over cycle start', tone: 'secondary' },
        footRight: '1RM Est: 174 kg',
      },
      {
        id: 'pr3',
        exercise: '10k Outdoor Run',
        value: '46:20',
        detail: '4\'38" /km',
        chip: { label: 'AEROBIC PEAK', tone: 'secondary' },
        icon: 'directions_run',
        iconTone: 'secondary',
        footLeft: { text: '-1:42 pace delta', tone: 'secondary' },
        footRight: 'HR Avg: 164 bpm',
      },
      {
        id: 'pr4',
        exercise: 'Weekly Lift Volume',
        value: '28,450 kg',
        detail: '',
        chip: { label: 'VOLUME HIGH', tone: 'primary' },
        icon: 'equalizer',
        iconTone: 'primary',
        footLeft: { text: '+1,820 kg vs prev week', tone: 'primary' },
        footRight: '16 Sets Completed',
      },
    ],
  },
  transformation: {
    dayNumber: 42,
    baseline: { kg: 67.2, bodyFatPercent: 15.2, muscleKg: 33.3 },
    current: { kg: 68.5, bodyFatPercent: 13.8, muscleKg: 34.2 },
    trajectory: {
      points: [67.2, 67.3, 67.5, 67.8, 68.0, 68.2, 68.3, 68.5],
      weekDeltaKg: 0.3,
      targetKg: 72,
      midLabel: 'Day 21 (67.8 kg)',
    },
  },
  badges: { items: BADGES, unlocked: 12, total: 20 },
};
