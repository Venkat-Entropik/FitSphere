import type { FastifyReply } from 'fastify';
import type { ZodError } from 'zod';

/** `{ message, code, fieldErrors? }` is the error shape the mobile app's ApiError reads. */
export function fail(reply: FastifyReply, status: number, code: string, message: string, extra: object = {}) {
  return reply.status(status).send({ message, code, ...extra });
}

export function validationFailure(reply: FastifyReply, error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'body');
    fieldErrors[field] ??= issue.message;
  }
  const first = Object.values(fieldErrors)[0] ?? 'Invalid request';
  return fail(reply, 400, 'validation_error', first, { fieldErrors });
}
