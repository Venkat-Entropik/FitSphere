/** What the coach needs from a language model. Providers are interchangeable behind this. */
export interface AiRequest {
  /** Trusted instructions: role, rules, safety. Never contains user-written text. */
  system: string;
  /** The task plus the user's data and message, clearly delimited as data. */
  prompt: string;
  /** JSON Schema the reply must follow; omit for free text. */
  jsonSchema?: Record<string, unknown>;
  maxOutputTokens: number;
}

export interface AiProvider {
  /** Returns the model's raw text. Throws on any failure (network, quota, safety block, empty reply). */
  generate(request: AiRequest): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProviderError';
  }
}
