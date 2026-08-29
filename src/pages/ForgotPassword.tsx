import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../lib/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await forgotPasswordRequest(email.trim());
      // The backend answers 200 whether or not the account exists (no account
      // enumeration), so this confirmation is deliberately unconditional.
      setSubmitted(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {submitted ? (
        <div className="auth-card">
          <h1 className="auth-title">Check your inbox</h1>
          <p className="auth-subtitle">
            If an account exists for {email.trim()}, a password reset link is on its way.
          </p>
          <Link className="auth-link" to="/login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="auth-title">Reset your password</h1>
          <p className="auth-subtitle">
            Enter your email and we will send you a link to reset your password.
          </p>

          <label className="auth-label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>

          <Link className="auth-link" to="/login">
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
