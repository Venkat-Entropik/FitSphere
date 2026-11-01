import { fireEvent, render, screen } from '@testing-library/react-native';

import { CustomInput } from '@/components/ui/CustomInput';

describe('CustomInput', () => {
  it('forwards text changes', async () => {
    const onChangeText = jest.fn();
    await render(<CustomInput label="Email" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');
    expect(onChangeText).toHaveBeenCalledWith('a@b.co');
  });

  it('shows the error in place of helper text', async () => {
    await render(
      <CustomInput label="Email" helperText="We never share it" error="Email is required" />,
    );
    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(screen.queryByText('We never share it')).toBeNull();
  });
});
