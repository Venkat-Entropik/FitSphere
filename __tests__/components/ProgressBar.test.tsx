import { render, screen } from '@testing-library/react-native';

import { ProgressRing } from '@/components/charts/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';

describe('progress indicators', () => {
  it.each([
    [0.5, 50],
    [2, 100],
    [-1, 0],
    [Number.NaN, 0],
  ])('ProgressBar clamps %p to %p%%', async (input, expected) => {
    await render(<ProgressBar progress={input} accessibilityLabel="goal" />);
    expect(screen.getByLabelText('goal').props.accessibilityValue.now).toBe(expected);
  });

  it('ProgressRing exposes its clamped value', async () => {
    await render(
      <ProgressRing rings={[{ progress: 1.4, color: 'primary' }]} accessibilityLabel="ring" />,
    );
    expect(screen.getByLabelText('ring').props.accessibilityValue.now).toBe(100);
  });
});
