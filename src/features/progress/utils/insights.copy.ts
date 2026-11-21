import {
  changeVs,
  formatMinutes,
  formatVolume,
  paceLabel,
  SETS_TARGET,
  type MuscleLoad,
  type StrengthTrend,
  type TrainingInsights,
} from './insights.logic';

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The plain-language headline and explanation shown on each insight card. */
export interface Copy {
  headline: string;
  detail: string;
}

export function summaryCopy(i: TrainingInsights): Copy {
  const { thisWeek: w, average: a } = i;
  if (!i.hasData) {
    return {
      headline: 'No training logged in the last 8 weeks',
      detail:
        'Finish a workout or record an activity and this page fills with trends, strength estimates and balance checks.',
    };
  }
  const sessions = changeVs(w.sessions, a.sessions);
  const headline =
    sessions.direction === 'none'
      ? `${plural(w.sessions, 'session')} in the last 7 days`
      : sessions.direction === 'up'
        ? `${plural(w.sessions, 'session')} this week, up from your usual ${a.sessions}`
        : sessions.direction === 'down'
          ? `${plural(w.sessions, 'session')} this week, down from your usual ${a.sessions}`
          : `${plural(w.sessions, 'session')} this week, right on your usual ${a.sessions}`;
  return {
    headline,
    detail:
      'Compares the last 7 days with the average of the 4 weeks before. A session is a logged workout or activity. Small swings are normal; look for a direction over several weeks.',
  };
}

export function volumeCopy(i: TrainingInsights): Copy {
  const { load, thisWeek: w, average: a } = i;
  const detail =
    'Volume is weight lifted times reps, added up for the week. It is a rough measure of how much work your muscles did.';
  switch (load.status) {
    case 'baseline':
      return {
        headline: `${formatVolume(w.volumeKg)} kg lifted in the last 7 days`,
        detail: `${detail} After a few weeks of data we can tell you whether this is a normal week for you.`,
      };
    case 'ramping':
      return {
        headline: `${load.ratio}× your usual weekly volume`,
        detail: `${detail} That is a big jump on your ${formatVolume(a.volumeKg)} kg average. Raising volume gradually, roughly 10 to 20% a week, is easier on joints and recovery.`,
      };
    case 'light':
      return {
        headline: `A lighter week: ${load.ratio}× your usual`,
        detail: `${detail} Lighter weeks are fine for recovery. If it was not planned, an extra session would bring you back to your ${formatVolume(a.volumeKg)} kg average.`,
      };
    default:
      return {
        headline: `A steady week: ${load.ratio}× your usual`,
        detail: `${detail} You are close to your ${formatVolume(a.volumeKg)} kg average, which is a sustainable pattern.`,
      };
  }
}

export function strengthCopy(trends: readonly StrengthTrend[]): Copy {
  const detail =
    'Estimated one-rep max (1RM) turns any set into the heaviest single rep it implies, so a set of 8 and a set of 5 can be compared. It is an estimate, not a test.';
  if (trends.length === 0) {
    return { headline: 'No lifts logged yet', detail };
  }
  const up = trends.filter((t) => t.status === 'improving').length;
  const down = trends.filter((t) => t.status === 'dipping');
  const headline =
    up > 0
      ? `${plural(up, 'lift')} getting stronger`
      : down.length > 0
        ? `${down[0]!.name} has dipped lately`
        : trends.every((t) => t.status === 'baseline')
          ? 'Building your baseline'
          : 'Your lifts are holding steady';
  const tip = down.length
    ? ' A dip over a few sessions often means fatigue or too little sleep and food rather than lost strength.'
    : up > 0
      ? ' Keep adding small amounts of weight or a rep when sets feel easy.'
      : '';
  return { headline, detail: `${detail}${tip}` };
}

export function statusLabel(status: StrengthTrend['status']): string {
  return {
    improving: 'Improving',
    steady: 'Steady',
    dipping: 'Dipping',
    baseline: 'New',
  }[status];
}

export function muscleCopy(muscles: readonly MuscleLoad[]): Copy {
  const [lo, hi] = SETS_TARGET;
  const detail = `Hard sets per muscle group in the last 7 days. A common guideline is ${lo} to ${hi} sets a week for growth. More is not always better, and beginners often progress on fewer.`;
  const trained = muscles.filter((m) => m.sets > 0);
  if (trained.length === 0) return { headline: 'No sets in the last 7 days', detail };
  const missing = muscles.filter((m) => m.status === 'none');
  const low = muscles.filter((m) => m.status === 'low');
  const high = muscles.filter((m) => m.status === 'high');
  const headline = missing.length
    ? `${missing.map((m) => m.label).join(', ')} ${missing.length === 1 ? 'has' : 'have'} had no work`
    : low.length
      ? `${low.map((m) => m.label).join(', ')} could use more sets`
      : high.length
        ? `${high.map((m) => m.label).join(', ')} may be getting a lot`
        : 'Every muscle group is in the target range';
  return { headline, detail };
}

export function cardioCopy(i: TrainingInsights): Copy {
  const { cardio: c } = i;
  const detail =
    'Distance from recorded GPS activities over the last 8 weeks. Pace compares your runs from the last 4 weeks with the 4 before; a lower pace means faster.';
  if (c.sessions === 0) {
    return { headline: 'No activities recorded yet', detail };
  }
  let pace = '';
  if (c.paceNow && c.pacePrev) {
    const diff = c.pacePrev - c.paceNow;
    pace =
      Math.abs(diff) < 3
        ? ' Your running pace is unchanged.'
        : diff > 0
          ? ` Your running pace improved by ${Math.round(diff)} seconds per km.`
          : ` Your running pace is ${Math.round(-diff)} seconds per km slower.`;
  }
  return {
    headline: `${c.totalKm} km over ${plural(c.sessions, 'activity', 'activities')}`,
    detail: `${detail}${pace}`,
  };
}

export function consistencyCopy(i: TrainingInsights): Copy {
  const { consistency: c } = i;
  const detail = `Active days per week against your goal of ${plural(c.targetDays, 'day')}. Consistency matters more than any single hard week.`;
  if (!i.hasData) return { headline: 'Nothing logged yet', detail };
  const where = c.bestWeekday ? ` You train most often on ${c.bestWeekday}s.` : '';
  return {
    headline: `Goal met in ${c.weeksHit} of the last 8 weeks`,
    detail: `${detail}${where}`,
  };
}

export const tileSummary = (i: TrainingInsights) => {
  const { thisWeek: w, average: a } = i;
  return [
    {
      label: 'Sessions',
      value: String(w.sessions),
      change: changeVs(w.sessions, a.sessions),
    },
    {
      label: 'Volume',
      value: `${formatVolume(w.volumeKg)} kg`,
      change: changeVs(w.volumeKg, a.volumeKg),
    },
    {
      label: 'Time',
      value: formatMinutes(w.minutes),
      change: changeVs(w.minutes, a.minutes),
    },
    {
      label: 'Distance',
      value: `${w.distanceKm} km`,
      change: changeVs(w.distanceKm, a.distanceKm),
    },
  ];
};

export { paceLabel };
