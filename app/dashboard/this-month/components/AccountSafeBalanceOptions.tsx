/* eslint-disable @typescript-eslint/no-explicit-any */
// Standard Ramp/Stripe 8-Column Account Safe Balances Reconciliation Matrix Table with clickable Inbound Capital & Date Modal triggers.
'use client';

import { useState, useRef } from 'react';
import { Calendar, Edit3, Landmark } from 'lucide-react';
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
  const escapingRef = useRef(false);
  const committedRef = useRef(false);

  const {
    data,
    unifiedObligations,
    selectedAccountFilter,
    setSelectedAccountFilter,
    setAccountPreset,
    setHiddenAccountIds,
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
      role="table"
      aria-label="Account safe balances reconciliation matrix"
      style={{
        borderBottomLeftRadius: 'var(--as-radius-lg)',
        borderBottomRightRadius: 'var(--as-radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* 8-Column Header */}
      <div role="rowgroup">
        <div role="row" className="tm-acct-matrix-header">
          <div role="columnheader">BANK ACCOUNT</div>
          <div role="columnheader">TYPE</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>OPENING BAL</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>+ INBOUND (EDIT DATES)</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>− CLEARED</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>− STILL DUE</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>= SAFE NOW</div>
          <div role="columnheader" style={{ textAlign: 'right' }}>= END BUFFER</div>
        </div>
      </div>

      <div role="rowgroup">
        {visibleAccounts.length === 0 ? (
          <div role="row" style={{ padding: '20px 18px', borderBottom: '1px solid var(--as-border-subtle)' }}>
            <div
              role="cell"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Landmark size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--as-text-primary)' }}>
                    {accountsWithMetrics.length === 0
                      ? 'No bank accounts configured yet'
                      : 'No bank accounts match the active visibility filter'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--as-text-secondary)', marginTop: 2 }}>
                    {accountsWithMetrics.length === 0
                      ? 'Add checking or savings accounts on the Accounts route to calculate post-obligation safe cash.'
                      : 'Reset the account type preset or visibility checkboxes to display hidden accounts.'}
                  </div>
                </div>
              </div>
              {accountsWithMetrics.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setAccountPreset('all');
                    setHiddenAccountIds({});
                  }}
                >
                  Show All Accounts
                </button>
              )}
            </div>
          </div>
        ) : (
          visibleAccounts.map((a) => {
            const isSelected = selectedAccountFilter === a.id;
            const unpaidCount = unifiedObligations.filter(
              (o) => o.accountId === a.id && !o.isPaid
            ).length;
            const datesLabel = getInboundDatesLabel(a.id);

            return (
              <div
                key={a.id}
                role="row"
                className="tm-acct-matrix-row"
                style={{
                  background: isSelected ? 'var(--as-accent-muted)' : 'transparent',
                }}
              >
                <div role="cell" className="tm-acct-cell-bank" style={{ minWidth: 0 }}>
                  <button
                    type="button"
                    className="tm-touch-btn"
                    onClick={() => setSelectedAccountFilter(isSelected ? null : a.id)}
                    aria-pressed={isSelected}
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
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--as-text-tertiary)',
                        fontWeight: 500,
                        fontFamily: 'var(--as-font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      ({unpaidCount} due)
                    </span>
                  </button>
                  <span className="tm-acct-mobile-badge">{a.account_type}</span>
                </div>

                <div role="cell" className="tm-acct-cell-type" style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', textTransform: 'uppercase' }}>
                  {a.account_type}
                </div>

                {/* Inline-editable Opening Balance */}
                <div role="cell" className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.76rem' }}>
                  <span className="tm-mobile-label">OPENING BAL</span>
                  {editingAcctId === a.id ? (
                    <input
                      className="tm-edit-input"
                      type="number"
                      step="0.01"
                      value={acctEditVal}
                      aria-label={`Opening balance for ${a.name}`}
                      onChange={(e) => setAcctEditVal(e.target.value)}
                      onBlur={() => {
                        if (escapingRef.current || committedRef.current) {
                          escapingRef.current = false;
                          committedRef.current = false;
                          return;
                        }
                        commitAccountEdit(a.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          committedRef.current = true;
                          commitAccountEdit(a.id);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          escapingRef.current = true;
                          setEditingAcctId(null);
                        }
                      }}
                      autoFocus
                      style={{ width: 92 }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        escapingRef.current = false;
                        committedRef.current = false;
                        setEditingAcctId(a.id);
                        setAcctEditVal(String(a.startingBalance));
                      }}
                      aria-label={`Edit opening balance for ${a.name}`}
                      className="tm-editable tm-touch-btn"
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
                      <Edit3 size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)' }} />
                    </button>
                  )}
                </div>

                {/* Clickable + INBOUND cell that opens InboundCapitalModal for this bank */}
                <div role="cell" className="tm-acct-cell">
                  <span className="tm-mobile-label">+ INBOUND</span>
                  <button
                    type="button"
                    className="tm-touch-btn"
                    onClick={() => setInboundModalAccountId(a.id)}
                    aria-label={`Edit inbound deposits and dates for ${a.name}`}
                    style={{
                      background: 'var(--as-bg-base)',
                      border: '1px solid var(--as-border-subtle)',
                      borderRadius: 'var(--as-radius-sm)',
                      padding: '4px 8px',
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
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--as-status-success)',
                      }}
                    >
                      +{fmtFull(a.incomingTotal)}
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        color: 'var(--as-text-tertiary)',
                        fontVariantNumeric: 'tabular-nums',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Calendar size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                      {datesLabel}
                    </span>
                  </button>
                </div>

                <div role="cell" className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.76rem', color: 'var(--as-text-secondary)' }}>
                  <span className="tm-mobile-label">− CLEARED</span>
                  −{fmtFull(a.paidDeductions)}
                </div>
                <div role="cell" className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.76rem', color: 'var(--as-status-warning)' }}>
                  <span className="tm-mobile-label">− STILL DUE</span>
                  −{fmtFull(a.pendingDeductions)}
                </div>
                <div role="cell" className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 700, color: a.currentSafeBalance >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>
                  <span className="tm-mobile-label">= SAFE NOW</span>
                  {fmtFull(a.currentSafeBalance)}
                </div>
                <div role="cell" className="tm-acct-cell" style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem', fontWeight: 700, color: a.projectedEndBalance >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>
                  <span className="tm-mobile-label">= END BUFFER</span>
                  {fmtFull(a.projectedEndBalance)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total Summary Footer Row */}
      <div role="rowgroup">
        <div role="row" className="tm-acct-matrix-footer">
          <div role="cell" className="tm-acct-cell-bank" style={{ fontFamily: 'var(--as-font-body)', fontSize: '0.72rem', color: 'var(--as-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            TOTAL VISIBLE ({visibleAccounts.length})
          </div>
          <div role="cell" className="tm-acct-cell-type" />
          <div role="cell" className="tm-acct-cell">
            <span className="tm-mobile-label">OPENING BAL</span>
            {fmtFull(sumOpen)}
          </div>
          <div role="cell" className="tm-acct-cell">
            <span className="tm-mobile-label">+ INBOUND</span>
            <button
              type="button"
              onClick={() => setInboundModalAccountId('ALL')}
              aria-label="Edit all inbound deposits and dates"
              className="tm-editable tm-touch-btn"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--as-status-success)',
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              +{fmtFull(sumIn)}
            </button>
          </div>
          <div role="cell" className="tm-acct-cell" style={{ color: 'var(--as-text-secondary)' }}>
            <span className="tm-mobile-label">− CLEARED</span>
            −{fmtFull(sumPaid)}
          </div>
          <div role="cell" className="tm-acct-cell" style={{ color: 'var(--as-status-warning)' }}>
            <span className="tm-mobile-label">− STILL DUE</span>
            −{fmtFull(sumDue)}
          </div>
          <div role="cell" className="tm-acct-cell" style={{ color: sumSafe >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>
            <span className="tm-mobile-label">= SAFE NOW</span>
            {fmtFull(sumSafe)}
          </div>
          <div role="cell" className="tm-acct-cell" style={{ color: sumEnd >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>
            <span className="tm-mobile-label">= END BUFFER</span>
            {fmtFull(sumEnd)}
          </div>
        </div>
      </div>
    </div>
  );
}
