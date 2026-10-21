'use client';

import { useState, useRef, useEffect } from 'react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);

interface InlineEditProps {
  value: number | string | null | undefined;
  onSave: (val: number | string | null) => void | Promise<void>;
  type?: 'number' | 'text';
  format?: 'currency' | 'percent' | 'raw';
  step?: string;
}

export default function InlineEdit({
  value,
  onSave,
  type = 'number',
  format = 'currency',
  step = '0.01',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const isValueEmpty = value === null || value === undefined || value === '';

  const startEdit = () => {
    setDraft(isValueEmpty ? '' : String(value));
    setEditing(true);
  };

  const save = () => {
    if (draft.trim() === '') {
      onSave(type === 'number' ? null : '');
      setEditing(false);
      return;
    }
    const parsed = type === 'number' ? parseFloat(draft) : draft;
    if (type === 'number' && typeof parsed === 'number' && isNaN(parsed)) {
      setEditing(false);
      return;
    }
    onSave(parsed);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const display = isValueEmpty
    ? '—'
    : format === 'currency'
    ? fmt(Number(value))
    : format === 'percent'
    ? `${value}%`
    : String(value);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        step={type === 'number' ? step : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') cancel();
        }}
        aria-label={type === 'text' ? 'Edit text value' : 'Edit numeric value'}
        style={{
          background: 'var(--as-bg-base)',
          border: '1px solid var(--as-accent-primary)',
          borderRadius: 'var(--as-radius-sm)',
          color: 'var(--as-text-primary)',
          fontFamily: type === 'text' ? 'var(--as-font-body)' : 'var(--as-font-mono)',
          fontSize: '0.85rem',
          padding: '4px 8px',
          width: type === 'text' ? '160px' : '100px',
          outline: 'none',
          boxShadow: '0 0 0 2px var(--as-accent-muted)',
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      style={{
        cursor: 'pointer',
        fontFamily: type === 'number' ? 'var(--as-font-mono)' : 'inherit',
      }}
      title="Click to edit"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEdit();
        }
      }}
      aria-label={type === 'text' ? 'Click to edit text' : 'Click to edit numeric value'}
    >
      {display}
    </span>
  );
}
