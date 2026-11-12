'use client';

import { useState, useRef, useEffect } from 'react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

interface InlineEditProps {
  value: number | string | null | undefined;
  onSave: (val: number | string | null) => void | Promise<void>;
  type?: 'number' | 'text';
  format?: 'currency' | 'percent' | 'raw';
  step?: string;
  ariaLabel?: string;
  align?: 'left' | 'right';
}

export default function InlineEdit({
  value,
  onSave,
  type = 'number',
  format = 'currency',
  step = '0.01',
  ariaLabel,
  align,
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
  const resolvedAlign = align ?? (type === 'number' ? 'right' : 'left');

  const startEdit = () => {
    if (isValueEmpty) {
      setDraft('');
    } else if (type === 'number' && (format === 'currency' || format === 'percent')) {
      setDraft(Number(value).toFixed(2));
    } else {
      setDraft(String(value));
    }
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
    ? `${Number(value).toFixed(2)}%`
    : String(value);

  const resolvedAria = ariaLabel || `Edit ${isValueEmpty ? (type === 'text' ? 'text value' : 'amount') : display}`;

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
        aria-label={resolvedAria}
        className="inline-edit-input"
        style={{
          fontFamily: type === 'text' ? 'var(--as-font-body)' : 'var(--as-font-mono)',
          fontVariantNumeric: type === 'number' ? 'tabular-nums' : undefined,
          textAlign: resolvedAlign,
          width: type === 'text' ? '160px' : '104px',
          maxWidth: '100%',
        }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      className="inline-edit-trigger"
      style={{
        fontFamily: type === 'number' ? 'var(--as-font-mono)' : 'inherit',
        fontVariantNumeric: type === 'number' ? 'tabular-nums' : undefined,
      }}
      title="Click or press Enter to edit"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEdit();
        }
      }}
      aria-label={resolvedAria}
    >
      {display}
    </span>
  );
}
