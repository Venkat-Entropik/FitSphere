import { z } from 'zod';

import type { CoachContext } from './context.js';
import type { CoachPlan, CoachReply } from './fallback.js';
import {
  CHAT_MAX_OUTPUT_TOKENS,
  INSIGHT_MAX_OUTPUT_TOKENS,
  MAX_INSIGHT_CHARS,
  MAX_REPLY_CHARS,
} from './limits.js';
import type { AiProvider } from './provider.js';
import {
  CHAT_SCHEMA,
  chatPrompt,
  insightPrompt,
  SYSTEM_PROMPT,
  TEXT_SCHEMA,
  type HistoryTurn,
  type InsightKind,
} from './prompts.js';

const planSchema = z.object({
  rpe: z.number().min(1).max(10),
  exercises: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        prescription: z.string().trim().min(1).max(60),
        load: z.string().trim().min(1).max(40),
        loadNote: z.string().trim().max(60),
        tone: z.enum(['progress', 'neutral', 'cue']),
      }),
    )
    .min(1)
    .max(6),
});

const replySchema = z.object({ text: z.string(), plan: z.unknown().optional() });

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trims, strips control characters and caps length so model output can never bloat storage or the UI. */
export function cleanText(raw: string, max: number): string {
  const text = raw.replace(CONTROL_CHARS, '').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function parseJson(raw: string): unknown {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(stripped);
}

/** Returns null when the output is not usable, so the caller falls back to rules. */
export function parseChatReply(raw: string): CoachReply | null {
  let json: unknown;
  try {
    json = parseJson(raw);
  } catch {
    return null;
  }
  const reply = replySchema.safeParse(json);
  if (!reply.success) return null;
  const text = cleanText(reply.data.text, MAX_REPLY_CHARS);
  if (!text) return null;
  const plan = reply.data.plan === undefined ? null : planSchema.safeParse(reply.data.plan);
  return plan?.success ? { text, plan: plan.data as CoachPlan } : { text };
}

export interface AiService {
  readonly enabled: boolean;
  chat(context: CoachContext, history: HistoryTurn[], question: string): Promise<CoachReply | null>;
  insight(kind: InsightKind, context: CoachContext): Promise<string | null>;
}

/** Wraps a provider with prompt building and output validation. Never throws: failures become null. */
export function createAiService(provider: AiProvider | null, onError: (error: unknown) => void = () => {}): AiService {
  return {
    enabled: provider !== null,

    async chat(context, history, question) {
      if (!provider) return null;
      try {
        const raw = await provider.generate({
          system: SYSTEM_PROMPT,
          prompt: chatPrompt(context, history, question),
          jsonSchema: CHAT_SCHEMA,
          maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
        });
        return parseChatReply(raw);
      } catch (error) {
        onError(error);
        return null;
      }
    },

    async insight(kind, context) {
      if (!provider) return null;
      try {
        const raw = await provider.generate({
          system: SYSTEM_PROMPT,
          prompt: insightPrompt(kind, context),
          jsonSchema: TEXT_SCHEMA,
          maxOutputTokens: INSIGHT_MAX_OUTPUT_TOKENS,
        });
        const parsed = replySchema.safeParse(parseJson(raw));
        const text = parsed.success ? cleanText(parsed.data.text, MAX_INSIGHT_CHARS) : '';
        return text || null;
      } catch (error) {
        onError(error);
        return null;
      }
    },
  };
}
