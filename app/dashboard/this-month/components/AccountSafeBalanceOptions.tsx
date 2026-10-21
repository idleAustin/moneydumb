/* eslint-disable @typescript-eslint/no-explicit-any */
// Standard Ramp/Stripe 8-Column Account Safe Balances Reconciliation Matrix Table with clickable Inbound Capital & Date Modal triggers.
'use client';

import { useState } from 'react';
import { Calendar, Edit3 } from 'lucide-react';
import { fmtFull, formatPayDate } from '../hooks/useSandboxMonth';

interface AccountSafeBalanceMatrixProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function AccountSafeBalanceOptions({
  state,
  metrics,
}: AccountSafeBalanceMatrixProps) {
  const [editingAcctId, setEditingAcctId] = useState<string | null>(null);
  const [acctEditVal, setAcctEditVal] = useState('');

  const {
    data,
    unifiedObligations,
    selectedAccountFilter,
    setSelectedAccountFilter,
    saveAccountBalance,
    setInboundModalAccountId,
  } = state;

  const { accountsWithMetrics } = metrics;
  const visibleAccounts = accountsWithMetrics.filter((a) => a.visible);

  const commitAccountEdit = (accountId: string) => {
    const parsed = parseFloat(acctEditVal);
    if (!Number.isNaN(parsed)) {
      saveAccountBalance(accountId, parsed);
    }
    setEditingAcctId(null);
  };

  // Helper to list inbound dates routed to a given bank account
  const getInboundDatesLabel = (accountId: string) => {
    const allocs = (data?.allocations || []).filter(
      (al: any) => al.account_id === accountId && Number(al.allocation_value) > 0
    );
    if (allocs.length === 0) return 'No scheduled inflow';
    const sourceIds = new Set(allocs.map((al: any) => al.income_source_id));
    const dates = (data?.income_items || [])
      .filter((inc: any) => sourceIds.has(inc.source_id) && inc.pay_date)
      .map((inc: any) => formatPayDate(inc.pay_date));
    return dates.length > 0 ? dates.join(', ') : 'Edit schedule';
  };

  const sumOpen = visibleAccounts.reduce((s, a) => s + a.startingBalance, 0);
  const sumIn = visibleAccounts.reduce((s, a) => s + a.incomingTotal, 0);
  const sumPaid = visibleAccounts.reduce((s, a) => s + a.paidDeductions, 0);
  const sumDue = visibleAccounts.reduce((s, a) => s + a.pendingDeductions, 0);
  const sumSafe = visibleAccounts.reduce((s, a) => s + a.currentSafeBalance, 0);
  const sumEnd = visibleAccounts.reduce((s, a) => s + a.projectedEndBalance, 0);

  return (
    <div
      style={{
        border: '1px solid var(--as-border-subtle)',
        borderRadius: 'var(--as-radius-md)',
        overflow: 'hidden',
        background: 'var(--as-bg-elevated)',
      }}
    >
      {/* 8-Column Header */}
      <div className="tm-acct-matrix-header">
        <div>BANK ACCOUNT</div>
        <div>TYPE</div>
        <div style={{ textAlign: 'right' }}>OPENING BAL</div>
        <div style={{ textAlign: 'right' }}>+ INBOUND (EDIT DATES)</div>
        <div style={{ textAlign: 'right' }}>− CLEARED</div>
        <div style={{ textAlign: 'right' }}>− STILL DUE</div>
        <div style={{ textAlign: 'right' }}>= SAFE NOW</div>
        <div style={{ textAlign: 'right' }}>= END BUFFER</div>
      </div>

      {visibleAccounts.map((a) => {
        const isSelected = selectedAccountFilter === a.id;
        const unpaidCount = unifiedObligations.filter(
          (o) => o.accountId === a.id && !o.isPaid
        ).length;
        const datesLabel = getInboundDatesLabel(a.id);

        return (
          <div
            key={a.id}
            className="tm-acct-matrix-row"
            style={{
              background: isSelected ? 'var(--as-accent-muted)' : 'transparent',
            }}
          >
            <div className="tm-acct-cell-bank">
              <button
                onClick={() => setSelectedAccountFilter(isSelected ? null : a.id)}
                aria-label={`Filter master ledger by ${a.name} row`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isSelected ? 'var(--as-accent-primary)' : 'var(--as-text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{a.name}</span>
                <span style={{ fontSize: '0.64rem', color: 'var(--as-text-muted)', fontWeight: 500 }}>
                  ({unpaidCount} due)
                </span>
              </button>
              <span className="tm-acct-mobile-badge">{a.account_type}</span>
            </div>

            <div className="tm-acct-cell-type" style={{ fontSize: '0.68rem', color: 'var(--as-text-muted)', textTransform: 'uppercase' }}>
              {a.account_type}
            </div>

            {/* Inline-editable Opening Balance */}
            <div className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.76rem' }}>
              <span className="tm-mobile-label">OPENING BAL</span>
              {editingAcctId === a.id ? (
                <input
                  className="tm-edit-input"
                  type="number"
                  value={acctEditVal}
                  onChange={(e) => setAcctEditVal(e.target.value)}
                  onBlur={() => commitAccountEdit(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAccountEdit(a.id);
                    if (e.key === 'Escape') setEditingAcctId(null);
                  }}
                  autoFocus
                  style={{ width: 88 }}
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingAcctId(a.id);
                    setAcctEditVal(String(a.startingBalance));
                  }}
                  aria-label={`Edit opening balance for ${a.name}`}
                  className="tm-editable"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--as-text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{fmtFull(a.startingBalance)}</span>
                  <Edit3 size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-muted)' }} />
                </button>
              )}
            </div>

            {/* Clickable + INBOUND cell that opens InboundCapitalModal for this bank */}
            <div className="tm-acct-cell">
              <span className="tm-mobile-label">+ INBOUND</span>
              <button
                onClick={() => setInboundModalAccountId(a.id)}
                aria-label={`Edit inbound deposits and dates for ${a.name}`}
                style={{
                  background: 'var(--as-bg-surface)',
                  border: '1px solid var(--as-border-subtle)',
                  borderRadius: 'var(--as-radius-sm)',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--as-font-mono)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--as-status-success)',
                  }}
                >
                  +{fmtFull(a.incomingTotal)}
                </span>
                <span
                  style={{
                    fontSize: '0.58rem',
                    color: 'var(--as-text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Calendar size={9} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  {datesLabel}
                </span>
              </button>
            </div>

            <div className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.76rem', color: 'var(--as-text-secondary)' }}>
              <span className="tm-mobile-label">− CLEARED</span>
              −{fmtFull(a.paidDeductions)}
            </div>
            <div className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.76rem', color: 'var(--as-status-warning)' }}>
              <span className="tm-mobile-label">− STILL DUE</span>
              −{fmtFull(a.pendingDeductions)}
            </div>
            <div className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.82rem', fontWeight: 700, color: a.currentSafeBalance >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>
              <span className="tm-mobile-label">= SAFE NOW</span>
              {fmtFull(a.currentSafeBalance)}
            </div>
            <div className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.8rem', fontWeight: 700, color: a.projectedEndBalance >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>
              <span className="tm-mobile-label">= END BUFFER</span>
              {fmtFull(a.projectedEndBalance)}
            </div>
          </div>
        );
      })}

      {/* Total Summary Footer Row */}
      <div className="tm-acct-matrix-footer">
        <div className="tm-acct-cell-bank" style={{ fontFamily: 'var(--as-font-body)', fontSize: '0.72rem', color: 'var(--as-text-secondary)' }}>
          TOTAL VISIBLE ({visibleAccounts.length})
        </div>
        <div className="tm-acct-cell-type" />
        <div className="tm-acct-cell">
          <span className="tm-mobile-label">OPENING BAL</span>
          {fmtFull(sumOpen)}
        </div>
        <div className="tm-acct-cell">
          <span className="tm-mobile-label">+ INBOUND</span>
          <button
            onClick={() => setInboundModalAccountId('ALL')}
            aria-label="Edit all inbound deposits and dates"
            className="tm-editable"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--as-status-success)',
              fontFamily: 'var(--as-font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            +{fmtFull(sumIn)}
          </button>
        </div>
        <div className="tm-acct-cell" style={{ color: 'var(--as-text-secondary)' }}>
          <span className="tm-mobile-label">− CLEARED</span>
          −{fmtFull(sumPaid)}
        </div>
        <div className="tm-acct-cell" style={{ color: 'var(--as-status-warning)' }}>
          <span className="tm-mobile-label">− STILL DUE</span>
          −{fmtFull(sumDue)}
        </div>
        <div className="tm-acct-cell" style={{ color: 'var(--as-accent-primary)' }}>
          <span className="tm-mobile-label">= SAFE NOW</span>
          {fmtFull(sumSafe)}
        </div>
        <div className="tm-acct-cell" style={{ color: sumEnd >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>
          <span className="tm-mobile-label">= END BUFFER</span>
          {fmtFull(sumEnd)}
        </div>
      </div>
    </div>
  );
}
