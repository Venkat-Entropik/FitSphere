/** Parses a decimal field; null for blank/invalid so a form can show its own message. */
export function parseNumberInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Number(trimmed);
}
