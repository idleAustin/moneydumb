'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

interface DeleteButtonProps {
  onDelete: () => void | Promise<void>;
  label?: React.ReactNode;
  className?: string;
  countdown?: number;
  ariaLabel?: string;
}

export default function DeleteButton({
  onDelete,
  label = 'Delete',
  className = 'btn btn-danger btn-small',
  countdown = 3,
  ariaLabel,
}: DeleteButtonProps) {
  const [state, setState] = useState<'idle' | 'counting' | 'deleting'>('idle');
  const [count, setCount] = useState(countdown);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (state === 'idle') {
      setState('counting');
      setCount(countdown);
      timerRef.current = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setState('deleting');
            Promise.resolve(onDelete())
              .catch((err) => {
                console.error('Delete action failed:', err);
              })
              .finally(() => {
                setState('idle');
              });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (state === 'counting') {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setState('deleting');
      try {
        await onDelete();
      } catch (err) {
        console.error(err);
      }
      setState('idle');
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setState('idle');
    setCount(countdown);
  };

  const defaultAria = typeof label === 'string' && label !== '×' ? label : 'Delete item';
  const resolvedAria = ariaLabel || defaultAria;

  if (state === 'deleting') {
    return (
      <button
        type="button"
        className={className}
        disabled
        aria-label="Deleting item"
        style={{
          opacity: 0.5,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'not-allowed',
        }}
      >
        <Loader2 size={13} strokeWidth={2.0} className="animate-spin" aria-hidden="true" focusable="false" />
        <span>...</span>
      </button>
    );
  }

  if (state === 'counting') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <div className="tooltip-wrapper">
          <button
            type="button"
            className={className}
            onClick={handleClick}
            aria-label={`Confirm delete in ${count} seconds`}
            style={{
              animation: 'pulse 0.6s ease-in-out infinite',
              minWidth: 64,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <span>{count}s</span>
            <Check size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          <div className="tooltip-bubble" role="tooltip">
            <span>Confirm delete</span>
          </div>
        </div>

        <div className="tooltip-wrapper">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleCancel}
            aria-label="Cancel delete"
            style={{
              padding: '4px 8px',
              fontSize: '0.7rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          <div className="tooltip-bubble" role="tooltip">
            <span>Cancel</span>
          </div>
        </div>
      </span>
    );
  }

  return (
    <div className="tooltip-wrapper">
      <button
        type="button"
        className={className}
        onClick={handleClick}
        aria-label={resolvedAria}
      >
        {label}
      </button>
      <div className="tooltip-bubble" role="tooltip">
        <span>{resolvedAria}</span>
        <span className="tooltip-kbd">Click</span>
      </div>
    </div>
  );
}
