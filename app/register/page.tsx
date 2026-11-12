// Public account registration screen.
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { registerUser } from '@/app/lib/actions';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const isBusy = status === 'loading' || status === 'success';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    try {
      const result = await registerUser(formData);
      if (result?.success) {
        setStatus('success');
        redirectTimerRef.current = setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setStatus('error');
        setErrorMsg(result?.message || 'Could not create account. Choose a different username and retry.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setStatus('error');
      setErrorMsg('Registration service unavailable. Check your connection and retry.');
    }
  }

  return (
    <main id="main-content" className="auth-shell" tabIndex={-1}>
      <header className="auth-header">
        <h1 className="auth-wordmark">MONEY_DUMB</h1>
        <p className="auth-subtitle">Create a workspace account</p>
      </header>

      <section
        className="auth-card"
        aria-label="Create account"
        style={{ padding: 'clamp(20px, 5vw, 40px)' }}
      >
        {status === 'success' && (
          <div className="auth-banner auth-banner-success" role="status" aria-live="polite">
            <CheckCircle2
              size={16}
              strokeWidth={2.0}
              style={{ color: 'var(--as-status-success)', flexShrink: 0, marginTop: 2 }}
              aria-hidden="true"
              focusable="false"
            />
            <span>Account created. Redirecting to sign in...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-banner auth-banner-error" role="alert" aria-live="assertive">
            <AlertCircle
              size={16}
              strokeWidth={2.0}
              style={{ color: 'var(--as-status-error)', flexShrink: 0, marginTop: 2 }}
              aria-hidden="true"
              focusable="false"
            />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="auth-field">
            <label htmlFor="register-username" className="auth-label">
              Username
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              className="auth-input"
              placeholder="alex_stone"
              autoComplete="username"
              minLength={3}
              maxLength={40}
              aria-describedby="register-username-hint"
              required
              disabled={isBusy}
              style={{ fontSize: '1rem' }}
            />
            <p id="register-username-hint" className="auth-hint">
              3 to 40 characters; letters, numbers, or underscores.
            </p>
          </div>

          <div className="auth-field">
            <label htmlFor="register-password" className="auth-label">
              Passcode
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input-password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                aria-describedby="register-password-hint"
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
            <p id="register-password-hint" className="auth-hint">
              Minimum 6 characters; stored as a bcrypt hash.
            </p>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isBusy}
          >
            {status === 'loading' ? (
              <>
                <Loader2
                  size={16}
                  strokeWidth={2.0}
                  className="animate-spin"
                  aria-hidden="true"
                  focusable="false"
                />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/" className="auth-switch-link">
            <ArrowLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Back to sign in</span>
          </Link>
        </div>
      </section>

      <footer className="auth-footer-status">Encrypted session · Self-hosted and cloud workspace</footer>
    </main>
  );
}
