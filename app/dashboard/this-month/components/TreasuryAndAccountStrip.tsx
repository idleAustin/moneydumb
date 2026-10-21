// Locked-in Top Execution Progress Bar + 8-Column Account Safe Balances Matrix + Inbound Capital Modal.
'use client';

import { useState } from 'react';
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

  return (
    <>
      {/* 1. Locked-in Top Bar (Option A: Execution Progress & Burn Bar) */}
      <TopBarOptions state={state} metrics={metrics} />

      {/* 2. Locked-in Account Safe Balances Matrix Table (Option C) */}
      <div
        style={{
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          padding: '14px 18px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Landmark size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Safe Balances
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)' }}>
              • Click any bank name to filter bills below, or click + Inbound to edit deposit dates
            </span>
            {selectedAccountFilter && (
              <button
                onClick={() => setSelectedAccountFilter(null)}
                aria-label="Clear bank account filter"
                style={{
                  background: 'var(--as-accent-muted)',
                  border: '1px solid var(--as-accent-primary)',
                  color: 'var(--as-accent-primary)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
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
              onClick={() => setInboundModalAccountId('ALL')}
              aria-label="Open Inbound Capital and Paycheck Dates modal"
              style={{
                background: 'var(--as-status-success-bg)',
                border: '1px solid var(--as-status-success)',
                color: 'var(--as-status-success)',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <ArrowDownLeft size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Edit Inbound Dates & Splits</span>
            </button>

            <div style={{ display: 'flex', background: 'var(--as-bg-elevated)', border: '1px solid var(--as-border-subtle)', borderRadius: 'var(--as-radius-md)', padding: 2 }}>
              {(['active', 'checking', 'all'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAccountPreset(preset)}
                  aria-label={`Filter bank accounts by ${preset}`}
                  style={{
                    background: accountPreset === preset ? 'var(--as-bg-overlay)' : 'transparent',
                    color: accountPreset === preset ? 'var(--as-text-primary)' : 'var(--as-text-muted)',
                    border: 'none',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: 'var(--as-radius-sm)',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setPopoverOpen((p) => !p)}
                aria-label="Configure bank account visibility"
                style={{
                  background: 'var(--as-bg-elevated)',
                  border: '1px solid var(--as-border-subtle)',
                  color: 'var(--as-text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 'var(--as-radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Settings size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                <span>{visibleAccounts.length}/{accountsWithMetrics.length} Visible</span>
                <ChevronDown size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              </button>

              {popoverOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 280,
                    maxWidth: 'calc(100vw - 32px)',
                    background: 'var(--as-bg-overlay)',
                    border: '1px solid var(--as-border-strong)',
                    borderRadius: 'var(--as-radius-lg)',
                    padding: 12,
                    zIndex: 100,
                    boxShadow: '0 14px 36px rgba(0, 0, 0, 0.75)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--as-border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Visible Accounts</span>
                    <button
                      onClick={() => setPopoverOpen(false)}
                      aria-label="Close account visibility popover"
                      style={{ background: 'none', border: 'none', color: 'var(--as-text-muted)', cursor: 'pointer' }}
                    >
                      <X size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {accountsWithMetrics.map((a) => (
                      <label key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 6px', fontSize: '0.74rem', cursor: 'pointer' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={!hiddenAccountIds[a.id]}
                            onChange={() => setHiddenAccountIds((p) => ({ ...p, [a.id]: !p[a.id] }))}
                          />
                          <span>{a.name}</span>
                        </span>
                        <span style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.7rem', color: 'var(--as-text-secondary)' }}>
                          {fmtFull(a.currentSafeBalance)}
                        </span>
                      </label>
                    ))}
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
