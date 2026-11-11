// Locked-in Top Execution Progress Bar + 8-Column Account Safe Balances Matrix + Inbound Capital Modal.
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  Settings,
  ChevronDown,
  X,
  ArrowDownLeft,
} from 'lucide-react';
import { fmtFull } from '../hooks/useSandboxMonth';
import AccountSafeBalanceOptions from './AccountSafeBalanceOptions';
import TopBarOptions from './TopBarOptions';
import InboundCapitalModal from './InboundCapitalModal';

interface TreasuryAndAccountStripProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function TreasuryAndAccountStrip({
  state,
  metrics,
}: TreasuryAndAccountStripProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverWrapRef = useRef<HTMLDivElement>(null);
  const popoverBtnRef = useRef<HTMLButtonElement>(null);

  const {
    accountPreset,
    setAccountPreset,
    hiddenAccountIds,
    setHiddenAccountIds,
    selectedAccountFilter,
    setSelectedAccountFilter,
    setInboundModalAccountId,
  } = state;

  const { accountsWithMetrics } = metrics;
  const visibleAccounts = accountsWithMetrics.filter((a) => a.visible);

  useEffect(() => {
    if (!popoverOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (popoverWrapRef.current && !popoverWrapRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setPopoverOpen(false);
        popoverBtnRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [popoverOpen]);

  return (
    <>
      {/* 1. Locked-in Top Bar (Option A: Execution Progress & Burn Bar) */}
      <TopBarOptions state={state} metrics={metrics} />

      {/* 2. Locked-in Account Safe Balances Matrix Table (single flat surface card, no nested card-in-card) */}
      <div
        style={{
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            borderBottom: '1px solid var(--as-border-subtle)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Landmark size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Safe Balances
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--as-text-tertiary)' }}>
              • Click any bank name to filter bills below, or click + Inbound to edit deposit dates
            </span>
            {selectedAccountFilter && (
              <button
                type="button"
                className="tm-touch-btn"
                onClick={() => setSelectedAccountFilter(null)}
                aria-label="Clear bank account filter"
                style={{
                  background: 'var(--as-accent-muted)',
                  border: '1px solid var(--as-accent-primary)',
                  color: 'var(--as-accent-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--as-radius-pill)',
                  cursor: 'pointer',
                }}
              >
                Clear Account Filter
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="tm-touch-btn"
              onClick={() => setInboundModalAccountId('ALL')}
              aria-label="Open Inbound Capital and Paycheck Dates modal"
              style={{
                background: 'var(--as-status-success-bg)',
                border: '1px solid var(--as-status-success)',
                color: 'var(--as-status-success)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <ArrowDownLeft size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Edit Inbound Dates &amp; Splits</span>
            </button>

            <div
              role="group"
              aria-label="Account type filter"
              style={{
                display: 'flex',
                background: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-sm)',
                padding: 2,
              }}
            >
              {(['active', 'checking', 'all'] as const).map((preset) => {
                const isSelected = accountPreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    className="tm-touch-btn"
                    onClick={() => setAccountPreset(preset)}
                    aria-pressed={isSelected}
                    aria-label={`Filter bank accounts by ${preset}`}
                    style={{
                      background: isSelected ? 'var(--as-accent-muted)' : 'transparent',
                      color: isSelected ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                      border: isSelected ? '1px solid var(--as-accent-primary)' : '1px solid transparent',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 'var(--as-radius-sm)',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            <div ref={popoverWrapRef} style={{ position: 'relative' }}>
              <button
                ref={popoverBtnRef}
                type="button"
                className="tm-touch-btn"
                onClick={() => setPopoverOpen((p) => !p)}
                aria-expanded={popoverOpen}
                aria-controls="tm-acct-visibility-popover"
                aria-label="Configure bank account visibility"
                style={{
                  background: 'var(--as-bg-base)',
                  border: '1px solid var(--as-border-subtle)',
                  color: 'var(--as-text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 'var(--as-radius-sm)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <Settings size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                <span>{visibleAccounts.length}/{accountsWithMetrics.length} Visible</span>
                <ChevronDown size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              </button>

              {popoverOpen && (
                <div
                  id="tm-acct-visibility-popover"
                  role="dialog"
                  aria-label="Visible bank accounts"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 290,
                    maxWidth: 'calc(100vw - 32px)',
                    background: 'var(--as-bg-overlay)',
                    border: '1px solid var(--as-border-strong)',
                    borderRadius: 'var(--as-radius-lg)',
                    padding: 12,
                    zIndex: 100,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--as-border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>Visible Accounts</span>
                    <button
                      type="button"
                      className="tm-row-icon-btn"
                      onClick={() => setPopoverOpen(false)}
                      aria-label="Close account visibility popover"
                    >
                      <X size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {accountsWithMetrics.map((a) => {
                      const checkId = `tm-vis-acct-${a.id}`;
                      return (
                        <label
                          key={a.id}
                          htmlFor={checkId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: 'var(--as-radius-sm)',
                            color: 'var(--as-text-primary)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <input
                              id={checkId}
                              type="checkbox"
                              checked={!hiddenAccountIds[a.id]}
                              onChange={() => setHiddenAccountIds((p) => ({ ...p, [a.id]: !p[a.id] }))}
                            />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                          </span>
                          <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.72rem', color: 'var(--as-text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                            {fmtFull(a.currentSafeBalance)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AccountSafeBalanceOptions state={state} metrics={metrics} />
      </div>

      {/* 3. Inbound Capital & Deposit Dates Modal */}
      <InboundCapitalModal state={state} metrics={metrics} />
    </>
  );
}
