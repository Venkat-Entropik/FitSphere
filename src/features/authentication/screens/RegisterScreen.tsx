import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { TextInput } from 'react-native';

import { CustomInput } from '@/components/ui/CustomInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

import { AuthLink, AuthScaffold, ErrorBanner } from '../components/AuthScaffold';
import { PasswordInput } from '../components/PasswordInput';
import { useRegister } from '../hooks/useAuth';
import { registerSchema, type RegisterInput } from '../types/auth.schemas';
import { describeAuthFailure } from '../utils/auth-errors';

const FIELDS = ['name', 'email', 'password'] as const;

export function RegisterScreen() {
  const router = useRouter();
  const register = useRegister();
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    try {
      await register.mutateAsync({ name, email, password });
    } catch (error) {
      const failure = describeAuthFailure(error, FIELDS);
      for (const [field, message] of Object.entries(failure.fieldErrors)) {
        setError(field as (typeof FIELDS)[number], { message });
      }
    }
  });

  const failure = register.error ? describeAuthFailure(register.error, FIELDS) : null;

  return (
    <AuthScaffold
      title="Create your account."
      subtitle="Track workouts, runs and nutrition, and get coaching built on your own data."
      footer={
        <AuthLink
          prompt="Already have an account?"
          action="Sign in"
          onPress={() => router.navigate('/login')}
        />
      }
    >
      {failure?.banner ? <ErrorBanner message={failure.banner} /> : null}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <CustomInput
            label="Name"
            placeholder="Alex Chen"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <CustomInput
            ref={emailRef}
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
            placeholder="At least 8 characters"
            helperText="Use 8+ characters with a letter and a number."
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
            label="Confirm password"
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
      <PrimaryButton
        size="lg"
        label="Create account"
        onPress={() => void submit()}
        loading={register.isPending}
      />
    </AuthScaffold>
  );
}
