export interface Email {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  /** Resolves when the provider accepted the message; rejects on any failure. */
  send(email: Email): Promise<void>;
}

/** Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export function createResendMailer(options: { apiKey: string; from: string; timeoutMs?: number }): Mailer {
  return {
    async send({ to, subject, text }) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: options.from, to: [to], subject, text }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
      });
      // Never include the response body or request in the error: it can echo the recipient or the code.
      if (!response.ok) throw new Error(`Email provider rejected the message (HTTP ${response.status})`);
    },
  };
}

/**
 * Used when no provider is configured. It sends nothing. In development it prints the message so you
 * can read the reset code; elsewhere it only warns, so codes never reach production logs.
 */
export function createFallbackMailer(options: { development: boolean; log: (line: string) => void }): Mailer {
  return {
    async send({ to, subject, text }) {
      options.log(
        options.development
          ? `[dev mail] to=${to} subject="${subject}"\n${text}`
          : 'Email is not configured (set RESEND_API_KEY and MAIL_FROM); a message was not sent.',
      );
    },
  };
}
