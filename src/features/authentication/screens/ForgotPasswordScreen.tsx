import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { AuthLink, AuthScaffold, ErrorBanner } from '../components/AuthScaffold';
import { useForgotPassword } from '../hooks/useAuth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../types/auth.schemas';
import { describeAuthFailure } from '../utils/auth-errors';

const FIELDS = ['email'] as const;

/** Step 1 of a password reset: ask for the account email, then move on to entering the emailed code. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const forgot = useForgotPassword();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    try {
      await forgot.mutateAsync(email.trim());
      router.navigate({ pathname: '/reset-password', params: { email: email.trim() } });
    } catch {
      // Shown through `forgot.error` below.
    }
  });

  const failure = forgot.error ? describeAuthFailure(forgot.error, FIELDS) : null;

  return (
    <AuthScaffold
      title="Reset your password."
      subtitle="Enter your account email and we'll send you a 6-digit code."
      footer={
        <AuthLink
          prompt="Remembered it?"
          action="Back to sign in"
          onPress={() => router.navigate('/login')}
        />
      }
    >
      {failure?.banner ? <ErrorBanner message={failure.banner} /> : null}
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
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message ?? failure?.fieldErrors.email}
          />
        )}
      />
      <PrimaryButton
        size="lg"
        label="Send reset code"
        onPress={() => void submit()}
        loading={forgot.isPending}
      />
    </AuthScaffold>
  );
}
