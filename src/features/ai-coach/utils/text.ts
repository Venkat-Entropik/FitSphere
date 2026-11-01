export interface TextSegment {
  text: string;
  bold: boolean;
}

/** Splits `**bold**` markup into segments so messages render without a markdown dependency. */
export function parseEmphasis(input: string): TextSegment[] {
  return input
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((part) => part.length > 0)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

export function formatClockTime(epochMs: number, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(epochMs),
  );
}

/** A message the user may send: trimmed, non-empty, bounded. */
export const MAX_MESSAGE_LENGTH = 1000;
export function normalizeMessage(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.slice(0, MAX_MESSAGE_LENGTH) : null;
}
