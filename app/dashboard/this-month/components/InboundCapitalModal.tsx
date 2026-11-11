/* eslint-disable @typescript-eslint/no-explicit-any */
// Modal for inspecting and editing inbound paychecks, deposit dates, amounts, and per-bank routing splits.
'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  Calendar,
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
              width: 34,
              height: 34,
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

        {/* Account Scope Selector Bar */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--as-bg-base)',
            borderBottom: '1px solid var(--as-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Landmark size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)' }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)', marginRight: 4 }}>
              Inspect Bank:
            </span>
            <button
              type="button"
              className="tm-touch-btn"
              onClick={() => setInboundModalAccountId('ALL')}
              aria-pressed={isAllAccounts}
              aria-label="View all inbound capital across accounts"
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-pill)',
                border: isAllAccounts ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                background: isAllAccounts ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                color: isAllAccounts ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.72rem',
                fontWeight: isAllAccounts ? 700 : 600,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
              }}
            >
              All Banks (+{fmtFull(totalIncome)})
            </button>
            {accountsWithMetrics.map((acct) => {
              const isSelected = inboundModalAccountId === acct.id;
              return (
                <button
                  key={acct.id}
                  type="button"
                  className="tm-touch-btn"
                  onClick={() => setInboundModalAccountId(acct.id)}
                  aria-pressed={isSelected}
                  aria-label={`Inspect inbound capital for ${acct.name}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--as-radius-pill)',
                    border: isSelected ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                    background: isSelected ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                    color: isSelected ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 700 : 600,
                    fontVariantNumeric: 'tabular-nums',
                    cursor: 'pointer',
                    fontFamily: 'var(--as-font-body)',
                  }}
                >
                  {acct.name} (+{fmtFull(acct.incomingTotal)})
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Telemetry Strip */}
        <div className="tm-inbound-summary-grid">
          <div style={{ padding: '8px 12px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>
              {activeAccount ? `${activeAccount.name} Inbound Total` : 'Monthly Inbound Total'}
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-status-success)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingTotal : totalIncome)}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>
              Received &amp; Cleared
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-accent-primary)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingReceived : incomeReceived)}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>
              Pending Scheduled
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-status-warning)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingPending : Math.max(0, totalIncome - incomeReceived))}
            </div>
          </div>
        </div>

        {/* Inbound Paycheck / Deposit Rows */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
            <>
              <div className={`tm-inbound-row-header ${activeAccount ? 'tm-inbound-row-header-scoped' : ''}`}>
                <div>REC&apos;D</div>
                <div>INBOUND SOURCE</div>
                <div>DEPOSIT DATE</div>
                <div style={{ textAlign: 'right' }}>TOTAL PAYCHECK</div>
                {activeAccount ? (
                  <>
                    <div style={{ textAlign: 'right' }}>BANK SPLIT</div>
                    <div style={{ textAlign: 'right' }}>BANK INFLOW</div>
                  </>
                ) : (
                  <div style={{ textAlign: 'right' }}>BANK ROUTING SPLITS</div>
                )}
              </div>

              {incomeItems.map((inc: any) => {
                const isReceived = !!paidIncome[inc.id];
                const totalPaycheck = getIncomeAmount(inc);
                const bankShare = activeAccount ? computeBankShare(inc, activeAccount.id) : null;
                const dateInputId = `tm-inbound-date-${inc.id}`;
                const amtInputId = `tm-inbound-amt-${inc.id}`;
                const splitInputId = activeAccount ? `tm-inbound-split-${inc.id}-${activeAccount.id}` : '';
                const rowErr = rowErrors[inc.id];

                return (
                  <div key={inc.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      className={`tm-inbound-row ${activeAccount ? 'tm-inbound-row-scoped' : ''}`}
                      style={{
                        border: isReceived
                          ? '1px solid var(--as-accent-primary)'
                          : '1px solid var(--as-border-subtle)',
                      }}
                    >
                      <div>
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

                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                          {inc.name}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                          {formatPayDate(inc.pay_date)} • {inc.frequency || 'recurring'}
                        </div>
                      </div>

                      {/* Editable Date Input */}
                      <div className="tm-inbound-cell-full">
                        <label htmlFor={dateInputId} className="tm-inbound-field-label">
                          Deposit Date ({inc.name})
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }} />
                          <input
                            id={dateInputId}
                            type="date"
                            className="tm-inbound-input"
                            value={inc.pay_date || ''}
                            onChange={(e) => saveIncomeDate(inc.id, e.target.value)}
                            style={{
                              background: 'var(--as-bg-base)',
                              border: '1px solid var(--as-border-subtle)',
                              borderRadius: 'var(--as-radius-sm)',
                              color: 'var(--as-text-primary)',
                              fontFamily: 'var(--as-font-mono)',
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: '0.74rem',
                              padding: '5px 8px',
                              width: '100%',
                            }}
                          />
                        </div>
                      </div>

                      {/* Editable Total Paycheck Amount */}
                      <div className="tm-inbound-cell-full" style={{ textAlign: 'right' }}>
                        <label htmlFor={amtInputId} className="tm-inbound-field-label">
                          Total Paycheck ({inc.name})
                        </label>
                        <input
                          id={amtInputId}
                          type="number"
                          step="0.01"
                          min="0"
                          className="tm-inbound-input"
                          defaultValue={totalPaycheck}
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
                            background: 'var(--as-bg-base)',
                            border: rowErr ? '1px solid var(--as-status-error)' : '1px solid var(--as-border-subtle)',
                            borderRadius: 'var(--as-radius-sm)',
                            color: 'var(--as-text-primary)',
                            fontFamily: 'var(--as-font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            padding: '5px 8px',
                            width: 100,
                            textAlign: 'right',
                          }}
                        />
                      </div>

                      {activeAccount && bankShare ? (
                        <>
                          {/* Editable Bank Split (% or $) */}
                          <div className="tm-inbound-cell-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <label htmlFor={splitInputId} className="tm-inbound-field-label" style={{ marginRight: 'auto' }}>
                              Bank Split ({activeAccount.name})
                            </label>
                            <input
                              id={splitInputId}
                              type="number"
                              step="0.01"
                              min="0"
                              className="tm-inbound-input"
                              defaultValue={bankShare.rawValue}
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
                                background: 'var(--as-bg-base)',
                                border: '1px solid var(--as-border-subtle)',
                                borderRadius: 'var(--as-radius-sm)',
                                color: 'var(--as-accent-primary)',
                                fontFamily: 'var(--as-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                padding: '5px 6px',
                                width: 68,
                                textAlign: 'right',
                              }}
                            />
                            <span style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', fontFamily: 'var(--as-font-mono)' }}>
                              {bankShare.type === 'percent' ? '%' : 'USD'}
                            </span>
                          </div>

                          {/* Resulting Bank Dollar Inflow */}
                          <div className="tm-inbound-cell-full" style={{ textAlign: 'right', fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.82rem', fontWeight: 700, color: 'var(--as-status-success)' }}>
                            <span className="tm-mobile-label">BANK INFLOW</span>
                            +{fmtFull(bankShare.dollarShare)}
                          </div>
                        </>
                      ) : (
                        <div className="tm-inbound-cell-full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
                          {accountsWithMetrics.map((acct) => {
                            const share = computeBankShare(inc, acct.id);
                            if (share.dollarShare <= 0) return null;
                            return (
                              <button
                                key={acct.id}
                                type="button"
                                className="tm-touch-btn"
                                onClick={() => setInboundModalAccountId(acct.id)}
                                aria-label={`Edit ${acct.name} split for ${inc.name}`}
                                style={{
                                  background: 'var(--as-bg-base)',
                                  border: '1px solid var(--as-border-subtle)',
                                  borderRadius: 'var(--as-radius-sm)',
                                  padding: '3px 8px',
                                  fontSize: '0.6875rem',
                                  fontFamily: 'var(--as-font-mono)',
                                  fontVariantNumeric: 'tabular-nums',
                                  color: 'var(--as-text-secondary)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Sliders size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                                <span>{acct.name}:</span>
                                <span style={{ color: 'var(--as-status-success)', fontWeight: 700 }}>
                                  +{fmtFull(share.dollarShare)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {rowErr && (
                      <p
                        id={`tm-inbound-err-${inc.id}`}
                        role="alert"
                        style={{ margin: '0 4px', fontSize: '0.72rem', color: 'var(--as-status-error)', fontWeight: 500 }}
                      >
                        {rowErr}
                      </p>
                    )}
                  </div>
                );
              })}
            </>
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
