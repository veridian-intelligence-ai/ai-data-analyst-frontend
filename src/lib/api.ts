/**
 * HTTP client for the AI Data Analyst backend.
 *
 * Error convention: failures throw Error with a MACHINE-READABLE message
 * ('SERVER_ERROR:<status>', 'TIMEOUT', 'AUTH_ERROR:<status>', ...). The UI
 * layer (useChat / pages) translates those codes into friendly copy — keeping
 * user-facing strings out of the transport layer.
 */
import { API_BASE_URL } from './config';
import { getToken } from './session';
import type { LoginResponse } from './session';
import type { AnalystVisual } from '../components/visuals/types';

/**
 * Timeout cascade — each hop must give up BEFORE the hop above it:
 *   LLM call (backend)  ~85s
 *   this client         90s   ← CHAT_TIMEOUT_MS
 *   edge / proxy        ~100s
 * If the client waited longer than the edge, users would see opaque gateway
 * errors instead of our friendly TIMEOUT handling.
 */
const CHAT_TIMEOUT_MS = 90_000;

/** Light endpoints (auth, conversation CRUD) should never take this long. */
const LIGHT_TIMEOUT_MS = 15_000;

/**
 * fetch wrapper: prefixes the API base URL, injects the Bearer token, and
 * enforces a timeout via AbortController (mapped to a 'TIMEOUT' error).
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = LIGHT_TIMEOUT_MS,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login. Throws 'AUTH_ERROR:<status>' so the login page can show
 * distinct messages for 401 (invalid credentials) and 403 (not provisioned).
 */
export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`AUTH_ERROR:${res.status}`);
  const data = (await res.json()) as LoginResponse;
  if (!data?.token) throw new Error('AUTH_INVALID_RESPONSE');
  return data;
}

/**
 * POST /auth/forgot-password. The backend always answers 200 (neutral, to
 * prevent account enumeration), so only transport failures surface — the UI
 * shows one fixed confirmation either way.
 */
export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export type ResetPasswordResult = { ok: true } | { ok: false; status: number };

/**
 * POST /auth/reset-password. Structured result: 400 = invalid/expired token;
 * status 0 = network/transport failure; anything else maps to a generic error.
 */
export async function resetPasswordRequest(
  token: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  let res: Response;
  try {
    res = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  } catch {
    return { ok: false, status: 0 };
  }
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status };
}

/** POST /auth/logout — best-effort server-side invalidation. */
export async function logoutRequest(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Best-effort: local sign-out proceeds even if the server is unreachable.
  }
}

export interface MeResponse {
  email: string;
  name?: string;
}

/** GET /auth/me — validates the stored token at boot. */
export async function meRequest(): Promise<MeResponse> {
  const res = await apiFetch('/auth/me');
  if (!res.ok) throw new Error(`AUTH_ERROR:${res.status}`);
  return (await res.json()) as MeResponse;
}

// ── Chat ────────────────────────────────────────────────────────────────────

export interface ChatResponse {
  session_id: string;
  status: string;
  answer: string;
  response_mode?: 'text' | 'visual' | null;
  visual?: AnalystVisual | null;
  next_step_suggestions?: string[] | null;
  error?: string | null;
}

/** POST /chat — the heavy endpoint; runs the full LLM round-trip. */
export async function postChat(sessionId: string, message: string): Promise<ChatResponse> {
  const res = await apiFetch(
    '/chat',
    {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, message }),
    },
    CHAT_TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`SERVER_ERROR:${res.status}`);

  const data = (await res.json()) as ChatResponse;
  // A structured error with no usable answer is a failure, not a message.
  if (data.error && !data.answer) throw new Error(data.error);
  return data;
}

/** POST /chat/reset — clears server-side context for a session. */
export async function resetChat(sessionId: string): Promise<void> {
  const res = await apiFetch('/chat/reset', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`RESET_ERROR:${res.status}`);
}

// ── Conversations ───────────────────────────────────────────────────────────

export interface ConversationSummary {
  session_id: string;
  title: string;
  updated_at: string;
  created_at?: string;
}

export interface ConversationMessageRow {
  role: string;
  content: string;
  created_at?: string;
}

/** GET /conversations — sidebar listing. Failures degrade to an empty list. */
export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await apiFetch('/conversations');
  if (!res.ok) return [];
  const data = await res.json();
  // Contract: a bare array. Tolerate a { conversations: [...] } wrapper.
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.conversations) ? data.conversations : [];
}

/**
 * GET /conversations/{id}/messages — history, already ordered by the backend.
 * Assistant rows carry the JSON envelope (see lib/messageContent.ts).
 */
export async function fetchConversationMessages(
  sessionId: string,
): Promise<ConversationMessageRow[]> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(sessionId)}/messages`);
  if (!res.ok) throw new Error(`SERVER_ERROR:${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.messages) ? data.messages : [];
}

/** PATCH /conversations/{id}/title */
export async function renameConversationApi(sessionId: string, title: string): Promise<void> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(sessionId)}/title`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`SERVER_ERROR:${res.status}`);
}

/** DELETE /conversations/{id} */
export async function deleteConversationApi(sessionId: string): Promise<void> {
  const res = await apiFetch(`/conversations/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`SERVER_ERROR:${res.status}`);
}
