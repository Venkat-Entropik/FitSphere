/** Time-of-day greeting used on the dashboard ("Good morning"). */
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "Thursday, Oct 24" */
export function formatDayLabel(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day key, e.g. "2026-11-01". Used to bucket logs by day. */
export function dateKey(date: Date | number): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(date: Date | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date | number, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Whole calendar days from `a` to `b` (positive when b is later). */
export function daysBetween(a: Date | number, b: Date | number): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date | number): Date {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}
