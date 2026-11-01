import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { strainBars } from '@/features/ai-coach/components/StrainChartCard';
import { AiCoachScreen } from '@/features/ai-coach/screens/AiCoachScreen';
import { buildMockHistory, mockOverview, mockReply } from '@/features/ai-coach/services/coach.mock';
import { formatClockTime, normalizeMessage, parseEmphasis } from '@/features/ai-coach/utils/text';

jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: jest.fn() }) }));

describe('text helpers', () => {
  it('splits **bold** emphasis into segments', () => {
    expect(parseEmphasis('Do a **Push Day** now')).toEqual([
      { text: 'Do a ', bold: false },
      { text: 'Push Day', bold: true },
      { text: ' now', bold: false },
    ]);
    expect(parseEmphasis('plain')).toEqual([{ text: 'plain', bold: false }]);
  });

  it('normalizes outgoing messages', () => {
    expect(normalizeMessage('   ')).toBeNull();
    expect(normalizeMessage('  hi  ')).toBe('hi');
    expect(normalizeMessage('x'.repeat(2000))).toHaveLength(1000);
  });

  it('formats times', () => {
    expect(formatClockTime(new Date(2026, 0, 1, 10, 42).getTime())).toMatch(/10:42/);
  });
});

describe('coach data', () => {
  it('maps strain days onto bar specs, highlighting today', () => {
    const bars = strainBars(mockOverview.strain.days);
    expect(bars).toHaveLength(7);
    expect(bars[5]).toMatchObject({
      label: 'Today',
      highlighted: true,
      glowing: true,
      fill: 'primary',
    });
    expect(bars[1]).toMatchObject({ fill: 'secondary', variant: 'solid' });
    expect(bars[2]).toMatchObject({ variant: 'muted', fill: 'surfaceHighest' });
  });

  it('seeds a history that ends with an assistant plan plus disclaimer', () => {
    const history = buildMockHistory();
    expect(history.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(history[1]!.plan?.exercises).toHaveLength(3);
    expect(history[1]!.showDisclaimer).toBe(true);
  });

  it('never presents guidance as medical advice', () => {
    for (const q of ['protein?', 'weekly plan', 'bench progress', 'mobility', 'hello']) {
      expect(mockReply(q).showDisclaimer).toBe(true);
    }
  });
});

describe('AiCoachScreen', () => {
  const renderScreen = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    return render(
      <QueryClientProvider client={client}>
        <AiCoachScreen />
      </QueryClientProvider>,
    );
  };

  it('sends a message, shows it immediately, then the coach reply', async () => {
    await renderScreen();
    expect(await screen.findByText('FitSphere AI Coach')).toBeTruthy();

    const input = screen.getByLabelText('Message the coach');
    await fireEvent.changeText(input, 'How much protein should I eat?');
    await fireEvent.press(screen.getByRole('button', { name: 'Send query' }));

    expect(await screen.findByText('How much protein should I eat?')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/1\.6–2\.2 g of protein/)).toBeTruthy(), {
      timeout: 3000,
    });
  });

  it('ignores empty messages', async () => {
    await renderScreen();
    await screen.findByText('FitSphere AI Coach');
    const send = screen.getByRole('button', { name: 'Send query' });
    expect(send.props.accessibilityState.disabled).toBe(true);
  });

  it('sends a suggested inquiry in one tap', async () => {
    await renderScreen();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Suggest 15-min recovery mobility' }),
    );
    await waitFor(() => expect(screen.getByText(/thoracic rotations/)).toBeTruthy(), {
      timeout: 3000,
    });
  });
});
