import { useEffect, useRef } from 'react';
import type { Message } from '../hooks/useChat';
import { ChatMessage, TypingIndicator } from './ChatMessage';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSendQuery: (query: string) => void;
}

export function ChatArea({ messages, isLoading, error, onRetry, onSendQuery }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message (and to the typing indicator / error).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading, error]);

  // Retry re-sends the last user question, so the button is only meaningful
  // when a user message exists (e.g. not after a failed history load).
  const hasUserMessage = messages.some((m) => m.role === 'user');

  return (
    <div className="chat-scroll">
      <div className="chat-column">
        {messages.length === 0 && !isLoading && !error && (
          <div className="empty-state">
            <h2>AI Data Analyst</h2>
            <p>
              Ask questions about your business data in plain English — answers come back as text,
              KPIs, charts, and tables.
            </p>
            <p className="empty-state-hint">Try: “What were our top products by revenue last month?”</p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onSendQuery={onSendQuery} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div className="error-card" role="alert">
            <p className="error-card-text">{error}</p>
            {hasUserMessage && (
              <button type="button" className="error-retry-button" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
