import { toApiError } from '@/services/api/api-error';

export interface FormFailure {
  /** Messages to attach to specific inputs. */
  fieldErrors: Partial<Record<string, string>>;
  /** Message for the banner when nothing field-specific applies (wrong password, offline, rate limited…). */
  banner: string | null;
}

/**
 * Splits a failed auth request into per-field messages (only for fields this form has) and a
 * banner message for everything else.
 */
export function describeAuthFailure(error: unknown, formFields: readonly string[]): FormFailure {
  const api = toApiError(error);
  const fieldErrors: Record<string, string> = {};
  for (const [field, message] of Object.entries(api.fieldErrors)) {
    if (formFields.includes(field)) fieldErrors[field] = message;
  }
  return { fieldErrors, banner: Object.keys(fieldErrors).length > 0 ? null : api.message };
}
