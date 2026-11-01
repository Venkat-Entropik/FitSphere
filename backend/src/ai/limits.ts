/** Size limits on what goes into and comes out of the model. */
export const MAX_QUESTION_CHARS = 1000;
export const MAX_REPLY_CHARS = 1500;
export const MAX_INSIGHT_CHARS = 400;
export const MAX_HISTORY_TURNS = 8;
export const MAX_HISTORY_TURN_CHARS = 600;
export const MAX_STORED_MESSAGES = 200;
export const CHAT_MAX_OUTPUT_TOKENS = 900;
export const INSIGHT_MAX_OUTPUT_TOKENS = 200;
/** How long a generated insight is reused (shorter when it came from the rule-based fallback). */
export const INSIGHT_TTL_MS = 30 * 60_000;
export const FALLBACK_TTL_MS = 5 * 60_000;
export const INSIGHT_GENERATIONS_PER_HOUR = 30;
