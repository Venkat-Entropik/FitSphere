import { loginSchema, registerSchema } from '@/features/authentication/types/auth.schemas';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    name: 'Sam',
    email: 'sam@x.io',
    password: 'abcdefg1',
    confirmPassword: 'abcdefg1',
  };

  it('accepts a valid registration', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a strong enough password', () => {
    expect(
      registerSchema.safeParse({ ...valid, password: 'short1', confirmPassword: 'short1' }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' })
        .success,
    ).toBe(false);
  });

  it('reports mismatched confirmation on confirmPassword', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different1' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
  });
});
