import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteConversationApi,
  fetchConversationMessages,
  fetchConversations,
  postChat,
  renameConversationApi,
  resetChat,
  type ConversationSummary,
} from '../lib/api';
import { parseAssistantContent } from '../lib/messageContent';
import { getSessionId, resetSessionId } from '../lib/session';
import type { AnalystVisual } from '../components/visuals/types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visual?: AnalystVisual | null;
  nextStepSuggestions?: string[];
  /**
   * True only for assistant messages appended live in this browser session.
   * Drives the typewriter effect — rehydrated history renders instantly.
   */
  isNew?: boolean;
}

export type Conversation = ConversationSummary;

/** Message ids need no cryptographic strength; fall back when the API is absent. */
function makeMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Machine error codes (lib/api.ts convention) → user-facing English copy. */
function translateError(msg: string): string {
  if (msg === 'TIMEOUT') {
    return 'The analysis took too long to respond. Please try again.';
  }
  if (msg.startsWith('SERVER_ERROR:')) {
    return `The server could not process the request (code ${msg.split(':')[1]}). Please try again.`;
  }
  if (msg.startsWith('RESET_ERROR:')) {
    return `The conversation could not be reset (code ${msg.split(':')[1]}).`;
  }
  return 'Something went wrong while contacting the server. Check your connection and try again.';
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => getSessionId());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // The session id the *next* request should use. A ref (not state) so that
  // in-flight callbacks always see the latest value.
  const sessionIdRef = useRef(sessionId);

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await fetchConversations());
    } catch {
      // Sidebar listing is non-critical; keep the last known list.
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  /**
   * Runs the assistant round-trip for an already-known question. Shared by
   * `send` (first attempt) and `retry` (re-attempt). THE INVARIANT: only
   * `send` appends the user bubble — so retrying a failed question never
   * duplicates it; the question is already the last user message on screen.
   */
  const runQuery = useCallback(
    async (text: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await postChat(sessionIdRef.current, text);

        // The live response may or may not be enveloped — parse defensively
        // and fall back to the raw answer for plain text.
        const parsed = parseAssistantContent(data.answer);
        const assistantMessage: Message = {
          id: makeMessageId(),
          role: 'assistant',
          content: parsed.answer || data.answer,
          timestamp: new Date(),
          visual: data.visual ?? parsed.visual ?? null,
          nextStepSuggestions: data.next_step_suggestions ?? parsed.nextStepSuggestions,
          isNew: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setActiveConversationId(sessionIdRef.current);
        refreshConversations();
      } catch (e) {
        setError(translateError(e instanceof Error ? e.message : 'UNKNOWN'));
      } finally {
        setIsLoading(false);
      }
    },
    [refreshConversations],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      // Guard against double-send: ignore submits while a request is in flight.
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: makeMessageId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      await runQuery(trimmed);
    },
    [isLoading, runQuery],
  );

  /**
   * Re-sends the last user question (e.g. after a timeout) without making the
   * user retype it — and WITHOUT appending a duplicate user bubble.
   */
  const retry = useCallback(async () => {
    if (isLoading) return;
    let lastQuestion: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastQuestion = messages[i].content;
        break;
      }
    }
    if (!lastQuestion) return;
    await runQuery(lastQuestion);
  }, [isLoading, messages, runQuery]);

  /** Starts a fresh conversation by rotating the session id. */
  const newConversation = useCallback(() => {
    const newId = resetSessionId();
    sessionIdRef.current = newId;
    setSessionId(newId);
    setMessages([]);
    setError(null);
    setActiveConversationId(null);
  }, []);

  /**
   * Loads a past conversation. History is rehydrated through the envelope
   * parser so visuals and suggestion chips survive a reload — and `isNew`
   * stays unset so history renders instantly (no typewriter).
   */
  const switchConversation = useCallback(
    async (targetSessionId: string) => {
      if (targetSessionId === sessionIdRef.current && activeConversationId === targetSessionId) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const history = await fetchConversationMessages(targetSessionId);
        const rebuilt: Message[] = history.map((row) => {
          const timestamp = row.created_at ? new Date(row.created_at) : new Date();
          if (row.role === 'assistant') {
            const parsed = parseAssistantContent(row.content);
            return {
              id: makeMessageId(),
              role: 'assistant' as const,
              content: parsed.answer,
              timestamp,
              visual: parsed.visual,
              nextStepSuggestions: parsed.nextStepSuggestions,
            };
          }
          return {
            id: makeMessageId(),
            role: 'user' as const,
            content: row.content,
            timestamp,
          };
        });

        sessionIdRef.current = targetSessionId;
        setSessionId(targetSessionId);
        setMessages(rebuilt);
        setActiveConversationId(targetSessionId);
      } catch (e) {
        setError(translateError(e instanceof Error ? e.message : 'UNKNOWN'));
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId],
  );

  const removeConversation = useCallback(
    async (targetSessionId: string) => {
      try {
        await deleteConversationApi(targetSessionId);
      } catch {
        // Best-effort; the refresh below reconciles with the server.
      }
      await refreshConversations();
      // Deleting the open conversation also clears the screen and rotates ids.
      if (targetSessionId === activeConversationId || targetSessionId === sessionIdRef.current) {
        newConversation();
      }
    },
    [activeConversationId, newConversation, refreshConversations],
  );

  const renameConversation = useCallback(
    async (targetSessionId: string, newTitle: string) => {
      const title = newTitle.trim();
      if (!title) return;
      try {
        await renameConversationApi(targetSessionId, title);
        await refreshConversations();
      } catch {
        // Rename is cosmetic; a failure just keeps the old title.
      }
    },
    [refreshConversations],
  );

  /** Clears the current conversation's server-side context and the screen. */
  const clear = useCallback(async () => {
    try {
      await resetChat(sessionIdRef.current);
    } catch {
      // Local clear proceeds regardless.
    }
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    retry,
    clear,
    newConversation,
    conversations,
    activeConversationId,
    switchConversation,
    removeConversation,
    renameConversation,
    sessionId,
  };
}
