import type { CoachContext } from './context.js';

/**
 * Rule-based answers used when the model is unavailable, rate-limited or returns something unusable.
 * They use the athlete's real numbers but make no model calls.
 */
export interface CoachReply {
  text: string;
  plan?: CoachPlan;
}

export interface CoachPlan {
  rpe: number;
  exercises: { name: string; prescription: string; load: string; loadNote: string; tone: 'progress' | 'neutral' | 'cue' }[];
}

const SPLITS: Record<number, string> = {
  1: '**Mon** full body',
  2: '**Mon** full body, **Thu** full body',
  3: '**Mon** push, **Wed** pull, **Fri** legs',
  4: '**Mon** upper, **Tue** lower, **Thu** upper, **Fri** lower',
  5: '**Mon** push, **Tue** pull, **Wed** legs, **Fri** upper, **Sat** lower',
  6: '**Mon** push, **Tue** pull, **Wed** legs, **Thu** push, **Fri** pull, **Sat** legs',
  7: '**Mon** push, **Tue** pull, **Wed** legs, **Thu** upper, **Fri** lower, **Sat** easy cardio, **Sun** mobility',
};

export function ruleReply(question: string, c: CoachContext): CoachReply {
  const q = question.toLowerCase();
  const p = c.profile;
  const today = c.nutrition.at(-1);

  if (/protein/.test(q)) {
    const low = Math.round(p.weightKg * 1.6);
    const high = Math.round(p.weightKg * 2.2);
    const have = today?.protein ?? 0;
    const gap = low - have;
    return {
      text: `A common range for building and keeping muscle is **1.6-2.2 g of protein per kg**. At ${p.weightKg} kg that is about **${low}-${high} g** a day. You have logged **${have} g** today${gap > 0 ? `, so aim for roughly ${gap} g more` : ', which already covers the low end'}.`,
    };
  }
  if (/\b(plan|week|split|schedule|routine)\b/.test(q)) {
    return {
      text: `For **${p.daysPerWeek} days a week** a simple split is ${SPLITS[p.daysPerWeek] ?? SPLITS[3]}. Progress one variable at a time: add reps first, then weight once you hit the top of the rep range on every set.`,
    };
  }
  if (/\b(progress|bench|squat|deadlift|press|lift|pr)\b/.test(q)) {
    const lifts = c.topLifts.slice(0, 3).map((l) => `${l.name} ${l.kg} kg x ${l.reps}`).join(', ');
    const change = c.week.prevVolumeKg > 0 ? Math.round(((c.week.volumeKg - c.week.prevVolumeKg) / c.week.prevVolumeKg) * 100) : null;
    return {
      text: `${lifts ? `Your best recent sets: ${lifts}. ` : 'I have no lifts logged yet. '}${change === null ? '' : `Lifting volume is **${change >= 0 ? '+' : ''}${change}%** versus last week. `}If every set reaches the top of the rep range with good form, add the smallest weight jump next session.`,
    };
  }
  if (/\b(mobility|stretch|recover|recovery|sore|warm)/.test(q)) {
    return {
      text: 'Try 15 minutes: **thoracic rotations** (2x8 per side), **hip 90/90 switches** (2x8), **cat-cow** (1x10), **world\'s greatest stretch** (2x5 per side), then 2 minutes of easy nasal breathing. If pain persists, see a qualified professional.',
    };
  }
  if (/\b(weight|fat|lose|gain|calorie|kcal|diet)\b/.test(q)) {
    const toGo = Math.round((p.targetKg - p.weightKg) * 10) / 10;
    return {
      text: `You are at **${p.weightKg} kg** with a target of **${p.targetKg} kg** (${toGo === 0 ? 'on target' : `${Math.abs(toGo)} kg to ${toGo > 0 ? 'gain' : 'lose'}`}). Aim for a steady **0.25-0.5 kg a week**, keep protein high and keep training consistent.`,
    };
  }
  return {
    text: 'I can build a weekly plan, review your lifts, suggest protein targets and mobility work from your logged data. What would you like to focus on?',
  };
}

export function dashboardInsight(c: CoachContext): string {
  const done = c.week.workouts + c.week.runs;
  const target = c.profile.daysPerWeek;
  if (c.daysSinceLastSession === null) return 'Log your first session to unlock personalised suggestions. Start with an easy full-body workout.';
  if (done >= target) return `You have hit **${done}/${target}** sessions this week. Take a recovery day or light mobility work.`;
  if (c.daysSinceLastSession >= 3) return `It has been **${c.daysSinceLastSession} days** since your last session. A moderate workout today will get your week back on track (${done}/${target} so far).`;
  return `You are at **${done}/${target}** sessions this week. ${c.daysSinceLastSession === 0 ? 'Good work today; keep tomorrow lighter if you feel tired.' : 'You are recovered enough for a solid session today.'}`;
}

export function nutritionTip(c: CoachContext): string {
  const today = c.nutrition.at(-1);
  const target = Math.round(c.profile.weightKg * 1.6);
  const have = today?.protein ?? 0;
  if (!today || today.meals === 0) return `Nothing logged yet today. Aim for about **${target} g of protein** across your meals.`;
  if (have < target) return `You are at **${have} g** of **${target} g** protein. Add a protein-rich meal or snack to close the gap.`;
  return `Protein is on track at **${have} g**. Keep fluids up (**${today.hydrationMl} ml** so far).`;
}

export function overviewSummary(c: CoachContext): string {
  const change = c.week.prevVolumeKg > 0 ? Math.round(((c.week.volumeKg - c.week.prevVolumeKg) / c.week.prevVolumeKg) * 100) : null;
  const rec = c.daysSinceLastSession === null ? 'No sessions logged yet.' : c.daysSinceLastSession >= 2 ? 'You are well recovered.' : 'You are still recovering from your last session.';
  return `${rec} This week: **${c.week.workouts}** lifting ${c.week.workouts === 1 ? 'session' : 'sessions'} and **${c.week.runs}** ${c.week.runs === 1 ? 'run' : 'runs'}${change === null ? '' : `, lifting volume **${change >= 0 ? '+' : ''}${change}%** versus last week`}. Prioritise ${dashboardPriority(c)} today.`;
}

function dashboardPriority(c: CoachContext): string {
  if (c.daysSinceLastSession !== null && c.daysSinceLastSession < 1) return 'recovery and protein';
  const sets = c.muscleSetsThisWeek;
  const groups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
  const least = groups.sort((a, b) => (sets[a] ?? 0) - (sets[b] ?? 0))[0] ?? 'a full-body session';
  return `your ${least}`;
}
