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
