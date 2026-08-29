import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordRequest } from '../lib/api';
import { MIN_PASSWORD_LENGTH, validateNewPassword } from '../lib/passwordPolicy';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    // Local validation first — no round-trip for obviously invalid input.
    // The policy lives in lib/passwordPolicy.ts (pure, unit-tested) so the
    // minimum cannot silently drift from the backend's server-side check.
    const validationError = validateNewPassword({ next: password, confirm });
    if (validationError === 'minLength') {
      setError(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (validationError === 'mismatch') {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPasswordRequest(token, password);
    setIsSubmitting(false);

    if (result.ok) {
      setDone(true);
      return;
    }
    if (result.status === 400) {
      setError('This reset link is invalid or has expired. Request a new one.');
    } else if (result.status === 0) {
      setError('Could not reach the server. Check your connection and try again.');
    } else {
      setError('The password could not be reset right now. Please try again shortly.');
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Invalid link</h1>
          <p className="auth-subtitle">
            This page needs the reset token from your email link. Request a new link to continue.
          </p>
          <Link className="auth-link" to="/forgot-password">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Password updated</h1>
          <p className="auth-subtitle">You can now sign in with your new password.</p>
          <Link className="auth-link" to="/login">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Choose a new password</h1>
        <p className="auth-subtitle">At least {MIN_PASSWORD_LENGTH} characters.</p>

        <label className="auth-label" htmlFor="reset-password">
          New password
        </label>
        <input
          id="reset-password"
          className="auth-input"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="auth-label" htmlFor="reset-confirm">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          className="auth-input"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Set new password'}
        </button>

        <Link className="auth-link" to="/login">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
