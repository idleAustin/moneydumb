// Public authentication and instant sandbox launch screen.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, Loader2, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { authenticate, loginDemoUser } from '@/app/lib/actions';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isBusy = loadingDemo || loadingAuth;

  const handleDemoClick = async () => {
    setLoadingDemo(true);
    setErrorMessage('');
    try {
      const res = await loginDemoUser();
      if (res?.success) {
        window.location.href = '/dashboard/this-month';
      } else {
        setErrorMessage(res?.message || 'Sandbox initialization failed. Try again or sign in with credentials.');
        setLoadingDemo(false);
      }
    } catch (err) {
      console.error('Sandbox error:', err);
      setErrorMessage('Sandbox session could not start. Verify the local server is running and retry.');
      setLoadingDemo(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingAuth(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    try {
      const res = await authenticate(formData);
      if (res?.success) {
        window.location.href = '/dashboard/this-month';
      } else {
        setErrorMessage(res?.message || 'Username or passcode did not match an existing identity.');
        setLoadingAuth(false);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage('Authentication service unavailable. Check your connection and retry.');
      setLoadingAuth(false);
    }
  };

  return (
    <main id="main-content" className="auth-shell" tabIndex={-1}>
      <header className="auth-header">
        <h1 className="auth-wordmark">MONEY_DUMB</h1>
        <p className="auth-subtitle">Cash-flow and debt-payoff command center</p>
      </header>

      <section
        className="auth-card"
        aria-label="Sign in or launch sandbox"
        style={{ padding: 'clamp(20px, 5vw, 40px)' }}
      >
        <div className="auth-sandbox-block">
          <p className="auth-sandbox-caption">
            Explore a preloaded 38-bill monthly ledger without creating an account.
          </p>
          <button
            type="button"
            className="auth-sandbox-btn"
            onClick={handleDemoClick}
            disabled={isBusy}
          >
            {loadingDemo ? (
              <>
                <Loader2
                  size={16}
                  strokeWidth={2.0}
                  className="animate-spin"
                  aria-hidden="true"
                  focusable="false"
                />
                <span>Initializing Sandbox...</span>
              </>
            ) : (
              <>
                <Compass size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                <span>Enter Sandbox Mode</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="auth-banner auth-banner-error" role="alert" aria-live="assertive">
            <AlertCircle
              size={16}
              strokeWidth={2.0}
              style={{ color: 'var(--as-status-error)', flexShrink: 0, marginTop: 2 }}
              aria-hidden="true"
              focusable="false"
            />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="auth-field">
            <label htmlFor="login-username" className="auth-label">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              className="auth-input"
              placeholder="alex_stone"
              autoComplete="username"
              required
              disabled={isBusy}
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">
              Passcode
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input-password"
                placeholder="Enter passcode"
                autoComplete="current-password"
                required
                disabled={isBusy}
                style={{ fontSize: '1rem' }}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                aria-pressed={showPassword}
                disabled={isBusy}
                style={{ width: '44px', height: '44px' }}
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                ) : (
                  <Eye size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isBusy}
          >
            {loadingAuth ? (
              <>
                <Loader2
                  size={16}
                  strokeWidth={2.0}
                  className="animate-spin"
                  aria-hidden="true"
                  focusable="false"
                />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/register" className="auth-switch-link">
            <span>Create an account</span>
            <ArrowRight size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </Link>
        </div>
      </section>

      <footer className="auth-footer-status">Encrypted session · Self-hosted and cloud workspace</footer>
    </main>
  );
}
