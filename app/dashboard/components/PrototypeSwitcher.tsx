// Floating bottom-center sandbox telemetry and demo data control bar for local development and prototyping.
'use client';

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
        border: '1px solid var(--as-border-focus)',
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
          fontSize: '0.7rem',
          color: 'var(--as-text-secondary)',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: 'var(--as-text-muted)' }}>Sandbox Controls</span>
        <span>•</span>
        <span>
          Paid: <strong style={{ color: 'var(--as-accent-primary)' }}>{paidCount}/{totalCount}</strong>
        </span>
        <span>•</span>
        <span>
          Safe: <strong style={{ color: 'var(--as-status-info)' }}>{fmt(safeCash)}</strong>
        </span>
      </div>

      <button
        onClick={onToggleMemoryOnly}
        aria-label={memoryOnly ? 'Switch to Live DB persistence mode' : 'Switch to In-Memory prototype mode'}
        title={memoryOnly ? 'Currently in-memory only. Click to persist to DB.' : 'Currently syncing to DB. Click for in-memory mode.'}
        style={{
          padding: '4px 10px',
          borderRadius: 'var(--as-radius-pill)',
          border: '1px solid var(--as-border-subtle)',
          background: memoryOnly ? 'var(--as-status-warning-bg)' : 'var(--as-status-success-bg)',
          color: memoryOnly ? 'var(--as-status-warning)' : 'var(--as-status-success)',
          fontSize: '0.68rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
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
        onClick={onResetBenchmark}
        aria-label="Load benchmark demo dataset in memory"
        title="Load benchmark demo dataset"
        style={{
          padding: '4px 9px',
          borderRadius: 'var(--as-radius-pill)',
          border: '1px solid var(--as-border-subtle)',
          background: 'var(--as-bg-surface)',
          color: 'var(--as-text-secondary)',
          fontSize: '0.68rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        <RotateCcw size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        Demo Data
      </button>
    </div>
  );
}
