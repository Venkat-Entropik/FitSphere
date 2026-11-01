import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';

import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { deleteAccountSchema, type DeleteAccountInput } from '../types/auth.schemas';
import { describeAuthFailure } from '../utils/auth-errors';
import { ErrorBanner } from './AuthScaffold';
import { PasswordInput } from './PasswordInput';

export interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Asks for the password, then permanently deletes the account and signs out. */
export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const del = useDeleteAccount();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const close = () => {
    reset();
    del.reset();
    onClose();
  };

  const submit = handleSubmit(({ password }) => {
    del.mutate(password);
  });

  const failure = del.error ? describeAuthFailure(del.error, ['password']) : null;

  return (
    <BottomSheet visible={visible} onClose={close} title="Delete your account?">
      <View style={{ gap: 14 }}>
        <AppText variant="bodyMd" color="onSurfaceVariant">
          This permanently deletes your account and everything in it: profile, workouts, runs,
          meals, weights and coach chats. It cannot be undone.
        </AppText>
        {failure?.banner ? <ErrorBanner message={failure.banner} /> : null}
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              label="Confirm with your password"
              placeholder="Your password"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void submit()}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message ?? failure?.fieldErrors.password}
            />
          )}
        />
        <PrimaryButton
          label="Delete my account"
          onPress={() => void submit()}
          loading={del.isPending}
        />
        <SecondaryButton label="Keep my account" onPress={close} size="md" />
      </View>
    </BottomSheet>
  );
}
