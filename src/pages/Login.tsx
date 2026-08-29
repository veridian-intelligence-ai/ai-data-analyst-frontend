import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email.trim() || !password) return;
    setIsSubmitting(true);
    setError(null);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.ok) {
      navigate('/chat', { replace: true });
      return;
    }
    // 401 and 403 get distinct copy: "wrong password" and "no access yet"
    // require different user actions.
    switch (result.code) {
      case 'invalid_credentials':
        setError('Incorrect email or password.');
        break;
      case 'not_provisioned':
        setError('This account has no access yet. Contact your administrator.');
        break;
      default:
        setError('The sign-in service is unavailable right now. Please try again shortly.');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">AI Data Analyst</h1>
        <p className="auth-subtitle">Sign in to chat with your data.</p>

        <label className="auth-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="auth-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="auth-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="auth-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>

        <Link className="auth-link" to="/forgot-password">
          Forgot your password?
        </Link>
      </form>
    </div>
  );
}
