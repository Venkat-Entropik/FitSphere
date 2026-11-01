import type { Db } from '../db.js';
import type { CoachPlan } from './fallback.js';
import { MAX_STORED_MESSAGES } from './limits.js';

export interface CoachMessageDto {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
  plan?: CoachPlan;
  showDisclaimer?: boolean;
}

interface Row {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  plan: string | null;
  reply_to: string | null;
  created_at: number;
}

const toDto = (r: Row): CoachMessageDto => ({
  id: r.id,
  role: r.role,
  text: r.text,
  createdAt: r.created_at,
  ...(r.plan && { plan: JSON.parse(r.plan) as CoachPlan }),
  // Every assistant message carries the not-medical-advice note.
  ...(r.role === 'assistant' && { showDisclaimer: true }),
});

export interface CachedInsight {
  text: string;
  source: 'ai' | 'rules';
  fingerprint: string;
  createdAt: number;
}

export type CoachRepository = ReturnType<typeof createCoachRepository>;

export function createCoachRepository(db: Db) {
  return {
    /** Oldest first, newest 100. */
    async list(userId: string, limit = 100): Promise<CoachMessageDto[]> {
      const rows = await db.all<Row>(
        'SELECT id, role, text, plan, reply_to, created_at FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC, seq DESC LIMIT ?',
        [userId, limit],
      );
      return rows.reverse().map(toDto);
    },

    /** The assistant reply already stored for a user message id, so a retried request is not charged twice. */
    async replyFor(userId: string, userMessageId: string): Promise<CoachMessageDto | undefined> {
      const row = await db.get<Row>(
        "SELECT id, role, text, plan, reply_to, created_at FROM coach_messages WHERE user_id = ? AND reply_to = ? AND role = 'assistant'",
        [userId, userMessageId],
      );
      return row && toDto(row);
    },

    async userMessageExists(userId: string, id: string): Promise<boolean> {
      return !!(await db.get("SELECT 1 AS one FROM coach_messages WHERE user_id = ? AND id = ? AND role = 'user'", [userId, id]));
    },

    /** Stores the question and its answer together, then trims the history to a fixed size. */
    async saveExchange(userId: string, user: CoachMessageDto, assistant: CoachMessageDto): Promise<void> {
      await db.transaction(async (tx) => {
        const insert = `INSERT INTO coach_messages (user_id, id, role, text, plan, reply_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (user_id, id) DO NOTHING`;
        await tx.run(insert, [userId, user.id, 'user', user.text, null, null, user.createdAt]);
        await tx.run(insert, [
          userId,
          assistant.id,
          'assistant',
          assistant.text,
          assistant.plan ? JSON.stringify(assistant.plan) : null,
          user.id,
          assistant.createdAt,
        ]);
        await tx.run(
          `DELETE FROM coach_messages WHERE user_id = ? AND id NOT IN (
             SELECT id FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC, seq DESC LIMIT ?)`,
          [userId, userId, MAX_STORED_MESSAGES],
        );
      });
    },

    async getInsight(userId: string, kind: string): Promise<CachedInsight | undefined> {
      const row = await db.get<{ data: string; created_at: number }>('SELECT data, created_at FROM ai_cache WHERE user_id = ? AND kind = ?', [
        userId,
        kind,
      ]);
      return row && { ...(JSON.parse(row.data) as Omit<CachedInsight, 'createdAt'>), createdAt: row.created_at };
    },

    async putInsight(userId: string, kind: string, insight: Omit<CachedInsight, 'createdAt'>, now: number): Promise<void> {
      await db.run(
        `INSERT INTO ai_cache (user_id, kind, data, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, created_at = excluded.created_at`,
        [userId, kind, JSON.stringify(insight), now],
      );
    },
  };
}
