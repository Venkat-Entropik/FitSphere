import { usageLabel } from '@/features/ai-coach/components/UsageNote';

const base = { plan: 'free' as const, limit: 10, used: 3, remaining: 7, resetsAt: 0 };

describe('usageLabel', () => {
  it('shows what is left', () => {
    expect(usageLabel(base)).toBe('7 of 10 coach messages left today');
  });

  it('says when more messages come back, in whole hours', () => {
    const now = Date.parse('2026-11-01T21:30:00Z');
    const resetsAt = Date.parse('2026-11-02T00:00:00Z');
    expect(usageLabel({ ...base, used: 10, remaining: 0, resetsAt }, now)).toBe(
      'Daily limit reached. More messages in about 3 hours.',
    );
    expect(usageLabel({ ...base, used: 10, remaining: 0, resetsAt }, resetsAt - 60_000)).toBe(
      'Daily limit reached. More messages in about 1 hour.',
    );
  });
});
