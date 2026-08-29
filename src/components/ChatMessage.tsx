import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../hooks/useChat';
import { VisualRenderer } from './visuals/VisualRenderer';

// Links in model-generated markdown open in a new tab and sever the opener
// relationship: an in-tab navigation would drop the user's conversation, and
// rel="noopener noreferrer" blocks reverse-tabnabbing from whatever the model
// linked to.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  ),
};

// ── Typewriter ──────────────────────────────────────────────────────────────

interface TypewriterMarkdownProps {
  text: string;
  /** When false the full text renders immediately (history rehydration). */
  enabled: boolean;
  onDone?: () => void;
}

const TYPE_CHARS_PER_TICK = 3;
const TYPE_TICK_MS = 16;

/**
 * Reveals assistant markdown progressively. Only ever enabled for
 * `message.isNew` — reloaded history must render instantly, or every page
 * refresh would replay the whole conversation letter by letter.
 */
function TypewriterMarkdown({ text, enabled, onDone }: TypewriterMarkdownProps) {
  const [visibleChars, setVisibleChars] = useState(enabled ? 0 : text.length);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setVisibleChars(text.length);
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + TYPE_CHARS_PER_TICK, text.length);
      setVisibleChars(i);
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, TYPE_TICK_MS);
    return () => clearInterval(id);
    // Intentionally run once per message: text is immutable after append.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTyping = enabled && visibleChars < text.length;

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {text.slice(0, visibleChars)}
      </ReactMarkdown>
      {isTyping && <span className="typing-caret" />}
    </div>
  );
}

// ── Message bubble ──────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: Message;
  onSendQuery?: (query: string) => void;
}

export function ChatMessage({ message, onSendQuery }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const useTypewriter = !isUser && message.isNew === true;
  const [typingDone, setTypingDone] = useState(!useTypewriter);

  if (isUser) {
    return (
      <div className="message-row message-row-user">
        <div className="bubble bubble-user">{message.content}</div>
      </div>
    );
  }

  // Staged reveal: the visual and the suggestion chips only mount AFTER the
  // typewriter finishes. Mounting a 260px chart mid-typing thrashes layout —
  // the page jumps while text is still streaming in. History (no typewriter)
  // reveals everything immediately.
  const revealExtras = !useTypewriter || typingDone;
  const suggestions = message.nextStepSuggestions ?? [];

  return (
    <div className="message-row message-row-assistant">
      <div className="bubble bubble-assistant">
        <div className="assistant-name">Analyst</div>
        <TypewriterMarkdown
          text={message.content}
          enabled={useTypewriter}
          onDone={() => setTypingDone(true)}
        />
        {revealExtras && <VisualRenderer visual={message.visual} />}
        {revealExtras && suggestions.length > 0 && onSendQuery && (
          <div className="suggestions">
            <p className="suggestions-label">Suggested next steps</p>
            <div className="suggestions-chips">
              {suggestions.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => onSendQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Animated three-dot indicator shown while the analysis runs. */
export function TypingIndicator() {
  return (
    <div className="message-row message-row-assistant">
      <div className="bubble bubble-assistant">
        <div className="assistant-name">Analyst</div>
        <div className="typing-dots" aria-label="The analyst is thinking">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
