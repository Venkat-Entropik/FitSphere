import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, type TextInput } from 'react-native';

import { CustomInput, type CustomInputProps } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';

/** Password field with a show/hide toggle. */
export const PasswordInput = forwardRef<
  ComponentRef<typeof TextInput>,
  Omit<CustomInputProps, 'secureTextEntry'>
>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <CustomInput
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      rightAdornment={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          onPress={() => setVisible((v) => !v)}
          hitSlop={10}
        >
          <Icon
            name={visible ? 'visibility_off' : 'visibility'}
            size={20}
            color="onSurfaceVariant"
          />
        </Pressable>
      }
    />
  );
});
