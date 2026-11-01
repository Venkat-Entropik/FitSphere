import type { z } from 'zod';

import type { NutritionRepository } from '../data/nutrition.repository.js';
import type { ProfileRepository } from '../data/profile.repository.js';
import type { RecordStore } from '../data/records.repository.js';
import type { activityBody, workoutBody } from '../data/schemas.js';

type Workout = z.infer<typeof workoutBody>;
type Activity = z.infer<typeof activityBody>;

const DAY = 86_400_000;
export const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A compact, anonymous summary of one user's recent data. No email, no ids, no free text they wrote. */
export interface CoachContext {
  profile: {
    goal: string;
    sex: string;
    age: number;
    heightCm: number;
    weightKg: number;
    targetKg: number;
    experience: string;
    daysPerWeek: number;
  };
  week: { workouts: number; runs: number; volumeKg: number; prevVolumeKg: number; prs: number; kcalByDay: number[] };
  daysSinceLastSession: number | null;
  recentWorkouts: { date: string; title: string; volumeKg: number; prs: number }[];
  topLifts: { name: string; kg: number; reps: number }[];
  runs14: { count: number; km: number; avgPaceSecPerKm: number | null };
  muscleSetsThisWeek: Record<string, number>;
  weight: { latestKg: number | null; change30dKg: number | null };
  nutrition: { date: string; kcal: number; protein: number; meals: number; hydrationMl: number }[];
}

export interface ContextSources {
  profiles: ProfileRepository;
  workouts: RecordStore<Workout>;
  activities: RecordStore<Activity>;
  nutrition: NutritionRepository;
}

export function buildCoachContext(sources: ContextSources, userId: string, now: number): CoachContext {
  const { profile: p, identity } = (() => {
    const dto = sources.profiles.get(userId, now);
    return { profile: dto.profile, identity: dto.identity };
  })();

  const workouts = sources.workouts.list(userId);
  const activities = sources.activities.list(userId);
  const weights = sources.profiles.listWeights(userId);

  const inRange = <T extends { startedAt: number }>(items: T[], fromMs: number, toMs = now + DAY) =>
    items.filter((i) => i.startedAt >= fromMs && i.startedAt < toMs);

  const weekW = inRange(workouts, now - 7 * DAY);
  const prevW = inRange(workouts, now - 14 * DAY, now - 7 * DAY);
  const weekA = inRange(activities, now - 7 * DAY);

  // Training load per day for the last 7 days (oldest first), from calories burned.
  const kcalByDay = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(now - (6 - i) * DAY);
    const load = [...workouts, ...activities]
      .filter((r) => dayKey(r.startedAt) === key)
      .reduce((sum, r) => sum + r.kcal, 0);
    return Math.round(load);
  });

  const muscleSetsThisWeek: Record<string, number> = {};
  for (const w of weekW) {
    for (const e of w.exercises) {
      muscleSetsThisWeek[e.muscleGroup] = (muscleSetsThisWeek[e.muscleGroup] ?? 0) + e.sets.length;
    }
  }

  const best = new Map<string, { name: string; kg: number; reps: number; e1rm: number }>();
  for (const w of inRange(workouts, now - 60 * DAY)) {
    for (const e of w.exercises) {
      for (const s of e.sets) {
        const e1rm = s.kg * (1 + s.reps / 30);
        const current = best.get(e.exerciseId);
        if (s.kg > 0 && (!current || e1rm > current.e1rm)) best.set(e.exerciseId, { name: e.name, kg: s.kg, reps: s.reps, e1rm });
      }
    }
  }

  const runs = inRange(activities, now - 14 * DAY).filter((a) => a.kind === 'run');
  const km = runs.reduce((sum, a) => sum + a.distanceKm, 0);
  const movingSec = runs.reduce((sum, a) => sum + a.movingSec, 0);

  const last = [...workouts, ...activities].reduce((m, r) => Math.max(m, r.startedAt), 0);

  const latestWeight = weights.at(-1);
  const monthAgo = dayKey(now - 30 * DAY);
  const baseline = weights.find((w) => w.dateKey >= monthAgo);

  return {
    profile: { ...p, age: identity.age },
    week: {
      workouts: weekW.length,
      runs: weekA.filter((a) => a.kind === 'run').length,
      volumeKg: Math.round(weekW.reduce((s, w) => s + w.volumeKg, 0)),
      prevVolumeKg: Math.round(prevW.reduce((s, w) => s + w.volumeKg, 0)),
      prs: weekW.reduce((s, w) => s + w.prCount, 0),
      kcalByDay,
    },
    daysSinceLastSession: last ? Math.max(0, Math.floor((now - last) / DAY)) : null,
    recentWorkouts: workouts
      .slice(-5)
      .reverse()
      .map((w) => ({ date: dayKey(w.startedAt), title: w.title, volumeKg: Math.round(w.volumeKg), prs: w.prCount })),
    topLifts: [...best.values()]
      .sort((a, b) => b.e1rm - a.e1rm)
      .slice(0, 5)
      .map(({ name, kg, reps }) => ({ name, kg, reps })),
    runs14: {
      count: runs.length,
      km: Math.round(km * 10) / 10,
      avgPaceSecPerKm: km > 0 ? Math.round(movingSec / km) : null,
    },
    muscleSetsThisWeek,
    weight: {
      latestKg: latestWeight?.kg ?? null,
      change30dKg:
        latestWeight && baseline && baseline.id !== latestWeight.id
          ? Math.round((latestWeight.kg - baseline.kg) * 10) / 10
          : null,
    },
    nutrition: [2, 1, 0].map((ago) => {
      const date = dayKey(now - ago * DAY);
      const d = sources.nutrition.getDay(userId, date);
      return {
        date,
        kcal: Math.round(d.meals.reduce((s, m) => s + m.kcal, 0)),
        protein: Math.round(d.meals.reduce((s, m) => s + m.protein, 0)),
        meals: d.meals.length,
        hydrationMl: d.hydrationMl,
      };
    }),
  };
}

