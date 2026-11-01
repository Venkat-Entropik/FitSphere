import { createHash, randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { createLoginLimiter } from '../auth/rate-limit.js';
import type { Config } from '../config.js';
import { fail, validationFailure } from '../http.js';
import type { AiService } from './ai.service.js';
import type { CoachRepository } from './coach.repository.js';
import { buildCoachContext, dayKey, type CoachContext, type ContextSources } from './context.js';
import { dashboardInsight, nutritionTip, overviewSummary, ruleReply } from './fallback.js';
import {
  FALLBACK_TTL_MS,
  INSIGHT_GENERATIONS_PER_HOUR,
  INSIGHT_TTL_MS,
  MAX_HISTORY_TURN_CHARS,
  MAX_QUESTION_CHARS,
} from './limits.js';
import type { InsightKind } from './prompts.js';
import { id } from '../data/schemas.js';

const sendBody = z
  .object({
    text: z.string().trim().min(1, 'Type a question').max(MAX_QUESTION_CHARS, `Keep your question under ${MAX_QUESTION_CHARS} characters`),
    id: id.optional(),
  })
  .strict();

const GOAL_LABEL: Record<string, string> = {
  muscle: 'Hypertrophy',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance',
  athletic: 'Athletic Performance',
};

const SUGGESTIONS = [
  { id: 'plan', icon: 'event_available', tone: 'lime', text: 'Create my weekly workout plan' },
  { id: 'protein', icon: 'nutrition', tone: 'cyan', text: 'How much protein should I consume today?' },
  { id: 'progress', icon: 'query_stats', tone: 'lime', text: 'Analyze my lifting progression' },
  { id: 'mobility', icon: 'self_improvement', tone: 'violet', text: 'Suggest 15-min recovery mobility' },
] as const;

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export interface CoachDeps {
  config: Config;
  ai: AiService;
  coach: CoachRepository;
  sources: ContextSources;
  now: () => number;
  onProviderError?: (error: unknown) => void;
}

export function registerCoachRoutes(app: FastifyInstance, deps: CoachDeps): void {
  const { ai, coach, sources, now, config } = deps;
  const auth = { preHandler: app.authenticate };
  const chatLimiter = createLoginLimiter(config.AI_CHAT_PER_HOUR, 3600);
  const insightLimiter = createLoginLimiter(INSIGHT_GENERATIONS_PER_HOUR, 3600);

  const context = (userId: string): CoachContext => buildCoachContext(sources, userId, now());

  /** Cached insight text; regenerated when the data changed or the entry is old, within a per-user budget. */
  async function insightText(userId: string, kind: InsightKind, c: CoachContext, rules: (c: CoachContext) => string) {
    const fingerprint = createHash('sha256').update(JSON.stringify(c)).digest('hex').slice(0, 16);
    const at = now();
    const cached = coach.getInsight(userId, kind);
    const ttl = cached?.source === 'ai' ? INSIGHT_TTL_MS : FALLBACK_TTL_MS;
    if (cached && cached.fingerprint === fingerprint && at - cached.createdAt < ttl) return cached;

    if (ai.enabled && insightLimiter.retryAfterSec(userId, at) === 0) {
      insightLimiter.recordFailure(userId, at); // counts every generation attempt
      const text = await ai.insight(kind, c);
      if (text) {
        const fresh = { text, source: 'ai' as const, fingerprint };
        coach.putInsight(userId, kind, fresh, at);
        return { ...fresh, createdAt: at };
      }
    } else if (cached) {
      return cached; // over budget: an older answer beats a new model call
    }
    const fresh = { text: rules(c), source: 'rules' as const, fingerprint };
    coach.putInsight(userId, kind, fresh, at);
    return { ...fresh, createdAt: at };
  }

  app.get('/coach/messages', auth, async (request) => coach.list(request.userId!));

  app.post('/coach/messages', auth, async (request, reply) => {
    const parsed = sendBody.safeParse(request.body);
    if (!parsed.success) return validationFailure(reply, parsed.error);
    const userId = request.userId!;

    const userMessageId = parsed.data.id ?? randomUUID();
    // A retried request returns the stored answer instead of spending another model call.
    const existing = coach.replyFor(userId, userMessageId);
    if (existing) return reply.status(200).send(existing);
    if (coach.userMessageExists(userId, userMessageId)) {
      return fail(reply, 409, 'id_in_use', 'That message id has already been used.');
    }

    const at = now();
    const blocked = chatLimiter.retryAfterSec(userId, at);
    if (blocked > 0) {
      return fail(reply.header('Retry-After', blocked), 429, 'rate_limited', `You have reached the coach message limit. Try again in ${Math.ceil(blocked / 60)} min.`);
    }
    chatLimiter.recordFailure(userId, at); // counts every message

    const c = context(userId);
    const history = coach
      .list(userId, 8)
      .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_HISTORY_TURN_CHARS) }));

    const answer = (await ai.chat(c, history, parsed.data.text)) ?? ruleReply(parsed.data.text, c);

    const user = { id: userMessageId, role: 'user' as const, text: parsed.data.text, createdAt: at };
    const assistant = {
      id: `assistant-${randomUUID()}`,
      role: 'assistant' as const,
      text: answer.text,
      createdAt: now(),
      ...(answer.plan && { plan: answer.plan }),
      showDisclaimer: true,
    };
    coach.saveExchange(userId, user, assistant);
    return reply.status(201).send(assistant);
  });

  app.get('/coach/suggestions', auth, async () => SUGGESTIONS);

  app.get('/coach/overview', auth, async (request) => {
    const userId = request.userId!;
    const c = context(userId);
    const at = now();
    const done = c.week.workouts + c.week.runs;
    const since = c.daysSinceLastSession;
    // Rough estimate from time since the last session; labelled "Estimated" in the response.
    const recovery = since === null ? 100 : since === 0 ? 55 : since === 1 ? 75 : since === 2 ? 90 : 98;
    const change = c.week.prevVolumeKg > 0 ? Math.round(((c.week.volumeKg - c.week.prevVolumeKg) / c.week.prevVolumeKg) * 1000) / 10 : 0;

    const maxLoad = Math.max(...c.week.kcalByDay, 0);
    const days = c.week.kcalByDay.map((load, i) => {
      const ratio = maxLoad > 0 ? Math.max(0.08, Math.round((load / maxLoad) * 100) / 100) : 0.08;
      return {
        label: i === 6 ? 'Today' : WEEKDAY[new Date(at - (6 - i) * 86_400_000).getUTCDay()]!,
        ratio,
        tone: ratio >= 0.6 ? 'lime' : ratio >= 0.3 ? 'cyan' : 'muted',
        isToday: i === 6,
      };
    });
    const top = Object.entries(c.muscleSetsThisWeek).sort((a, b) => b[1] - a[1])[0];

    const summary = await insightText(userId, 'overview', c, overviewSummary);
    return {
      statusLabel: ai.enabled ? 'Active' : 'Rules mode',
      syncLabel: dayKey(at),
      contextChips: [
        { id: 'goal', icon: 'fitness_center', label: `Goal: ${GOAL_LABEL[c.profile.goal] ?? c.profile.goal}`, tone: 'lime' },
        { id: 'weekly', icon: 'calendar_today', label: `Weekly: ${done}/${c.profile.daysPerWeek} Done`, tone: 'cyan' },
        { id: 'recovery', icon: 'vital_signs', label: `Recovery: ${recovery}%`, tone: 'lime' },
        { id: 'weight', icon: 'monitor_weight', label: `Weight: ${c.profile.weightKg} kg`, tone: 'violet' },
      ],
      analysis: {
        windowLabel: recovery >= 85 ? 'Optimal Window' : 'Recovering',
        recoveryPercent: recovery,
        recoveryLabel: 'Estimated Recovery',
        recoveryTarget: recovery >= 85 ? 'Ready' : 'Recovering',
        volumeOverloadPercent: change,
        summary: summary.text,
      },
      strain: {
        title: 'Weekly Strain & Volume Load',
        caption: top ? `${top[0][0]!.toUpperCase()}${top[0].slice(1)} Dominant` : 'No sessions yet',
        days,
      },
    };
  });

  app.get('/insights/dashboard', auth, async (request) => {
    const i = await insightText(request.userId!, 'dashboard', context(request.userId!), dashboardInsight);
    return { suggestion: i.text, source: i.source, disclaimer: DISCLAIMER_TEXT };
  });

  app.get('/insights/nutrition', auth, async (request) => {
    const i = await insightText(request.userId!, 'nutrition', context(request.userId!), nutritionTip);
    return { tip: i.text, source: i.source, disclaimer: DISCLAIMER_TEXT };
  });
}

const DISCLAIMER_TEXT = 'FitSphere gives general fitness guidance, not medical advice.';
