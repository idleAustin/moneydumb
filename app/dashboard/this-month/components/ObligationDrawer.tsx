// Slide-over command drawer for inspecting and editing a monthly obligation (amount override vs master rule, debt tier, and bank account routing).
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Check,
  ExternalLink,
  Landmark,
  CreditCard,
  Receipt,
  ArrowRight,
  Clock,
  Sliders,
} from 'lucide-react';
import { UnifiedObligation, fmtFull } from '../hooks/useSandboxMonth';
import { AccountWithMetrics } from '../hooks/sandboxMetrics';

interface ObligationDrawerProps {
  obligation: UnifiedObligation | null;
  accounts: AccountWithMetrics[];
  onClose: () => void;
  onTogglePaid: (ob: UnifiedObligation) => void;
  onSaveAmount: (ob: UnifiedObligation, amount: number, scope: 'month' | 'master') => void;
  onSelectAccount: (ob: UnifiedObligation, accountId: string) => void;
  onSelectDebtTier: (ob: UnifiedObligation, tier: string) => void;
}

export default function ObligationDrawer({
  obligation,
  accounts,
  onClose,
  onTogglePaid,
  onSaveAmount,
  onSelectAccount,
  onSelectDebtTier,
}: ObligationDrawerProps) {
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [scope, setScope] = useState<'month' | 'master'>('month');

  useEffect(() => {
    if (obligation) {
      queueMicrotask(() => {
        setAmountInput(String(obligation.amount));
        setAmountError(null);
        setScope('month');
      });
    }
  }, [obligation]);

  useEffect(() => {
    if (!obligation) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [obligation, onClose]);

  if (!obligation) return null;

  const isDebt = obligation.type === 'debt';
  const assignedAcct = accounts.find((a) => a.id === obligation.accountId);
  const safeBefore = assignedAcct ? assignedAcct.currentSafeBalance : 0;
  const safeAfter = obligation.isPaid ? safeBefore : safeBefore - obligation.amount;

  const handleApplyAmount = () => {
    const trimmed = amountInput.trim();
    const parsed = Number(trimmed);
    if (!trimmed || Number.isNaN(parsed) || parsed < 0) {
      setAmountError('Enter a valid non-negative dollar amount.');
      return;
    }
    setAmountError(null);
    onSaveAmount(obligation, parsed, scope);
  };

  return (
    <div className="tm-drawer-backdrop" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-obligation-drawer-title"
        className="tm-drawer-panel"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--as-border-subtle)', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--as-radius-md)',
                  background: 'var(--as-bg-elevated)',
                  border: '1px solid var(--as-border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--as-font-mono)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: isDebt ? 'var(--as-status-warning)' : 'var(--as-accent-primary)',
                  flexShrink: 0,
                }}
              >
                {obligation.monogram}
              </div>
              <div>
                <h2
                  id="tm-obligation-drawer-title"
                  style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--as-text-primary)',
                    fontFamily: 'var(--as-font-heading)',
                  }}
                >
                  {obligation.name}
                </h2>
                <div style={{ fontSize: '0.72rem', color: 'var(--as-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap', fontVariantNumeric: 'tabular-nums' }}>
                  {isDebt ? (
                    <CreditCard size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  ) : (
                    <Receipt size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  )}
                  <span>{obligation.category}</span>
                  <span>•</span>
                  <Clock size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span>Due {obligation.dueLabel} ({obligation.countdownLabel})</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="tm-touch-btn"
              onClick={onClose}
              aria-label="Close obligation command drawer"
              style={{
                background: 'var(--as-bg-elevated)',
                border: '1px solid var(--as-border-subtle)',
                color: 'var(--as-text-secondary)',
                width: 36,
                height: 36,
                borderRadius: 'var(--as-radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </button>
          </div>

          {/* Primary Status & Portal Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="tm-touch-btn"
              onClick={() => onTogglePaid(obligation)}
              aria-pressed={obligation.isPaid}
              aria-label={obligation.isPaid ? `Mark ${obligation.name} as unpaid` : `Mark ${obligation.name} as paid`}
              style={{
                flex: 1,
                minHeight: 44,
                padding: '10px 14px',
                borderRadius: 'var(--as-radius-sm)',
                border: obligation.isPaid ? '1px solid var(--as-status-success)' : '1px solid var(--as-accent-primary)',
                background: obligation.isPaid ? 'var(--as-status-success-bg)' : 'var(--as-accent-primary)',
                color: obligation.isPaid ? 'var(--as-status-success)' : 'var(--as-accent-text)',
                fontWeight: 700,
                fontSize: '0.82rem',
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Check size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              {obligation.isPaid ? 'Cleared This Cycle (Undo)' : `Mark Paid (${fmtFull(obligation.amount)})`}
            </button>

            {obligation.url && (
              <a
                href={obligation.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open external payment site for ${obligation.name}`}
                className="tm-touch-btn"
                style={{
                  minHeight: 44,
                  padding: '10px 14px',
                  borderRadius: 'var(--as-radius-sm)',
                  border: '1px solid var(--as-border-strong)',
                  background: 'var(--as-bg-elevated)',
                  color: 'var(--as-text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Portal
                <ExternalLink size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              </a>
            )}
          </div>

          {/* Debt Strategy Tiers */}
          {isDebt && (
            <div
              style={{
                background: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-md)',
                padding: 12,
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                <span>Debt Payment Strategy</span>
                <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--as-text-secondary)' }}>
                  Bal: {fmtFull(obligation.debtBalance || 0)} • {obligation.interestRate || 0}% APR
                </span>
              </div>
              <div className="tm-drawer-tier-grid" role="group" aria-label="Debt payment strategy tiers">
                {[
                  { key: 'min', label: 'Minimum', val: obligation.minimumPayment || 0 },
                  { key: 'due', label: 'Due Now', val: obligation.dueImmediately || obligation.minimumPayment || 0 },
                  { key: 'payoff_plan', label: 'Committed Plan', val: obligation.calculatedPayment || obligation.minimumPayment || 0 },
                  { key: 'full', label: 'Full Balance', val: obligation.debtBalance || 0 },
                ].map((t) => {
                  const active = obligation.activeTier === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      className="tm-touch-btn"
                      onClick={() => {
                        onSelectDebtTier(obligation, t.key);
                        setAmountInput(String(t.val));
                        setAmountError(null);
                      }}
                      aria-pressed={active}
                      aria-label={`Select ${t.label} payment tier (${fmtFull(t.val)})`}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--as-radius-sm)',
                        border: active ? '1px solid var(--as-status-warning)' : '1px solid var(--as-border-subtle)',
                        background: active ? 'var(--as-status-warning-bg)' : 'var(--as-bg-surface)',
                        color: active ? 'var(--as-status-warning)' : 'var(--as-text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: '0.73rem', fontWeight: 600 }}>{t.label}</span>
                      <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.73rem', fontWeight: 700 }}>{fmtFull(t.val)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Override vs Master Rule */}
          <div
            style={{
              background: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <label
                htmlFor="tm-drawer-amount-input"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--as-text-tertiary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Sliders size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Payment Amount
              </label>
              <div style={{ display: 'flex', gap: 4 }} role="group" aria-label="Payment update scope">
                <button
                  type="button"
                  className="tm-touch-btn"
                  onClick={() => setScope('month')}
                  aria-pressed={scope === 'month'}
                  aria-label="Apply amount change to this month only"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: 'var(--as-radius-sm)',
                    border: scope === 'month' ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                    background: scope === 'month' ? 'var(--as-accent-muted)' : 'transparent',
                    color: scope === 'month' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  This Month Only
                </button>
                <button
                  type="button"
                  className="tm-touch-btn"
                  onClick={() => setScope('master')}
                  aria-pressed={scope === 'master'}
                  aria-label="Apply amount change to master recurring rule"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    borderRadius: 'var(--as-radius-sm)',
                    border: scope === 'master' ? '1px solid var(--as-status-info)' : '1px solid var(--as-border-subtle)',
                    background: scope === 'master' ? 'var(--as-status-info-bg)' : 'transparent',
                    color: scope === 'master' ? 'var(--as-status-info)' : 'var(--as-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Master Rule
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="tm-drawer-amount-input"
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                aria-invalid={Boolean(amountError)}
                aria-describedby={amountError ? 'tm-drawer-amount-error' : undefined}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (amountError) setAmountError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyAmount();
                  }
                }}
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: '8px 10px',
                  background: 'var(--as-bg-surface)',
                  border: amountError ? '1px solid var(--as-status-error)' : '1px solid var(--as-border-strong)',
                  borderRadius: 'var(--as-radius-sm)',
                  color: 'var(--as-text-primary)',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              />
              <button
                type="button"
                className="tm-touch-btn"
                onClick={handleApplyAmount}
                aria-label="Save obligation amount"
                style={{
                  minHeight: 44,
                  padding: '8px 16px',
                  borderRadius: 'var(--as-radius-sm)',
                  border: '1px solid var(--as-border-strong)',
                  background: 'var(--as-bg-elevated)',
                  color: 'var(--as-text-primary)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>

            {amountError && (
              <p
                id="tm-drawer-amount-error"
                role="alert"
                style={{ margin: 0, fontSize: '0.74rem', color: 'var(--as-status-error)', fontWeight: 500 }}
              >
                {amountError}
              </p>
            )}
          </div>

          {/* Bank Account Routing & Safe Balance Preview */}
          <div
            style={{
              background: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Landmark size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Pay From Bank Account
            </div>

            {assignedAcct && (
              <div
                style={{
                  padding: '8px 10px',
                  background: 'var(--as-bg-surface)',
                  border: '1px solid var(--as-border-subtle)',
                  borderRadius: 'var(--as-radius-sm)',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.74rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--as-text-secondary)' }}>{assignedAcct.name} Safe:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <span>{fmtFull(safeBefore)}</span>
                  <ArrowRight size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span style={{ color: safeAfter >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>
                    {fmtFull(safeAfter)}
                  </span>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {accounts.map((a) => {
                const isSelected = a.id === obligation.accountId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    className="tm-touch-btn"
                    onClick={() => onSelectAccount(obligation, a.id)}
                    aria-pressed={isSelected}
                    aria-label={`Route ${obligation.name} to ${a.name}`}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--as-radius-sm)',
                      border: isSelected ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                      background: isSelected ? 'var(--as-accent-muted)' : 'var(--as-bg-surface)',
                      color: 'var(--as-text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', textTransform: 'capitalize', fontVariantNumeric: 'tabular-nums' }}>
                        {a.account_type} • {a.linkedCount} bills linked
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.76rem', fontWeight: 700, color: a.currentSafeBalance >= 0 ? 'var(--as-status-success)' : 'var(--as-status-error)' }}>
                      {fmtFull(a.currentSafeBalance)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
