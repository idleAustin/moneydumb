// Floating bottom-center sandbox telemetry and demo data control bar for local development and prototyping.
'use client';

import { useState, useEffect } from 'react';
import { Database, FlaskConical, RotateCcw } from 'lucide-react';
import { fmt } from '../this-month/hooks/useSandboxMonth';

interface PrototypeSwitcherProps {
  paidCount: number;
  totalCount: number;
  safeCash: number;
  memoryOnly: boolean;
  onToggleMemoryOnly: () => void;
  onResetBenchmark: () => void;
}

export default function PrototypeSwitcher({
  paidCount,
  totalCount,
  safeCash,
  memoryOnly,
  onToggleMemoryOnly,
  onResetBenchmark,
}: PrototypeSwitcherProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (!confirmingReset) return;
    const timer = setTimeout(() => setConfirmingReset(false), 3500);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirmingReset(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmingReset]);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Sandbox Telemetry and Demo Controls"
      style={{
        position: 'fixed',
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 240,
        background: 'var(--as-bg-overlay)',
        border: '1px solid var(--as-border-strong)',
        borderRadius: 'var(--as-radius-pill)',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
        maxWidth: '96vw',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--as-font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.72rem',
          color: 'var(--as-text-secondary)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--as-text-tertiary)' }}>Sandbox</span>
        <span aria-hidden="true" style={{ color: 'var(--as-border-strong)' }}>/</span>
        <span>
          Paid:{' '}
          <strong style={{ color: 'var(--as-accent-primary)' }}>
            {paidCount}/{totalCount}
          </strong>
        </span>
        <span aria-hidden="true" style={{ color: 'var(--as-border-strong)' }}>/</span>
        <span>
          Safe:{' '}
          <strong style={{ color: Math.abs(safeCash) < 0.005 ? 'var(--as-text-secondary)' : safeCash < 0 ? 'var(--as-status-error)' : 'var(--as-status-info)' }}>
            {fmt(safeCash)}
          </strong>
        </span>
      </div>

      <button
        type="button"
        className="proto-pill-btn"
        onClick={onToggleMemoryOnly}
        aria-pressed={memoryOnly}
        aria-label={memoryOnly ? 'Switch to Live DB persistence mode' : 'Switch to In-Memory prototype mode'}
        title={memoryOnly ? 'Currently in-memory only. Click to persist to DB.' : 'Currently syncing to DB. Click for in-memory mode.'}
        style={{
          minHeight: 28,
          padding: '0 11px',
          borderRadius: 'var(--as-radius-pill)',
          border: '1px solid var(--as-border-subtle)',
          background: memoryOnly ? 'var(--as-status-warning-bg)' : 'var(--as-status-success-bg)',
          color: memoryOnly ? 'var(--as-status-warning)' : 'var(--as-status-success)',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
          transition: 'background-color var(--as-duration-fast) var(--as-ease-snap), border-color var(--as-duration-fast) var(--as-ease-snap), color var(--as-duration-fast) var(--as-ease-snap)',
        }}
      >
        {memoryOnly ? (
          <FlaskConical size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        ) : (
          <Database size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        )}
        {memoryOnly ? 'Memory Mode' : 'Live DB Sync'}
      </button>

      <button
        type="button"
        className="proto-pill-btn"
        onClick={() => {
          if (!confirmingReset) {
            setConfirmingReset(true);
          } else {
            setConfirmingReset(false);
            onResetBenchmark();
          }
        }}
        aria-label={confirmingReset ? 'Confirm loading benchmark demo dataset' : 'Load benchmark demo dataset in memory'}
        title={confirmingReset ? 'Click again to confirm demo dataset load, or press Escape to cancel' : 'Load benchmark demo dataset'}
        style={{
          minHeight: 28,
          padding: '0 11px',
          borderRadius: 'var(--as-radius-pill)',
          border: confirmingReset ? '1px solid var(--as-status-warning)' : '1px solid var(--as-border-subtle)',
          background: confirmingReset ? 'var(--as-status-warning-bg)' : 'var(--as-bg-surface)',
          color: confirmingReset ? 'var(--as-status-warning)' : 'var(--as-text-secondary)',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
          transition: 'background-color var(--as-duration-fast) var(--as-ease-snap), border-color var(--as-duration-fast) var(--as-ease-snap), color var(--as-duration-fast) var(--as-ease-snap)',
        }}
      >
        <RotateCcw size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        {confirmingReset ? 'Confirm Demo' : 'Demo Data'}
      </button>
    </div>
  );
}
