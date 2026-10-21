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
  const [scope, setScope] = useState<'month' | 'master'>('month');

  useEffect(() => {
    if (obligation) {
      queueMicrotask(() => {
        setAmountInput(String(obligation.amount));
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
    const parsed = parseFloat(amountInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onSaveAmount(obligation, parsed, scope);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 12, 0.72)',
        zIndex: 230,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        aria-label={`Command drawer for ${obligation.name}`}
        style={{
          width: '100%',
          maxWidth: 420,
          height: '100dvh',
          background: 'var(--as-bg-surface)',
          borderLeft: '1px solid var(--as-border-strong)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '18px 16px calc(32px + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto',
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.75)',
        }}
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
                }}
              >
                {obligation.monogram}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--as-text-primary)', fontFamily: 'var(--as-font-heading)' }}>
                  {obligation.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--as-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onTogglePaid(obligation)}
              aria-label={obligation.isPaid ? `Mark ${obligation.name} as unpaid` : `Mark ${obligation.name} as paid`}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--as-radius-md)',
                border: obligation.isPaid ? '1px solid var(--as-status-success)' : '1px solid var(--as-accent-primary)',
                background: obligation.isPaid ? 'var(--as-status-success-bg)' : 'var(--as-accent-primary)',
                color: obligation.isPaid ? 'var(--as-status-success)' : 'var(--as-accent-text)',
                fontWeight: 700,
                fontSize: '0.82rem',
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
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--as-radius-md)',
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
                background: 'var(--as-bg-elevated)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-md)',
                padding: 12,
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Debt Payment Strategy</span>
                <span style={{ fontFamily: 'var(--as-font-mono)' }}>
                  Bal: {fmtFull(obligation.debtBalance || 0)} • {obligation.interestRate || 0}% APR
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
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
                      onClick={() => {
                        onSelectDebtTier(obligation, t.key);
                        setAmountInput(String(t.val));
                      }}
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
                      }}
                    >
                      <span style={{ fontSize: '0.73rem', fontWeight: 600 }}>{t.label}</span>
                      <span style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.73rem', fontWeight: 700 }}>{fmtFull(t.val)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Override vs Master Rule */}
          <div
            style={{
              background: 'var(--as-bg-elevated)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Sliders size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Payment Amount
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setScope('month')}
                  aria-label="Apply amount change to this month only"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    borderRadius: 'var(--as-radius-sm)',
                    border: scope === 'month' ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                    background: scope === 'month' ? 'var(--as-accent-muted)' : 'transparent',
                    color: scope === 'month' ? 'var(--as-accent-primary)' : 'var(--as-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  This Month Only
                </button>
                <button
                  onClick={() => setScope('master')}
                  aria-label="Apply amount change to master recurring rule"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    borderRadius: 'var(--as-radius-sm)',
                    border: scope === 'master' ? '1px solid var(--as-status-info)' : '1px solid var(--as-border-subtle)',
                    background: scope === 'master' ? 'var(--as-status-info-bg)' : 'transparent',
                    color: scope === 'master' ? 'var(--as-status-info)' : 'var(--as-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Master Rule
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyAmount()}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'var(--as-bg-base)',
                  border: '1px solid var(--as-border-strong)',
                  borderRadius: 'var(--as-radius-md)',
                  color: 'var(--as-text-primary)',
                  fontFamily: 'var(--as-font-mono)',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              />
              <button
                onClick={handleApplyAmount}
                aria-label="Save obligation amount"
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--as-radius-md)',
                  border: '1px solid var(--as-border-strong)',
                  background: 'var(--as-bg-overlay)',
                  color: 'var(--as-text-primary)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Bank Account Routing & Safe Balance Preview */}
          <div
            style={{
              background: 'var(--as-bg-elevated)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Landmark size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Pay From Bank Account
            </div>

            {assignedAcct && (
              <div
                style={{
                  padding: '8px 10px',
                  background: 'var(--as-bg-base)',
                  border: '1px solid var(--as-border-subtle)',
                  borderRadius: 'var(--as-radius-sm)',
                  fontFamily: 'var(--as-font-mono)',
                  fontSize: '0.74rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
                    onClick={() => onSelectAccount(obligation, a.id)}
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
                      <div style={{ fontSize: '0.65rem', color: 'var(--as-text-muted)', textTransform: 'capitalize' }}>
                        {a.account_type} • {a.linkedCount} bills linked
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.76rem', fontWeight: 700, color: a.currentSafeBalance >= 0 ? 'var(--as-status-success)' : 'var(--as-status-error)' }}>
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