const pace = (sec: number | null) => (sec === null ? 'n/a' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}/km`);

/** Plain-text rendering used inside prompts. Numbers only; safe to show to the model as data. */
export function renderContext(c: CoachContext): string {
  const p = c.profile;
  const lines = [
    `Profile: goal=${p.goal}, sex=${p.sex}, age=${p.age}, height=${p.heightCm} cm, weight=${p.weightKg} kg, target=${p.targetKg} kg, experience=${p.experience}, plans ${p.daysPerWeek} training days/week.`,
    `Last 7 days: ${c.week.workouts} lifting sessions, ${c.week.runs} runs, lifting volume ${c.week.volumeKg} kg (previous 7 days: ${c.week.prevVolumeKg} kg), ${c.week.prs} personal records.`,
    `Days since last session: ${c.daysSinceLastSession ?? 'no sessions logged yet'}.`,
    `Sets per muscle group this week: ${Object.entries(c.muscleSetsThisWeek).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}.`,
    `Recent lifting sessions: ${c.recentWorkouts.map((w) => `${w.date} ${w.title} (${w.volumeKg} kg, ${w.prs} PRs)`).join('; ') || 'none'}.`,
    `Best recent sets (60 days): ${c.topLifts.map((l) => `${l.name} ${l.kg} kg x ${l.reps}`).join('; ') || 'none'}.`,
    `Runs in last 14 days: ${c.runs14.count}, ${c.runs14.km} km total, average pace ${pace(c.runs14.avgPaceSecPerKm)}.`,
    `Body weight: latest ${c.weight.latestKg ?? 'n/a'} kg, 30-day change ${c.weight.change30dKg ?? 'n/a'} kg.`,
    `Nutrition (oldest to today): ${c.nutrition.map((n) => `${n.date} ${n.kcal} kcal, ${n.protein} g protein, ${n.meals} meals, ${n.hydrationMl} ml water`).join('; ')}.`,
  ];
  return lines.join('\n');
}
