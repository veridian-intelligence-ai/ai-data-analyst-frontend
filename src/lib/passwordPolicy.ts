/**
 * Client-side validation for the password-reset screen.
 *
 * Returns an error code (mapped to user copy by the page) or `null` when the
 * input is valid. The backend enforces the same 10-character minimum
 * server-side (`_MIN_PASSWORD_CHARS` in `app/auth/router.py`) — this is the
 * matching first-line UX check, extracted as a pure function so the policy is
 * pinned by tests instead of living silently inside page copy. Checks run in
 * priority order: length first, then the confirmation match.
 */
export const MIN_PASSWORD_LENGTH = 10;

export type NewPasswordError = 'minLength' | 'mismatch';

export interface NewPasswordInput {
  next: string;
  confirm: string;
}

export function validateNewPassword({ next, confirm }: NewPasswordInput): NewPasswordError | null {
  if (next.length < MIN_PASSWORD_LENGTH) return 'minLength';
  if (next !== confirm) return 'mismatch';
  return null;
}
