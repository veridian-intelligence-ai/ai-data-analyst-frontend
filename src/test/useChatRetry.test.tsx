import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChat } from '../hooks/useChat';
import * as api from '../lib/api';

vi.mock('../lib/session', () => ({
  getSessionId: () => 'test-session',
  resetSessionId: () => 'rotated-session',
}));

vi.mock('../lib/api', () => ({
  postChat: vi.fn(),
  resetChat: vi.fn().mockResolvedValue(undefined),
  fetchConversations: vi.fn().mockResolvedValue([]),
  fetchConversationMessages: vi.fn().mockResolvedValue([]),
  deleteConversationApi: vi.fn().mockResolvedValue(undefined),
  renameConversationApi: vi.fn().mockResolvedValue(undefined),
}));

const okResponse = (answer: string): api.ChatResponse => ({
  session_id: 'test-session',
  status: 'success',
  answer,
  response_mode: 'text',
  visual: null,
  next_step_suggestions: [],
  error: null,
});

describe('useChat — retry invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchConversations).mockResolvedValue([]);
  });

  it('resends the last question on retry WITHOUT duplicating the user bubble', async () => {
    vi.mocked(api.postChat)
      .mockRejectedValueOnce(new Error('TIMEOUT'))
      .mockResolvedValueOnce(okResponse('Sales were 42k.'));

    const { result } = renderHook(() => useChat());

    // First attempt fails (timeout).
    await act(async () => {
      await result.current.send('What were sales last month?');
    });

    expect(result.current.error).toMatch(/took too long/i);
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    expect(result.current.messages.filter((m) => m.role === 'assistant')).toHaveLength(0);

    // Retry succeeds.
    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.error).toBeNull();
    // THE INVARIANT: still exactly one user bubble — retry must never
    // re-append the question (only `send` appends user messages).
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
    const assistant = result.current.messages.filter((m) => m.role === 'assistant');
    expect(assistant).toHaveLength(1);
    expect(assistant[0].content).toBe('Sales were 42k.');

    expect(vi.mocked(api.postChat)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.postChat)).toHaveBeenLastCalledWith(
      'test-session',
      'What were sales last month?',
    );
  });

  it('retries the most recent user question, not the first', async () => {
    vi.mocked(api.postChat)
      .mockResolvedValueOnce(okResponse('First answer.'))
      .mockRejectedValueOnce(new Error('SERVER_ERROR:502'))
      .mockResolvedValueOnce(okResponse('Second answer.'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send('First question');
    });
    await act(async () => {
      await result.current.send('Second question');
    });
    expect(result.current.error).toMatch(/502/);

    await act(async () => {
      await result.current.retry();
    });

    expect(vi.mocked(api.postChat)).toHaveBeenLastCalledWith('test-session', 'Second question');
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(2);
    expect(result.current.messages.filter((m) => m.role === 'assistant')).toHaveLength(2);
  });

  it('does nothing when there is no user question to retry', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.retry();
    });

    expect(vi.mocked(api.postChat)).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it('ignores sends while a request is already in flight (double-send guard)', async () => {
    let resolveFirst: (value: api.ChatResponse) => void = () => {};
    vi.mocked(api.postChat).mockImplementationOnce(
      () => new Promise<api.ChatResponse>((resolve) => (resolveFirst = resolve)),
    );

    const { result } = renderHook(() => useChat());

    let firstSend: Promise<void>;
    act(() => {
      firstSend = result.current.send('Slow question');
    });
    // Second send while loading must be dropped entirely.
    await act(async () => {
      await result.current.send('Impatient duplicate');
    });

    await act(async () => {
      resolveFirst(okResponse('Done.'));
      await firstSend;
    });

    expect(vi.mocked(api.postChat)).toHaveBeenCalledTimes(1);
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
  });
});
