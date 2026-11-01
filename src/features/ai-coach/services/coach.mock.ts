import type {
  CoachMessage,
  CoachOverview,
  SuggestedPrompt,
  WorkoutPlanSuggestion,
} from '../types/coach.types';

export const mockOverview: CoachOverview = {
  statusLabel: 'Active',
  syncLabel: '0.4s',
  contextChips: [
    { id: 'goal', icon: 'fitness_center', label: 'Goal: Hypertrophy', tone: 'lime' },
    { id: 'weekly', icon: 'calendar_today', label: 'Weekly: 4/5 Done', tone: 'cyan' },
    { id: 'recovery', icon: 'vital_signs', label: 'Recovery: 92%', tone: 'lime' },
    { id: 'kcal', icon: 'local_fire_department', label: 'Target: 2,650 kcal', tone: 'violet' },
  ],
  analysis: {
    windowLabel: 'Optimal Window',
    recoveryPercent: 98,
    recoveryLabel: 'Chest & Tricep Recovery',
    recoveryTarget: 'Ready',
    volumeOverloadPercent: 4.2,
    summary:
      "Today's prime prescription is **Push Hypertrophy**. High neurological recovery supports heavier compound sets with strictly timed 3-minute inter-set recovery windows.",
  },
  strain: {
    title: 'Weekly Strain & Volume Load',
    caption: 'Push Dominant',
    days: [
      { label: 'M', ratio: 0.65, tone: 'lime', isToday: false },
      { label: 'T', ratio: 0.8, tone: 'cyan', isToday: false },
      { label: 'W', ratio: 0.2, tone: 'muted', isToday: false },
      { label: 'T', ratio: 0.9, tone: 'lime', isToday: false },
      { label: 'F', ratio: 0.15, tone: 'muted', isToday: false },
      { label: 'Today', ratio: 0.95, tone: 'lime', isToday: true },
      { label: 'S', ratio: 0.1, tone: 'muted', isToday: false },
    ],
  },
};

export const mockSuggestions: SuggestedPrompt[] = [
  { id: 'plan', icon: 'event_available', tone: 'lime', text: 'Create my weekly workout plan' },
  {
    id: 'protein',
    icon: 'nutrition',
    tone: 'cyan',
    text: 'How much protein should I consume today?',
  },
  { id: 'bench', icon: 'query_stats', tone: 'lime', text: 'Analyze my bench press progression' },
  {
    id: 'mobility',
    icon: 'self_improvement',
    tone: 'violet',
    text: 'Suggest 15-min recovery mobility',
  },
];

const PUSH_PLAN: WorkoutPlanSuggestion = {
  rpe: 8.5,
  exercises: [
    {
      name: 'Incline DB Press',
      prescription: '3 sets × 8–10 reps',
      load: '32 kg',
      loadNote: '+2kg bump',
      tone: 'progress',
    },
    {
      name: 'Weighted Dips',
      prescription: '3 sets × 8 reps',
      load: 'BW + 15 kg',
      loadNote: 'Controlled eccentric',
      tone: 'neutral',
    },
    {
      name: 'Tricep Rope Pushdowns',
      prescription: '4 sets × 12 reps',
      load: '27.5 kg',
      loadNote: 'Peak contraction',
      tone: 'cue',
    },
  ],
};

/** Sample conversation mirroring the Stitch reference. Timestamps are today at 10:42. */
export function buildMockHistory(now = new Date()): CoachMessage[] {
  const at = new Date(now);
  at.setHours(10, 42, 0, 0);
  const t = at.getTime();
  return [
    {
      id: 'seed-user-1',
      role: 'user',
      text: 'What should I train today and how should I adjust my weights?',
      createdAt: t,
    },
    {
      id: 'seed-assistant-1',
      role: 'assistant',
      text: 'Based on your recent workout history, I recommend a **Push-Day Session** today. Your anterior delts and pectorals are fully replenished after 72 hours of anabolic rest.',
      createdAt: t + 30_000,
      plan: PUSH_PLAN,
      showDisclaimer: true,
    },
  ];
}

/** Keyword-routed canned replies. Stands in for the backend model until it exists. */
export function mockReply(
  question: string,
): Pick<CoachMessage, 'text' | 'plan' | 'showDisclaimer'> {
  const q = question.toLowerCase();
  if (q.includes('protein')) {
    return {
      text: 'A common evidence-based range for building muscle is **1.6–2.2 g of protein per kg** of bodyweight. At 68.5 kg that is roughly **110–150 g** today — you are at 105 g, so a protein-rich dinner would close the gap.',
      showDisclaimer: true,
    };
  }
  if (q.includes('plan') || q.includes('week')) {
    return {
      text: 'Here is a 5-day split built around your goal: **Mon** Push, **Tue** Pull, **Wed** Legs, **Thu** rest or mobility, **Fri** Upper, **Sat** Lower. Progress one variable per week — weight or reps, not both.',
      showDisclaimer: true,
    };
  }
  if (q.includes('bench') || q.includes('progress')) {
    return {
      text: 'Your pressing volume is up **4.2%** week over week with stable bar speed. If your last set hits the top of the rep range with good form, add 2 kg next session.',
      showDisclaimer: true,
    };
  }
  if (q.includes('mobility') || q.includes('recovery') || q.includes('stretch')) {
    return {
      text: 'Try 15 minutes: **thoracic rotations** (2×8/side), **hip 90/90 switches** (2×8), **cat-cow** (1×10), **world’s greatest stretch** (2×5/side), then 2 minutes of easy nasal breathing.',
      showDisclaimer: true,
    };
  }
  return {
    text: 'I can build workout plans, review your progress, and suggest nutrition targets based on your logged data. What would you like to focus on?',
    showDisclaimer: true,
  };
}
