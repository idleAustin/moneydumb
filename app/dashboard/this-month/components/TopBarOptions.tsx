/* eslint-disable @typescript-eslint/no-explicit-any */
// Locked-in Top Bar (Option A): Execution Progress & Burn Bar with Bill Checkoff Velocity and Inbound Capital Modal trigger.
'use client';

import {
  ArrowDownLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Sliders,
} from 'lucide-react';
import { fmtFull, formatPayDate } from '../hooks/useSandboxMonth';

interface TopBarOptionsProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function TopBarOptions({ state, metrics }: TopBarOptionsProps) {
  const { data, setInboundModalAccountId } = state;

  const {
    totalIncome,
    totalObligations,
    totalPaidObligations,
    totalRemainingObligations,
    totalObligationCount,
    paidObligationCount,
    dueObligationCount,
    currentLiquidSafe,
    monthEndProjected,
    overdueItems,
    dueSoonItems,
  } = metrics;

  const urgentAmount = [...overdueItems, ...dueSoonItems].reduce((s, o) => s + o.amount, 0);
  const urgentCount = overdueItems.length + dueSoonItems.length;
  const laterAmount = Math.max(0, totalRemainingObligations - urgentAmount);
  const totalBillPool = Math.max(1, totalObligations);
  const paidPct = Math.round((totalPaidObligations / totalBillPool) * 100);
  const urgentPct = Math.round((urgentAmount / totalBillPool) * 100);
  const laterPct = Math.max(0, 100 - paidPct - urgentPct);

  const incomeDatesSummary = (data?.income_items || [])
    .map((inc: any) => formatPayDate(inc.pay_date))
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      style={{
        background: 'var(--as-bg-surface)',
        border: '1px solid var(--as-border-subtle)',
        borderRadius: 'var(--as-radius-lg)',
        padding: '14px 18px',
      }}
    >
      <div className="tm-top-burn-grid">
        {/* Left: Bill Checkoff Progress Bar */}
        <div className="tm-top-burn-progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                {paidObligationCount} of {totalObligationCount} Bills Cleared ({paidPct}%)
              </span>
            </div>
            <span style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.74rem', color: 'var(--as-text-secondary)' }}>
              {fmtFull(totalPaidObligations)} / {fmtFull(totalObligations)}
            </span>
          </div>

          <div style={{ height: 8, borderRadius: 4, background: 'var(--as-bg-base)', overflow: 'hidden', display: 'flex', gap: 2 }}>
            {paidPct > 0 && <div style={{ width: `${paidPct}%`, background: 'var(--as-status-success)', height: '100%' }} />}
            {urgentPct > 0 && <div style={{ width: `${urgentPct}%`, background: 'var(--as-status-warning)', height: '100%' }} />}
            {laterPct > 0 && <div style={{ width: `${laterPct}%`, background: 'var(--as-border-strong)', height: '100%' }} />}
          </div>

          <div className="tm-top-burn-legend">
            <span style={{ color: 'var(--as-status-success)' }}>Cleared: {fmtFull(totalPaidObligations)}</span>
            <span style={{ color: 'var(--as-status-warning)' }}>Due Next 7d: {fmtFull(urgentAmount)} ({urgentCount})</span>
            <span>Later: {fmtFull(laterAmount)}</span>
          </div>
        </div>

        {/* KPI 1: Left To Pay */}
        <div className="tm-top-burn-kpi">
          <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-status-warning)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            Remaining To Pay
          </div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.18rem', fontWeight: 700, color: 'var(--as-status-error)' }}>
            −{fmtFull(totalRemainingObligations)}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)', marginTop: 2 }}>
            {dueObligationCount} unpaid obligations left
          </div>
        </div>

        {/* KPI 2: Current Safe Cash */}
        <div style={{ padding: '8px 12px', background: 'var(--as-bg-elevated)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-strong)' }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-status-info)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Briefcase size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            Current Safe Cash
          </div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.18rem', fontWeight: 700, color: currentLiquidSafe >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>
            {fmtFull(currentLiquidSafe)}
          </div>
          <div style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)', marginTop: 2 }}>
            Month-End: {fmtFull(monthEndProjected)}
          </div>
        </div>

        {/* KPI 3: Clickable Inbound Capital & Dates */}
        <div className="tm-top-burn-inbound">
          <button
            onClick={() => setInboundModalAccountId('ALL')}
            aria-label="Open Inbound Capital and Paycheck Dates modal"
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'var(--as-bg-elevated)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-status-success)', marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowDownLeft size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Inbound Capital
              </span>
              <Sliders size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-muted)' }} />
            </div>
            <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '1.14rem', fontWeight: 700, color: 'var(--as-status-success)' }}>
              +{fmtFull(totalIncome)}
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--as-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>{incomeDatesSummary || 'Edit deposit dates'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
