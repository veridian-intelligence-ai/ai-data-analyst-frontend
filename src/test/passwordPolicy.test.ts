import { describe, it, expect } from 'vitest';
import { validateNewPassword, MIN_PASSWORD_LENGTH } from '../lib/passwordPolicy';

describe('validateNewPassword', () => {
  it('accepts a 10+ character matching password', () => {
    expect(validateNewPassword({ next: 'abcdefghij', confirm: 'abcdefghij' })).toBeNull();
  });

  it('rejects a password shorter than 10 characters', () => {
    expect(validateNewPassword({ next: 'short1', confirm: 'short1' })).toBe('minLength');
  });

  it('rejects when the confirmation does not match', () => {
    expect(validateNewPassword({ next: 'abcdefghij', confirm: 'abcdefghik' })).toBe('mismatch');
  });

  it('checks length before the mismatch rule', () => {
    expect(validateNewPassword({ next: 'short', confirm: 'different' })).toBe('minLength');
  });

  it('pins the minimum at 10 — must match the backend policy', () => {
    // Change this only together with _MIN_PASSWORD_CHARS in the backend's
    // app/auth/router.py; a mismatch means the UX check and the server
    // disagree about what a valid password is.
    expect(MIN_PASSWORD_LENGTH).toBe(10);
  });
});
