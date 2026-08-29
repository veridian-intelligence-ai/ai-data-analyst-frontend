/**
 * Local session storage: auth token + chat session id.
 *
 * All keys are prefixed 'analyst_' so this app never collides with other
 * apps on the same origin during development.
 */

const KEYS = {
  token: 'analyst_token',
  expiresAt: 'analyst_expires_at',
  userName: 'analyst_user_name',
  sessionId: 'analyst_session_id',
} as const;

export interface LoginResponse {
  token: string;
  expires_at?: string | number;
  user?: { email?: string; name?: string };
}

export interface StoredSession {
  token: string;
  expiresAt: number; // epoch milliseconds
  userName: string;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Normalize `expires_at` to epoch milliseconds. Backends have historically
 * sent all three of: epoch seconds, epoch milliseconds, and ISO-8601 strings —
 * accept them all rather than betting on one.
 */
export function parseExpiresAt(value?: string | number | null): number {
  if (value === undefined || value === null || value === '') {
    return Date.now() + DEFAULT_TTL_MS;
  }
  if (typeof value === 'number') {
    // Anything below 1e12 cannot be a recent epoch-ms timestamp — treat as seconds.
    return value < 1e12 ? value * 1000 : value;
  }
  const asNum = Number(value);
  if (!Number.isNaN(asNum)) {
    return asNum < 1e12 ? asNum * 1000 : asNum;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() + DEFAULT_TTL_MS : parsed;
}

export function saveSession(data: LoginResponse): StoredSession {
  const expiresAt = parseExpiresAt(data.expires_at);
  const userName = data.user?.name ?? data.user?.email ?? '';
  localStorage.setItem(KEYS.token, data.token);
  localStorage.setItem(KEYS.expiresAt, String(expiresAt));
  localStorage.setItem(KEYS.userName, userName);
  return { token: data.token, expiresAt, userName };
}

export function getSession(): StoredSession | null {
  const token = localStorage.getItem(KEYS.token);
  const expiresAtRaw = localStorage.getItem(KEYS.expiresAt);
  if (!token || !expiresAtRaw) return null;
  return {
    token,
    expiresAt: Number(expiresAtRaw),
    userName: localStorage.getItem(KEYS.userName) ?? '',
  };
}

export function isSessionValid(session: StoredSession | null = getSession()): boolean {
  if (!session) return false;
  return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
}

export function getToken(): string | null {
  const session = getSession();
  return isSessionValid(session) ? session!.token : null;
}

export function getUserName(): string {
  return getSession()?.userName ?? '';
}

/** Clears auth state. The chat session id survives — it names a conversation, not a login. */
export function clearSession(): void {
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.expiresAt);
  localStorage.removeItem(KEYS.userName);
}

/** Current chat session id (one per conversation), creating one on first use. */
export function getSessionId(): string {
  const existing = localStorage.getItem(KEYS.sessionId);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(KEYS.sessionId, created);
  return created;
}

/** Rotates the chat session id — used when starting a new conversation. */
export function resetSessionId(): string {
  const created = crypto.randomUUID();
  localStorage.setItem(KEYS.sessionId, created);
  return created;
}
