/**
 * The assistant message envelope.
 *
 * Assistant turns are persisted as a JSON envelope so visuals and suggestions
 * survive a reload — the plain `answer` string alone cannot carry them.
 *
 * HARD RULE: never render raw JSON to the user. In the source system a
 * half-migrated database left some rows as serialized envelopes that failed
 * to parse, and the UI printed `{"message_type": ...}` blobs into the chat.
 * The defensive tail of parseAssistantContent exists because of that bug:
 * if a string *looks* like a serialized envelope but did not parse, we render
 * an empty string rather than the raw object.
 */
import type { AnalystVisual } from '../components/visuals/types';

export interface AssistantEnvelope {
  message_type: 'assistant_response';
  answer: string;
  response_mode?: 'text' | 'visual';
  visual?: AnalystVisual | null;
  next_step_suggestions?: string[];
  error?: string | null;
}

export interface ParsedAssistantMessage {
  answer: string;
  visual: AnalystVisual | null;
  nextStepSuggestions?: string[];
}

/**
 * Parse an assistant message as stored by the backend. Accepts both the JSON
 * envelope and legacy plain text; never lets raw JSON through to the UI.
 */
export function parseAssistantContent(raw: string): ParsedAssistantMessage {
  if (!raw) {
    return { answer: '', visual: null };
  }
  const trimmed = raw.trim();

  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Partial<AssistantEnvelope>;
      if (obj && typeof obj.answer === 'string' && obj.answer.trim()) {
        const visual =
          obj.response_mode === 'visual' && obj.visual ? (obj.visual as AnalystVisual) : null;
        return {
          answer: obj.answer,
          visual,
          nextStepSuggestions:
            Array.isArray(obj.next_step_suggestions) && obj.next_step_suggestions.length > 0
              ? obj.next_step_suggestions.filter((s): s is string => typeof s === 'string')
              : undefined,
        };
      }
      // Valid JSON but no usable answer — show nothing rather than raw JSON.
      return { answer: '', visual: null };
    } catch {
      // Not valid JSON despite the '{' — fall through to the plain-text path,
      // which has its own raw-JSON guard.
    }
  }

  // Plain-text fallback. If the content still looks like a serialized
  // envelope (e.g. truncated JSON), hide it — an empty bubble beats a JSON
  // blob in the chat (see module comment).
  if (trimmed.includes('"message_type"') || trimmed.includes('"answer"')) {
    return { answer: '', visual: null };
  }

  return { answer: raw, visual: null };
}

/**
 * Serialize an assistant response into the envelope the backend persists,
 * so future reloads rehydrate visuals + suggestions via parseAssistantContent.
 */
export function serializeAssistantContent(payload: AssistantEnvelope): string {
  return JSON.stringify({
    message_type: 'assistant_response',
    answer: payload.answer,
    response_mode: payload.response_mode ?? (payload.visual ? 'visual' : 'text'),
    visual: payload.visual ?? null,
    next_step_suggestions: payload.next_step_suggestions ?? [],
    error: payload.error ?? null,
  });
}
