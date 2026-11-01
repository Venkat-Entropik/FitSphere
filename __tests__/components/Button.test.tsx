import { fireEvent, render, screen } from '@testing-library/react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Start" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Start' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading or disabled', async () => {
    const onPress = jest.fn();
    const { rerender } = await render(<PrimaryButton label="Save" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await rerender(<SecondaryButton label="Save" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
