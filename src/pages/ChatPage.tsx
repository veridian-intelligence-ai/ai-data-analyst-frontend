import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { Sidebar } from '../components/Sidebar';
import { ChatArea } from '../components/ChatArea';
import { ChatInput } from '../components/ChatInput';

export function ChatPage() {
  const { userName, logout } = useAuth();
  const navigate = useNavigate();
  const chat = useChat();

  // Mobile: the sidebar is an overlay toggled from the header; on desktop it
  // is a fixed column (see styles.css media queries).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="chat-page">
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <Sidebar
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          userName={userName}
          onNewConversation={() => {
            chat.newConversation();
            closeSidebar();
          }}
          onSwitch={(id) => {
            chat.switchConversation(id);
            closeSidebar();
          }}
          onRename={chat.renameConversation}
          onDelete={chat.removeConversation}
          onLogout={handleLogout}
        />
      </aside>
      {/* Backdrop closes the overlay sidebar on mobile. */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <main className="chat-main">
        <header className="chat-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle conversation list"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M2 4.5h14M2 9h14M2 13.5h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="chat-header-title">AI Data Analyst</span>
          {chat.messages.length > 0 && (
            <button
              type="button"
              className="chat-clear-button"
              onClick={() => {
                // Destructive and irreversible server-side — confirm first.
                if (window.confirm('Clear this conversation?')) chat.clear();
              }}
              disabled={chat.isLoading}
            >
              Clear
            </button>
          )}
        </header>

        <ChatArea
          messages={chat.messages}
          isLoading={chat.isLoading}
          error={chat.error}
          onRetry={chat.retry}
          onSendQuery={chat.send}
        />

        <ChatInput onSend={chat.send} isLoading={chat.isLoading} />
      </main>
    </div>
  );
}
