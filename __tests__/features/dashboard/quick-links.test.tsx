import { fireEvent, render, screen } from '@testing-library/react-native';

import { QuickLinks } from '@/features/dashboard/components/QuickLinks';

const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }) }));

describe('QuickLinks', () => {
  it('opens Nutrition, Progress and Analytics, which are not in the tab bar', async () => {
    await render(<QuickLinks />);
    await fireEvent.press(screen.getByRole('button', { name: /^Nutrition/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Progress/ }));
    await fireEvent.press(screen.getByRole('button', { name: /^Analytics/ }));
    expect(mockNavigate.mock.calls.map((c) => c[0])).toEqual([
      '/nutrition',
      '/progress',
      '/analytics',
    ]);
  });
});
