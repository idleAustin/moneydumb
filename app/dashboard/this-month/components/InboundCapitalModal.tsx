/* eslint-disable @typescript-eslint/no-explicit-any */
// Modal for inspecting and editing inbound paychecks, deposit dates, amounts, and per-bank routing splits.
'use client';

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

  if (!inboundModalAccountId || !data) {
    return null;
  }

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
      aria-label="Edit Inbound Capital and Deposit Dates"
      onClick={() => setInboundModalAccountId(null)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        zIndex: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 740,
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-strong)',
          borderRadius: 'var(--as-radius-lg)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
        }}
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
              }}
            >
              <ArrowDownLeft size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                {activeAccount
                  ? `${activeAccount.name} — Inbound Deposits & Schedule`
                  : 'All Inbound Capital & Deposit Dates'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--as-text-muted)' }}>
                Edit paycheck dates, total deposit amounts, received status, and bank routing splits.
              </div>
            </div>
          </div>

          <button
            onClick={() => setInboundModalAccountId(null)}
            aria-label="Close inbound capital modal"
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--as-radius-md)',
              background: 'var(--as-bg-surface)',
              border: '1px solid var(--as-border-subtle)',
              color: 'var(--as-text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
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
            <Landmark size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-muted)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)', marginRight: 4 }}>
              Inspect Bank:
            </span>
            <button
              onClick={() => setInboundModalAccountId('ALL')}
              aria-label="View all inbound capital across accounts"
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-pill)',
                border: isAllAccounts ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                background: isAllAccounts ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                color: isAllAccounts ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.7rem',
                fontWeight: isAllAccounts ? 700 : 500,
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
                  onClick={() => setInboundModalAccountId(acct.id)}
                  aria-label={`Inspect inbound capital for ${acct.name}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--as-radius-pill)',
                    border: isSelected ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                    background: isSelected ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                    color: isSelected ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                    fontSize: '0.7rem',
                    fontWeight: isSelected ? 700 : 500,
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
          <div style={{ padding: '8px 12px', background: 'var(--as-bg-elevated)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>
              {activeAccount ? `${activeAccount.name} Inbound Total` : 'Monthly Inbound Total'}
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-status-success)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingTotal : totalIncome)}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--as-bg-elevated)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>
              Received & Cleared
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-accent-primary)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingReceived : incomeReceived)}
            </div>
          </div>

          <div style={{ padding: '8px 12px', background: 'var(--as-bg-elevated)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>
              Pending Scheduled
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.08rem', fontWeight: 700, color: 'var(--as-status-warning)', marginTop: 2 }}>
              +{fmtFull(activeAccount ? activeAccount.incomingPending : Math.max(0, totalIncome - incomeReceived))}
            </div>
          </div>
        </div>

        {/* Inbound Paycheck / Deposit Rows */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

            return (
              <div
                key={inc.id}
                className={`tm-inbound-row ${activeAccount ? 'tm-inbound-row-scoped' : ''}`}
                style={{
                  border: isReceived
                    ? '1px solid var(--as-accent-primary)'
                    : '1px solid var(--as-border-subtle)',
                }}
              >
                <div>
                  <button
                    onClick={() => setPaidIncome((p) => ({ ...p, [inc.id]: !p[inc.id] }))}
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
                  <div style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)' }}>
                    {formatPayDate(inc.pay_date)} • {inc.frequency || 'recurring'}
                  </div>
                </div>

                {/* Editable Date Input */}
                <div className="tm-inbound-cell-full">
                  <span className="tm-mobile-label">DEPOSIT DATE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Calendar size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }} />
                    <input
                      type="date"
                      className="tm-inbound-input"
                      value={inc.pay_date || ''}
                      aria-label={`Edit deposit date for ${inc.name}`}
                      onChange={(e) => saveIncomeDate(inc.id, e.target.value)}
                      style={{
                        background: 'var(--as-bg-surface)',
                        border: '1px solid var(--as-border-subtle)',
                        borderRadius: 'var(--as-radius-sm)',
                        color: 'var(--as-text-primary)',
                        fontFamily: 'var(--as-font-mono)',
                        fontSize: '0.72rem',
                        padding: '4px 6px',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>

                {/* Editable Total Paycheck Amount */}
                <div className="tm-inbound-cell-full" style={{ textAlign: 'right' }}>
                  <span className="tm-mobile-label">TOTAL PAYCHECK</span>
                  <input
                    type="number"
                    className="tm-inbound-input"
                    defaultValue={totalPaycheck}
                    key={`${inc.id}-${totalPaycheck}`}
                    aria-label={`Edit total paycheck amount for ${inc.name}`}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val) && val !== totalPaycheck) {
                        saveIncomeAmount(inc.id, val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    style={{
                      background: 'var(--as-bg-surface)',
                      border: '1px solid var(--as-border-subtle)',
                      borderRadius: 'var(--as-radius-sm)',
                      color: 'var(--as-text-primary)',
                      fontFamily: 'var(--as-font-mono)',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      width: 96,
                      textAlign: 'right',
                    }}
                  />
                </div>

                {activeAccount && bankShare ? (
                  <>
                    {/* Editable Bank Split (% or $) */}
                    <div className="tm-inbound-cell-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span className="tm-mobile-label" style={{ marginRight: 'auto' }}>BANK SPLIT</span>
                      <input
                        type="number"
                        className="tm-inbound-input"
                        defaultValue={bankShare.rawValue}
                        key={`${inc.id}-${activeAccount.id}-${bankShare.rawValue}`}
                        aria-label={`Edit ${activeAccount.name} allocation for ${inc.name}`}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!Number.isNaN(val) && val !== bankShare.rawValue) {
                            saveAllocationValue(inc.source_id, activeAccount.id, val, bankShare.type);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        style={{
                          background: 'var(--as-bg-surface)',
                          border: '1px solid var(--as-border-subtle)',
                          borderRadius: 'var(--as-radius-sm)',
                          color: 'var(--as-accent-primary)',
                          fontFamily: 'var(--as-font-mono)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '4px 6px',
                          width: 64,
                          textAlign: 'right',
                        }}
                      />
                      <span style={{ fontSize: '0.68rem', color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-mono)' }}>
                        {bankShare.type === 'percent' ? '%' : 'USD'}
                      </span>
                    </div>

                    {/* Resulting Bank Dollar Inflow */}
                    <div className="tm-inbound-cell-full" style={{ textAlign: 'right', fontFamily: 'var(--as-font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--as-status-success)' }}>
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
                          onClick={() => setInboundModalAccountId(acct.id)}
                          aria-label={`Edit ${acct.name} split for ${inc.name}`}
                          style={{
                            background: 'var(--as-bg-surface)',
                            border: '1px solid var(--as-border-subtle)',
                            borderRadius: 'var(--as-radius-sm)',
                            padding: '2px 6px',
                            fontSize: '0.64rem',
                            fontFamily: 'var(--as-font-mono)',
                            color: 'var(--as-text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Sliders size={9} strokeWidth={2.0} aria-hidden="true" focusable="false" />
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
            );
          })}
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
          }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)' }}>
            Changes recalculate safe cash, bank buffers, and paycheck windows immediately.
          </span>
          <button
            onClick={() => setInboundModalAccountId(null)}
            aria-label="Done editing inbound capital"
            style={{
              background: 'var(--as-accent-primary)',
              color: 'var(--as-accent-text)',
              border: 'none',
              borderRadius: 'var(--as-radius-md)',
              padding: '6px 14px',
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

