import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { AuthLink, AuthScaffold, ErrorBanner } from '../components/AuthScaffold';
import { PasswordInput } from '../components/PasswordInput';
import { useForgotPassword, useResetPassword } from '../hooks/useAuth';
import { resetPasswordSchema, type ResetPasswordInput } from '../types/auth.schemas';
import { describeAuthFailure } from '../utils/auth-errors';

const FIELDS = ['email', 'code', 'password'] as const;

/** Step 2: the emailed code plus a new password. Success returns to sign in. */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const reset = useResetPassword();
  const resend = useForgotPassword();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailParam ?? '', code: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ email, code, password }) => {
    try {
      await reset.mutateAsync({ email: email.trim(), code: code.trim(), password });
      router.replace({ pathname: '/login', params: { reset: '1' } });
    } catch (error) {
      const failure = describeAuthFailure(error, FIELDS);
      for (const [field, message] of Object.entries(failure.fieldErrors)) {
        setError(field as (typeof FIELDS)[number], { message });
      }
    }
  });

  const failure = reset.error ? describeAuthFailure(reset.error, FIELDS) : null;

  return (
    <AuthScaffold
      title="Enter your code."
      subtitle="Check your email for a 6-digit code, then choose a new password."
      footer={
        <>
          <AuthLink
            prompt="No email?"
            action={resend.isSuccess ? 'Sent again' : 'Send a new code'}
            onPress={() => {
              const email = getValues('email').trim();
              if (email) resend.mutate(email);
            }}
          />
          <AuthLink
            prompt="Remembered it?"
            action="Back to sign in"
            onPress={() => router.navigate('/login')}
          />
        </>
      }
    >
      {failure?.banner ? <ErrorBanner message={failure.banner} /> : null}
      {resend.error ? (
        <ErrorBanner message={describeAuthFailure(resend.error, []).banner ?? ''} />
      ) : null}
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <CustomInput
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <CustomInput
            label="6-digit code"
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={(text) => field.onChange(text.replace(/\D/g, ''))}
            onBlur={field.onBlur}
            error={errors.code?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <PasswordInput
            ref={passwordRef}
            label="New password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <PasswordInput
            ref={confirmRef}
            label="Confirm new password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      <AppText variant="bodySm" color="onSurfaceVariant">
        The code expires in 15 minutes. Changing your password signs you out everywhere.
      </AppText>
      <PrimaryButton
        size="lg"
        label="Change password"
        onPress={() => void submit()}
        loading={reset.isPending}
      />
    </AuthScaffold>
  );
}
