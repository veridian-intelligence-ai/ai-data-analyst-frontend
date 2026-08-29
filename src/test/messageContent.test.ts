import { describe, expect, it } from 'vitest';
import { parseAssistantContent, serializeAssistantContent } from '../lib/messageContent';
import type { AnalystVisual } from '../components/visuals/types';

const sampleVisual: AnalystVisual = {
  visual_type: 'kpi_cards',
  title: 'Monthly overview',
  cards: [
    { label: 'Revenue', value: 125000 },
    { label: 'Orders', value: 840 },
  ],
};

describe('messageContent — envelope roundtrip', () => {
  it('preserves answer, visual, and suggestions through serialize → parse', () => {
    const serialized = serializeAssistantContent({
      message_type: 'assistant_response',
      answer: 'Revenue grew **12%** month over month.',
      response_mode: 'visual',
      visual: sampleVisual,
      next_step_suggestions: ['Break it down by region', 'Compare with last quarter'],
    });

    const parsed = parseAssistantContent(serialized);
    expect(parsed.answer).toBe('Revenue grew **12%** month over month.');
    expect(parsed.visual).toEqual(sampleVisual);
    expect(parsed.nextStepSuggestions).toEqual([
      'Break it down by region',
      'Compare with last quarter',
    ]);
  });

  it('defaults response_mode from the visual and drops the visual for text mode', () => {
    const textOnly = serializeAssistantContent({
      message_type: 'assistant_response',
      answer: 'Plain text answer.',
    });
    expect(parseAssistantContent(textOnly)).toEqual({
      answer: 'Plain text answer.',
      visual: null,
      nextStepSuggestions: undefined,
    });

    // response_mode 'text' wins over an attached visual.
    const textMode = serializeAssistantContent({
      message_type: 'assistant_response',
      answer: 'Answer.',
      response_mode: 'text',
      visual: sampleVisual,
    });
    expect(parseAssistantContent(textMode).visual).toBeNull();
  });

  it('passes plain-text (legacy) messages through untouched', () => {
    expect(parseAssistantContent('Just a normal sentence.')).toEqual({
      answer: 'Just a normal sentence.',
      visual: null,
    });
  });
});

describe('messageContent — garbage in renders empty, never raw JSON', () => {
  it('renders empty for valid JSON without a usable answer', () => {
    const parsed = parseAssistantContent('{"message_type":"assistant_response","answer":""}');
    expect(parsed.answer).toBe('');
    expect(parsed.visual).toBeNull();
  });

  it('renders empty for truncated/broken envelope JSON', () => {
    // Looks like a serialized envelope but fails JSON.parse — the raw string
    // must never reach the screen.
    const broken = '{"message_type":"assistant_response","answer":"Revenue gr';
    expect(parseAssistantContent(broken).answer).toBe('');
  });

  it('renders empty for envelope-looking text that is not JSON at all', () => {
    const leaked = 'some prefix "message_type": "assistant_response" some suffix';
    expect(parseAssistantContent(leaked).answer).toBe('');
  });

  it('renders empty for empty input', () => {
    expect(parseAssistantContent('')).toEqual({ answer: '', visual: null });
  });
});
