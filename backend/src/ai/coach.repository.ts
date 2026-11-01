import type { DatabaseSync } from 'node:sqlite';

import { transaction } from '../db.js';
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

export function createCoachRepository(db: DatabaseSync) {
  return {
    /** Oldest first, newest 100. */
    list(userId: string, limit = 100): CoachMessageDto[] {
      const rows = db
        .prepare('SELECT id, role, text, plan, reply_to, created_at FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?')
        .all(userId, limit) as unknown as Row[];
      return rows.reverse().map(toDto);
    },

    /** The assistant reply already stored for a user message id, so a retried request is not charged twice. */
    replyFor(userId: string, userMessageId: string): CoachMessageDto | undefined {
      const row = db
        .prepare("SELECT id, role, text, plan, reply_to, created_at FROM coach_messages WHERE user_id = ? AND reply_to = ? AND role = 'assistant'")
        .get(userId, userMessageId) as Row | undefined;
      return row && toDto(row);
    },

    userMessageExists(userId: string, id: string): boolean {
      return !!db.prepare("SELECT 1 FROM coach_messages WHERE user_id = ? AND id = ? AND role = 'user'").get(userId, id);
    },

    /** Stores the question and its answer together, then trims the history to a fixed size. */
    saveExchange(userId: string, user: CoachMessageDto, assistant: CoachMessageDto): void {
      transaction(db, () => {
        const insert = db.prepare(
          'INSERT INTO coach_messages (user_id, id, role, text, plan, reply_to, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (user_id, id) DO NOTHING',
        );
        insert.run(userId, user.id, 'user', user.text, null, null, user.createdAt);
        insert.run(userId, assistant.id, 'assistant', assistant.text, assistant.plan ? JSON.stringify(assistant.plan) : null, user.id, assistant.createdAt);
        db.prepare(
          `DELETE FROM coach_messages WHERE user_id = ? AND id NOT IN (
             SELECT id FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?)`,
        ).run(userId, userId, MAX_STORED_MESSAGES);
      });
    },

    getInsight(userId: string, kind: string): CachedInsight | undefined {
      const row = db.prepare('SELECT data, created_at FROM ai_cache WHERE user_id = ? AND kind = ?').get(userId, kind) as
        | { data: string; created_at: number }
        | undefined;
      return row && { ...(JSON.parse(row.data) as Omit<CachedInsight, 'createdAt'>), createdAt: row.created_at };
    },

    putInsight(userId: string, kind: string, insight: Omit<CachedInsight, 'createdAt'>, now: number): void {
      db.prepare(
        `INSERT INTO ai_cache (user_id, kind, data, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, kind) DO UPDATE SET data = excluded.data, created_at = excluded.created_at`,
      ).run(userId, kind, JSON.stringify(insight), now);
    },
  };
}
