import { GoogleGenAI } from '@google/genai';

import { AiProviderError, type AiProvider, type AiRequest } from './provider.js';

export interface GeminiOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

/** Gemini via the official @google/genai SDK. The key stays on the server. */
export function createGeminiProvider({ apiKey, model, timeoutMs }: GeminiOptions): AiProvider {
  const client = new GoogleGenAI({ apiKey });

  return {
    async generate(request: AiRequest): Promise<string> {
      let timer: NodeJS.Timeout | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AiProviderError('Model request timed out')), timeoutMs);
      });
      try {
        const call = client.interactions.create({
          model,
          input: request.prompt,
          system_instruction: request.system,
          // Stateless: the app's own database is the conversation history.
          store: false,
          generation_config: { max_output_tokens: request.maxOutputTokens },
          ...(request.jsonSchema && {
            response_format: { type: 'text', mime_type: 'application/json', schema: request.jsonSchema },
          }),
        });
        const interaction = await Promise.race([call, timeout]);
        const text = interaction.output_text?.trim();
        if (!text) throw new AiProviderError('Model returned no text');
        return text;
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        // Keep only the error class: SDK messages can echo request details.
        throw new AiProviderError(`Gemini request failed (${error instanceof Error ? error.name : 'unknown'})`);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
