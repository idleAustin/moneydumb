/* eslint-disable @typescript-eslint/no-explicit-any */
// Modal for inspecting and editing inbound paychecks, deposit dates, amounts, and per-bank routing splits.
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  Check,
  Landmark,
  Sliders,
} from 'lucide-react';
import { fmtFull, formatPayDate } from '../hooks/useSandboxMonth';

interface InboundCapitalModalProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function InboundCapitalModal({ state, metrics }: InboundCapitalModalProps) {
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const {
    data,
    inboundModalAccountId,
    setInboundModalAccountId,
    paidIncome,
    setPaidIncome,
    getIncomeAmount,
    saveIncomeDate,
    saveIncomeAmount,
    saveAllocationValue,
  } = state;

  const { accountsWithMetrics, totalIncome, incomeReceived } = metrics;
  const isOpen = Boolean(inboundModalAccountId && data);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setInboundModalAccountId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, setInboundModalAccountId]);

  if (!inboundModalAccountId || !data) {
    return null;
  }

  const clearRowError = (id: string) => {
    setRowErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const isAllAccounts = inboundModalAccountId === 'ALL';
  const activeAccount = isAllAccounts
    ? null
    : accountsWithMetrics.find((a) => a.id === inboundModalAccountId) || null;

  const incomeItems: any[] = data.income_items || [];
  const allocations: any[] = data.allocations || [];

  const computeBankShare = (item: any, accountId: string) => {
    const totalAmt = getIncomeAmount(item);
    const alloc = allocations.find(
      (a: any) => a.income_source_id === item.source_id && a.account_id === accountId
    );
    if (!alloc) {
      return { type: 'percent' as const, rawValue: 0, dollarShare: 0 };
    }
    const scale = item.amount > 0 ? totalAmt / item.amount : 0;
    const dollarShare =
      totalAmt === 0
        ? 0
        : alloc.allocation_type === 'percent'
        ? totalAmt * (alloc.allocation_value / 100)
        : alloc.allocation_value * scale;
    return {
      type: (alloc.allocation_type || 'percent') as 'percent' | 'fixed',
      rawValue: Number(alloc.allocation_value || 0),
      dollarShare,
    };
  };

  const inboundTotalVal = activeAccount ? activeAccount.incomingTotal : totalIncome;
  const receivedVal = activeAccount ? activeAccount.incomingReceived : incomeReceived;
  const pendingVal = activeAccount
    ? activeAccount.incomingPending
    : Math.max(0, totalIncome - incomeReceived);
  const totalRoutedAllBanks = accountsWithMetrics.reduce((s, a) => s + a.incomingTotal, 0);
  const scopedSharePct =
    activeAccount && totalIncome > 0
      ? ((activeAccount.incomingTotal / totalIncome) * 100).toFixed(1)
      : '0.0';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tm-inbound-modal-title"
      className="tm-modal-backdrop"
      onClick={() => setInboundModalAccountId(null)}
    >
      <div
        className="tm-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--as-bg-elevated)',
            borderBottom: '1px solid var(--as-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--as-radius-md)',
                background: 'var(--as-status-success-bg)',
                border: '1px solid color-mix(in srgb, var(--as-status-success) 35%, transparent)',
                color: 'var(--as-status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowDownLeft size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </div>
            <div>
              <h2
                id="tm-inbound-modal-title"
                style={{
                  margin: 0,
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  color: 'var(--as-text-primary)',
                  fontFamily: 'var(--as-font-heading)',
                }}
              >
                {activeAccount
                  ? `${activeAccount.name} — Inbound Deposits & Schedule`
                  : 'All Inbound Capital & Deposit Dates'}
              </h2>
              <div style={{ fontSize: '0.74rem', color: 'var(--as-text-secondary)', marginTop: 2 }}>
                Edit paycheck dates, total deposit amounts, received status, and bank routing splits.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="tm-touch-btn"
            onClick={() => setInboundModalAccountId(null)}
            aria-label="Close inbound capital modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--as-radius-md)',
              background: 'var(--as-bg-surface)',
              border: '1px solid var(--as-border-subtle)',
              color: 'var(--as-text-secondary)',
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

        {/* Inspect Bank Scope Selector Grid */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--as-bg-base)',
            borderBottom: '1px solid var(--as-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Landmark size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)' }} />
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--as-text-tertiary)',
              }}
            >
              Inspect Bank
            </span>
          </div>

          <div role="group" aria-label="Inspect bank scope" className="tm-inbound-bank-grid">
            <button
              type="button"
              className={`tm-inbound-bank-tab tm-touch-btn ${isAllAccounts ? 'tm-inbound-bank-tab-active' : ''}`}
              onClick={() => setInboundModalAccountId('ALL')}
              aria-pressed={isAllAccounts}
              aria-label="View all inbound capital across accounts"
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isAllAccounts ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  All Banks
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 'var(--as-radius-pill)',
                    background: isAllAccounts ? 'var(--as-accent-primary)' : 'transparent',
                    flexShrink: 0,
                  }}
                />
              </span>
              <span
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isAllAccounts
                    ? 'var(--as-accent-primary)'
                    : totalIncome > 0
                    ? 'var(--as-status-success)'
                    : 'var(--as-text-tertiary)',
                }}
              >
                +{fmtFull(totalIncome)}
              </span>
            </button>

            {accountsWithMetrics.map((acct) => {
              const isSelected = inboundModalAccountId === acct.id;
              return (
                <button
                  key={acct.id}
                  type="button"
                  className={`tm-inbound-bank-tab tm-touch-btn ${isSelected ? 'tm-inbound-bank-tab-active' : ''}`}
                  onClick={() => setInboundModalAccountId(acct.id)}
                  aria-pressed={isSelected}
                  aria-label={`Inspect inbound capital for ${acct.name}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isSelected ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {acct.name}
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 'var(--as-radius-pill)',
                        background: isSelected ? 'var(--as-accent-primary)' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--as-font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: isSelected
                        ? 'var(--as-accent-primary)'
                        : acct.incomingTotal > 0
                        ? 'var(--as-status-success)'
                        : 'var(--as-text-tertiary)',
                    }}
                  >
                    +{fmtFull(acct.incomingTotal)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Telemetry Strip */}
        <div className="tm-inbound-summary-grid">
          <div style={{ padding: '10px 14px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)', minWidth: 0 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeAccount ? `${activeAccount.name} Inbound Total` : 'Monthly Inbound Total'}
            </div>
            <div
              style={{
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: inboundTotalVal > 0 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)',
                marginTop: 4,
              }}
            >
              +{fmtFull(inboundTotalVal)}
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)', minWidth: 0 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Received &amp; Cleared
            </div>
            <div
              style={{
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: receivedVal > 0 ? 'var(--as-accent-primary)' : 'var(--as-text-tertiary)',
                marginTop: 4,
              }}
            >
              +{fmtFull(receivedVal)}
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)', minWidth: 0 }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--as-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Pending Scheduled
            </div>
            <div
              style={{
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: pendingVal > 0 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)',
                marginTop: 4,
              }}
            >
              +{fmtFull(pendingVal)}
            </div>
          </div>
        </div>

        {/* Inbound Paycheck / Deposit Ledger */}
        <div style={{ padding: '16px 20px' }}>
          {incomeItems.length === 0 ? (
            <div
              style={{
                padding: '28px 20px',
                background: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-md)',
                textAlign: 'center',
              }}
            >
              <ArrowDownLeft size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                No inbound deposits scheduled for this month
              </div>
              <p style={{ margin: '4px auto 0', fontSize: '0.78rem', color: 'var(--as-text-secondary)', maxWidth: '44ch' }}>
                Add recurring paychecks or income sources on the Income route to manage deposit dates and bank routing splits here.
              </p>
            </div>
          ) : (
            <div className="tm-inbound-table-wrap" role="table" aria-label="Inbound deposits schedule">
              <div role="rowgroup">
                <div role="row" className={`tm-inbound-row-header ${activeAccount ? 'tm-inbound-row-header-scoped' : ''}`}>
                  <div role="columnheader" style={{ textAlign: 'center' }}>REC&apos;D</div>
                  <div role="columnheader">INBOUND SOURCE</div>
                  <div role="columnheader">DEPOSIT DATE</div>
                  <div role="columnheader" style={{ textAlign: 'right' }}>TOTAL PAYCHECK</div>
                  {activeAccount ? (
                    <>
                      <div role="columnheader" style={{ textAlign: 'right' }}>BANK SPLIT</div>
                      <div role="columnheader" style={{ textAlign: 'right' }}>BANK INFLOW</div>
                    </>
                  ) : (
                    <div role="columnheader" style={{ textAlign: 'right' }}>BANK ROUTING SPLITS</div>
                  )}
                </div>
              </div>

              <div role="rowgroup">
                {incomeItems.map((inc: any) => {
                  const isReceived = !!paidIncome[inc.id];
                  const totalPaycheck = getIncomeAmount(inc);
                  const bankShare = activeAccount ? computeBankShare(inc, activeAccount.id) : null;
                  const dateInputId = `tm-inbound-date-${inc.id}`;
                  const amtInputId = `tm-inbound-amt-${inc.id}`;
                  const splitInputId = activeAccount ? `tm-inbound-split-${inc.id}-${activeAccount.id}` : '';
                  const rowErr = rowErrors[inc.id];
                  const activeSplits = !activeAccount
                    ? accountsWithMetrics
                        .map((acct) => ({ acct, share: computeBankShare(inc, acct.id) }))
                        .filter(({ share }) => share.dollarShare > 0)
                    : [];

                  return (
                    <div key={inc.id}>
                      <div
                        role="row"
                        className={`tm-inbound-row ${activeAccount ? 'tm-inbound-row-scoped' : ''}`}
                        style={
                          isReceived
                            ? { background: 'color-mix(in srgb, var(--as-accent-muted) 65%, var(--as-bg-elevated))' }
                            : undefined
                        }
                      >
                        <div role="cell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setPaidIncome((p) => ({ ...p, [inc.id]: !p[inc.id] }))}
                            aria-pressed={isReceived}
                            aria-label={isReceived ? `Mark ${inc.name} as pending` : `Mark ${inc.name} as received`}
                            className={`tm-toggle ${isReceived ? 'tm-toggle-on' : ''}`}
                          >
                            {isReceived && <Check size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
                          </button>
                        </div>

                        <div role="cell" style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--as-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.name}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                            {formatPayDate(inc.pay_date)} • {inc.frequency || 'recurring'}
                          </div>
                        </div>

                        {/* Editable Date Input */}
                        <div role="cell" className="tm-inbound-cell-full">
                          <label htmlFor={dateInputId} className="tm-inbound-field-label">
                            Deposit Date ({inc.name})
                          </label>
                          <input
                            id={dateInputId}
                            type="date"
                            className="tm-inbound-input"
                            value={inc.pay_date || ''}
                            onChange={(e) => saveIncomeDate(inc.id, e.target.value)}
                          />
                        </div>

                        {/* Editable Total Paycheck Amount */}
                        <div role="cell" className="tm-inbound-cell-full">
                          <label htmlFor={amtInputId} className="tm-inbound-field-label">
                            Total Paycheck ({inc.name})
                          </label>
                          <div className="tm-inbound-field-wrap">
                            <span className="tm-inbound-unit tm-inbound-unit-left" aria-hidden="true">$</span>
                            <input
                              id={amtInputId}
                              type="number"
                              step="0.01"
                              min="0"
                              className="tm-inbound-input"
                              defaultValue={totalPaycheck.toFixed(2)}
                              key={`${inc.id}-${totalPaycheck}`}
                              aria-invalid={Boolean(rowErr)}
                              aria-describedby={rowErr ? `tm-inbound-err-${inc.id}` : undefined}
                              onChange={() => clearRowError(inc.id)}
                              onBlur={(e) => {
                                const raw = e.target.value.trim();
                                const val = Number(raw);
                                if (!raw || Number.isNaN(val) || val < 0) {
                                  setRowErrors((prev) => ({
                                    ...prev,
                                    [inc.id]: 'Enter a valid non-negative deposit amount.',
                                  }));
                                  return;
                                }
                                clearRowError(inc.id);
                                if (val !== totalPaycheck) {
                                  saveIncomeAmount(inc.id, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              style={{
                                borderColor: rowErr ? 'var(--as-status-error)' : undefined,
                                paddingLeft: 20,
                                textAlign: 'right',
                              }}
                            />
                          </div>
                        </div>

                        {activeAccount && bankShare ? (
                          <>
                            {/* Editable Bank Split (% or $) */}
                            <div role="cell" className="tm-inbound-cell-full">
                              <label htmlFor={splitInputId} className="tm-inbound-field-label">
                                Bank Split ({activeAccount.name})
                              </label>
                              <div className="tm-inbound-field-wrap">
                                {bankShare.type === 'fixed' && (
                                  <span className="tm-inbound-unit tm-inbound-unit-left" aria-hidden="true">$</span>
                                )}
                                <input
                                  id={splitInputId}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="tm-inbound-input"
                                  defaultValue={
                                    bankShare.type === 'fixed'
                                      ? bankShare.rawValue.toFixed(2)
                                      : bankShare.rawValue
                                  }
                                  key={`${inc.id}-${activeAccount.id}-${bankShare.rawValue}`}
                                  onChange={() => clearRowError(inc.id)}
                                  onBlur={(e) => {
                                    const raw = e.target.value.trim();
                                    const val = Number(raw);
                                    if (!raw || Number.isNaN(val) || val < 0) {
                                      setRowErrors((prev) => ({
                                        ...prev,
                                        [inc.id]: 'Enter a valid non-negative allocation split.',
                                      }));
                                      return;
                                    }
                                    clearRowError(inc.id);
                                    if (val !== bankShare.rawValue) {
                                      saveAllocationValue(inc.source_id, activeAccount.id, val, bankShare.type);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  style={{
                                    paddingLeft: bankShare.type === 'fixed' ? 20 : 8,
                                    paddingRight: bankShare.type === 'percent' ? 22 : 8,
                                    textAlign: 'right',
                                    color: bankShare.rawValue > 0 ? 'var(--as-text-primary)' : 'var(--as-text-tertiary)',
                                  }}
                                />
                                {bankShare.type === 'percent' && (
                                  <span className="tm-inbound-unit tm-inbound-unit-right" aria-hidden="true">%</span>
                                )}
                              </div>
                            </div>

                            {/* Resulting Bank Dollar Inflow */}
                            <div
                              role="cell"
                              className="tm-inbound-cell-full"
                              style={{
                                textAlign: 'right',
                                fontFamily: 'var(--as-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                color: bankShare.dollarShare > 0 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)',
                              }}
                            >
                              <span className="tm-mobile-label">BANK INFLOW</span>
                              +{fmtFull(bankShare.dollarShare)}
                            </div>
                          </>
                        ) : (
                          <div role="cell" className="tm-inbound-cell-full">
                            <span className="tm-mobile-label">BANK ROUTING SPLITS</span>
                            {activeSplits.length === 0 ? (
                              <div
                                style={{
                                  textAlign: 'right',
                                  fontFamily: 'var(--as-font-mono)',
                                  fontVariantNumeric: 'tabular-nums',
                                  fontSize: '0.75rem',
                                  color: 'var(--as-text-tertiary)',
                                }}
                              >
                                Unrouted ($0.00)
                              </div>
                            ) : (
                              <div className="tm-inbound-splits-stack">
                                {activeSplits.map(({ acct, share }) => (
                                  <button
                                    key={acct.id}
                                    type="button"
                                    className="tm-inbound-split-chip tm-touch-btn"
                                    onClick={() => setInboundModalAccountId(acct.id)}
                                    aria-label={`Edit ${acct.name} split for ${inc.name}`}
                                  >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, fontFamily: 'var(--as-font-body)', fontWeight: 500 }}>
                                      <Sliders size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {acct.name}
                                      </span>
                                    </span>
                                    <span style={{ color: 'var(--as-status-success)', fontWeight: 700, flexShrink: 0 }}>
                                      +{fmtFull(share.dollarShare)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {rowErr && (
                        <p
                          id={`tm-inbound-err-${inc.id}`}
                          role="alert"
                          style={{
                            margin: 0,
                            padding: '6px 14px',
                            background: 'var(--as-status-error-bg)',
                            borderBottom: '1px solid var(--as-border-subtle)',
                            fontSize: '0.72rem',
                            color: 'var(--as-status-error)',
                            fontWeight: 500,
                          }}
                        >
                          {rowErr}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Scheduled Summary Row */}
              <div role="rowgroup">
                <div role="row" className={`tm-inbound-footer ${activeAccount ? 'tm-inbound-footer-scoped' : ''}`}>
                  <div role="cell" className="tm-inbound-footer-hide-mobile" />
                  <div
                    role="cell"
                    style={{
                      fontFamily: 'var(--as-font-body)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--as-text-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    TOTAL SCHEDULED ({incomeItems.length})
                  </div>
                  <div role="cell" className="tm-inbound-footer-hide-mobile" />
                  <div role="cell" className="tm-inbound-footer-hide-mobile" style={{ textAlign: 'right', color: 'var(--as-text-primary)' }}>
                    {fmtFull(totalIncome)}
                  </div>
                  {activeAccount ? (
                    <>
                      <div role="cell" className="tm-inbound-footer-hide-mobile" style={{ textAlign: 'right', color: 'var(--as-text-tertiary)', fontWeight: 600 }}>
                        {scopedSharePct}%
                      </div>
                      <div
                        role="cell"
                        style={{
                          textAlign: 'right',
                          color: activeAccount.incomingTotal > 0 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)',
                        }}
                      >
                        +{fmtFull(activeAccount.incomingTotal)}
                      </div>
                    </>
                  ) : (
                    <div
                      role="cell"
                      style={{
                        textAlign: 'right',
                        color: totalRoutedAllBanks > 0 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)',
                      }}
                    >
                      +{fmtFull(totalRoutedAllBanks)} routed
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--as-bg-elevated)',
            borderTop: '1px solid var(--as-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--as-text-secondary)' }}>
            Changes recalculate safe cash, bank buffers, and paycheck windows immediately.
          </span>
          <button
            type="button"
            className="tm-touch-btn"
            onClick={() => setInboundModalAccountId(null)}
            aria-label="Done editing inbound capital"
            style={{
              background: 'var(--as-accent-primary)',
              color: 'var(--as-accent-text)',
              border: '1px solid var(--as-accent-primary)',
              borderRadius: 'var(--as-radius-sm)',
              padding: '7px 16px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
