import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { env } from '@/config/env';

import { AuthLink, AuthScaffold, ErrorBanner } from '../components/AuthScaffold';
import { PasswordInput } from '../components/PasswordInput';
import { useLogin } from '../hooks/useAuth';
import { loginSchema, type LoginInput } from '../types/auth.schemas';
import { describeAuthFailure } from '../utils/auth-errors';
import { useDemoSession } from '../hooks/useDemoSession';

const FIELDS = ['email', 'password'] as const;

export function LoginScreen() {
  const router = useRouter();
  const { reset: justReset } = useLocalSearchParams<{ reset?: string }>();
  const login = useLogin();
  const startDemo = useDemoSession();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
    } catch (error) {
      const failure = describeAuthFailure(error, FIELDS);
      for (const [field, message] of Object.entries(failure.fieldErrors)) {
        setError(field as (typeof FIELDS)[number], { message });
      }
    }
  });

  const failure = login.error ? describeAuthFailure(login.error, FIELDS) : null;

  return (
    <AuthScaffold
      title="Welcome back."
      subtitle="Sign in to pick up your training, nutrition and progress."
      footer={
        <>
          <AuthLink
            prompt="New to FitSphere?"
            action="Create account"
            onPress={() => router.navigate('/register')}
          />
          {__DEV__ && env.useMocks ? (
            <>
              <SecondaryButton
                label="Continue in demo mode"
                onPress={() => void startDemo()}
                size="md"
                fullWidth={false}
              />
              <AppText variant="bodySm" color="onSurfaceVariant" style={{ textAlign: 'center' }}>
                Demo mode uses sample data stored on this device. No account is created.
              </AppText>
            </>
          ) : null}
        </>
      }
    >
      {justReset === '1' ? (
        <AppText variant="bodySm" color="primary" accessibilityRole="alert">
          Password updated. Sign in with your new password.
        </AppText>
      ) : null}
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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <PasswordInput
            ref={passwordRef}
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
          />
        )}
      />
      <AuthLink
        prompt="Trouble signing in?"
        action="Forgot password"
        onPress={() => router.navigate('/forgot-password')}
      />
      <PrimaryButton
        size="lg"
        label="Sign in"
        onPress={() => void submit()}
        loading={login.isPending}
      />
    </AuthScaffold>
  );
}
