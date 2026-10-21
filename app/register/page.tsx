'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { registerUser } from '@/app/lib/actions';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('loading');
    setErrorMsg('');

    const result = await registerUser(formData);

    if (result?.success) {
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else {
      setStatus('error');
      setErrorMsg(result?.message || 'Identity configuration failed');
    }
  }

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--as-bg-base)',
        fontFamily: 'var(--as-font-body)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header section */}
      <div style={{ textAlign: 'center', marginBottom: '32px', zIndex: 10 }}>
        <h1 
          style={{
            fontFamily: 'var(--as-font-heading)',
            fontSize: 'clamp(1.75rem, 6vw, 2.25rem)',
            fontWeight: 800,
            color: 'var(--as-text-primary)',
            letterSpacing: '-0.03em',
            margin: 0
          }}
        >
          MONEY_DUMB
        </h1>
        <p 
          style={{
            fontSize: '0.8rem',
            color: 'var(--as-text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: '8px',
            fontWeight: 500,
            fontFamily: 'var(--as-font-mono)'
          }}
        >
          Establish New Security Identity
        </p>
      </div>

      {/* Register Card */}
      <div 
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          padding: 'clamp(20px, 5vw, 40px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          zIndex: 10
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <p 
            style={{ 
              fontSize: '0.8rem', 
              color: 'var(--as-text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              fontWeight: 600,
              fontFamily: 'var(--as-font-mono)',
              margin: 0
            }}
          >
            Create New Identity
          </p>
        </div>

        {/* SUCCESS MESSAGE STATE */}
        {status === 'success' && (
          <div 
            style={{
              marginBottom: '24px',
              backgroundColor: 'var(--as-status-success-bg)',
              border: '1px solid var(--as-status-success)',
              borderRadius: 'var(--as-radius-md)',
              padding: '12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2
              size={16}
              strokeWidth={2.0}
              color="var(--as-status-success)"
              aria-hidden="true"
              focusable="false"
            />
            <p 
              style={{ 
                fontSize: '0.78rem', 
                color: 'var(--as-status-success)', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                margin: 0,
                fontFamily: 'var(--as-font-mono)'
              }}
            >
              Identity Created // Redirecting...
            </p>
          </div>
        )}

        {/* ERROR MESSAGE STATE */}
        {status === 'error' && (
          <div 
            style={{
              marginBottom: '24px',
              backgroundColor: 'var(--as-status-error-bg)',
              border: '1px solid var(--as-status-error)',
              borderRadius: 'var(--as-radius-md)',
              padding: '12px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle
              size={16}
              strokeWidth={2.0}
              color="var(--as-status-error)"
              aria-hidden="true"
              focusable="false"
            />
            <p 
              style={{ 
                fontSize: '0.78rem', 
                color: 'var(--as-status-error)', 
                fontWeight: 600, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                margin: 0,
                fontFamily: 'var(--as-font-mono)'
              }}
            >
              Error: {errorMsg}
            </p>
          </div>
        )}

        {/* Form */}
        <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Identity Name input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label 
              htmlFor="register-username"
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--as-text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                fontWeight: 600 
              }}
            >
              Select Identity ID
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              placeholder="e.g. alex_stone"
              required
              disabled={status === 'success' || status === 'loading'}
              style={{
                width: '100%',
                backgroundColor: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-md)',
                color: 'var(--as-text-primary)',
                padding: '12px 14px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color var(--as-duration-normal) var(--as-ease-snap), box-shadow var(--as-duration-normal) var(--as-ease-snap)',
                opacity: (status === 'success' || status === 'loading') ? 0.6 : 1
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--as-border-focus)';
                e.currentTarget.style.boxShadow = '0 0 0 1px var(--as-accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--as-border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Passcode input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
            <label 
              htmlFor="register-password"
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--as-text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em', 
                fontWeight: 600 
              }}
            >
              Establish Passcode
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={status === 'success' || status === 'loading'}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--as-bg-base)',
                  border: '1px solid var(--as-border-subtle)',
                  borderRadius: 'var(--as-radius-md)',
                  color: 'var(--as-text-primary)',
                  padding: '12px 14px',
                  paddingRight: '48px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color var(--as-duration-normal) var(--as-ease-snap), box-shadow var(--as-duration-normal) var(--as-ease-snap)',
                  opacity: (status === 'success' || status === 'loading') ? 0.6 : 1
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--as-border-focus)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--as-accent-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--as-border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--as-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'color var(--as-duration-fast) var(--as-ease-snap)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--as-text-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--as-text-secondary)';
                }}
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                ) : (
                  <Eye size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                )}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            aria-label={status === 'loading' ? 'Creating identity' : 'Create identity'}
            style={{
              width: '100%',
              backgroundColor: 'var(--as-accent-primary)',
              border: 'none',
              color: 'var(--as-accent-text)',
              padding: '14px',
              borderRadius: 'var(--as-radius-md)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: (status === 'loading' || status === 'success') ? 'not-allowed' : 'pointer',
              transition: 'all var(--as-duration-normal) var(--as-ease-snap)',
              marginTop: '10px',
              boxShadow: '0 0 12px var(--as-accent-glow)',
              opacity: (status === 'loading' || status === 'success') ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (status !== 'loading' && status !== 'success') {
                e.currentTarget.style.backgroundColor = 'var(--as-accent-hover)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 0 16px var(--as-accent-glow)';
              }
            }}
            onMouseOut={(e) => {
              if (status !== 'loading' && status !== 'success') {
                e.currentTarget.style.backgroundColor = 'var(--as-accent-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 12px var(--as-accent-glow)';
              }
            }}
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
              <span>Create Identity</span>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <Link 
            href="/" 
            aria-label="Return to login page"
            style={{
              fontSize: '0.75rem',
              color: 'var(--as-text-muted)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color var(--as-duration-fast) var(--as-ease-snap)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--as-accent-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--as-text-muted)';
            }}
          >
            <ArrowLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Back to Login</span>
          </Link>
        </div>

      </div>

      {/* Page Footer */}
      <div 
        style={{
          marginTop: '24px',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'var(--as-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontWeight: 600,
          fontFamily: 'var(--as-font-mono)'
        }}
      >
        SECURE_CONNECTION // ACTIVE
      </div>

      {/* Inject loader spin style keyframes dynamically */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
