import { useEffect, useRef, useState } from 'react';
import type { Conversation } from '../hooks/useChat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  userName: string;
  onNewConversation: () => void;
  onSwitch: (sessionId: string) => void;
  onRename: (sessionId: string, title: string) => void;
  onDelete: (sessionId: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  userName,
  onNewConversation,
  onSwitch,
  onRename,
  onDelete,
  onLogout,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) editInputRef.current?.select();
  }, [editingId]);

  const startRename = (conversation: Conversation) => {
    setEditingId(conversation.session_id);
    setDraftTitle(conversation.title);
  };

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    // No-op guard: blurring the edit field without changing anything must not
    // fire a PATCH and a conversations refetch.
    const original = conversations.find((c) => c.session_id === editingId)?.title;
    if (editingId && trimmed && trimmed !== original) {
      onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  const cancelRename = () => setEditingId(null);

  const handleDelete = (conversation: Conversation) => {
    // A destructive click on a 240px-wide row is one slip away — confirm it.
    if (window.confirm(`Delete "${conversation.title || 'Untitled conversation'}"?`)) {
      onDelete(conversation.session_id);
    }
  };

  return (
    <div className="sidebar-inner">
      <div className="sidebar-header">
        <span className="sidebar-brand">AI Data Analyst</span>
      </div>

      <button type="button" className="new-conversation-button" onClick={onNewConversation}>
        + New conversation
      </button>

      <nav className="conversation-list" aria-label="Conversations">
        {conversations.length === 0 && (
          <p className="conversation-empty">No conversations yet.</p>
        )}
        {conversations.map((conversation) => {
          const isActive = conversation.session_id === activeConversationId;
          const isEditing = conversation.session_id === editingId;
          return (
            <div
              key={conversation.session_id}
              className={`conversation-item${isActive ? ' conversation-item-active' : ''}`}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  className="conversation-rename-input"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    else if (e.key === 'Escape') cancelRename();
                  }}
                  aria-label="Conversation title"
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="conversation-title"
                    onClick={() => onSwitch(conversation.session_id)}
                    onDoubleClick={() => startRename(conversation)}
                    title="Double-click to rename"
                  >
                    {conversation.title || 'Untitled conversation'}
                  </button>
                  <button
                    type="button"
                    className="conversation-delete"
                    onClick={() => handleDelete(conversation)}
                    aria-label={`Delete conversation ${conversation.title || 'Untitled'}`}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {userName && <span className="sidebar-user">{userName}</span>}
        <button type="button" className="logout-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
