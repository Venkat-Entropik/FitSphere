import type { Db } from '../db.js';

export type Plan = 'free' | 'pro';

export interface PlanRepository {
  /** The plan in force at `now`: Pro only while it has not expired. */
  planOf(userId: string, now: number): Promise<Plan>;
  /** Messages already used on a day. */
  used(userId: string, day: string): Promise<number>;
  /** Uses one message if the day's limit allows it. Atomic, so parallel requests cannot overshoot. */
  consume(userId: string, day: string, limit: number): Promise<boolean>;
  /** Gives back one message (e.g. when the request failed before an answer was stored). */
  refund(userId: string, day: string): Promise<void>;
  setPlan(email: string, plan: Plan, expiresAt: number | null): Promise<boolean>;
}

export function createPlanRepository(db: Db): PlanRepository {
  return {
    async planOf(userId, now) {
      const row = await db.get<{ plan: string; plan_expires_at: number | null }>(
        'SELECT plan, plan_expires_at FROM users WHERE id = ?',
        [userId],
      );
      if (!row || row.plan !== 'pro') return 'free';
      return row.plan_expires_at === null || row.plan_expires_at > now ? 'pro' : 'free';
    },

    async used(userId, day) {
      const row = await db.get<{ count: number }>(
        'SELECT count FROM coach_usage WHERE user_id = ? AND day = ?',
        [userId, day],
      );
      return row?.count ?? 0;
    },

    async consume(userId, day, limit) {
      const changed = await db.run(
        `INSERT INTO coach_usage (user_id, day, count) VALUES (?, ?, 1)
         ON CONFLICT (user_id, day) DO UPDATE SET count = coach_usage.count + 1
         WHERE coach_usage.count < ?`,
        [userId, day, limit],
      );
      return changed > 0;
    },

    async refund(userId, day) {
      await db.run(
        'UPDATE coach_usage SET count = count - 1 WHERE user_id = ? AND day = ? AND count > 0',
        [userId, day],
      );
    },

    async setPlan(email, plan, expiresAt) {
      const changed = await db.run(
        'UPDATE users SET plan = ?, plan_expires_at = ? WHERE email = ?',
        [plan, plan === 'pro' ? expiresAt : null, email.trim().toLowerCase()],
      );
      return changed > 0;
    },
  };
}
