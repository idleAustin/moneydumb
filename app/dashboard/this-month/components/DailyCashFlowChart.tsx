/* eslint-disable @typescript-eslint/no-explicit-any */
// Locked-in Option D Daily Cash Flow Trajectory: Compact Auto-Zoomed Step Curve + 31-Day Interactive Cash-Burn Heatmap Strip.
'use client';

import { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingDown, Calendar, ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react';
import { fmt, fmtFull, UnifiedObligation } from '../hooks/useSandboxMonth';
import { AccountWithMetrics } from '../hooks/sandboxMetrics';

export interface ChartProps {
  startingBalance: number;
  incomeItems: any[];
  expenseItems: any[];
  debtItems: any[];
  allocations?: any[];
  accountsWithMetrics?: AccountWithMetrics[];
  unifiedObligations?: UnifiedObligation[];
  getIncomeAmount: (item: any) => number;
  getExpenseAmount: (item: any) => number;
  getDebtAmount: (item: any) => number;
  viewMonth: number;
  viewYear: number;
}

const RichDayTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div
      style={{
        background: 'var(--as-bg-overlay)',
        border: '1px solid var(--as-border-strong)',
        borderRadius: 'var(--as-radius-md)',
        padding: '10px 12px',
        fontSize: '0.73rem',
        fontFamily: 'var(--as-font-mono)',
        minWidth: 230,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid var(--as-border-subtle)', fontFamily: 'var(--as-font-body)' }}>
        <span style={{ fontWeight: 700, color: 'var(--as-text-primary)' }}>Day {row.day} ({row.label})</span>
        <span style={{ fontFamily: 'var(--as-font-mono)', fontWeight: 700, color: 'var(--as-accent-primary)' }}>
          Bal: {fmtFull(row.balance)}
        </span>
      </div>

      {row.dailyIn > 0 && (
        <div style={{ color: 'var(--as-status-success)', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>+ Inflow on Day {row.day}:</span>
          <strong>+{fmtFull(row.dailyIn)}</strong>
        </div>
      )}
      {row.dailyOut > 0 && (
        <div style={{ color: 'var(--as-status-error)', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>− Bills/Debts on Day {row.day}:</span>
          <strong>−{fmtFull(row.dailyOut)}</strong>
        </div>
      )}

      {row.events && row.events.length > 0 ? (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--as-border-subtle)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {row.events.slice(0, 6).map((ev: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: '0.68rem' }}>
              <span style={{ color: 'var(--as-text-secondary)', fontFamily: 'var(--as-font-body)' }}>{ev.name}</span>
              <span style={{ color: ev.kind === 'in' ? 'var(--as-status-success)' : 'var(--as-status-warning)', fontWeight: 600 }}>
                {ev.kind === 'in' ? '+' : '−'}{fmtFull(ev.amount)}
              </span>
            </div>
          ))}
          {row.events.length > 6 && (
            <div style={{ fontSize: '0.64rem', color: 'var(--as-text-muted)' }}>
              +{row.events.length - 6} more items on Day {row.day}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-body)' }}>
          No scheduled deposits or bills on Day {row.day}
        </div>
      )}
    </div>
  );
};

export function DailyCashFlowChart({
  startingBalance,
  incomeItems,
  expenseItems,
  debtItems,
  allocations = [],
  accountsWithMetrics = [],
  unifiedObligations = [],
  getIncomeAmount,
  getExpenseAmount,
  getDebtAmount,
  viewMonth,
  viewYear,
}: ChartProps) {
  const [accountScope, setAccountScope] = useState<'ALL' | 'CHECKING' | string>('ALL');
  const [selectedDay, setSelectedDay] = useState<number>(15);

  const visibleAccounts = useMemo(
    () => accountsWithMetrics.filter((a) => a.id !== '__unassigned__'),
    [accountsWithMetrics]
  );

  const { chartData, minBalDay, maxOutDay, scopedStartBal, scopedEndBal } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const dailyIncome: Record<number, number> = {};
    const dailyOutflow: Record<number, number> = {};
    const dailyEvents: Record<number, { name: string; amount: number; kind: 'in' | 'out'; accountName?: string }[]> = {};

    const isAccountIncluded = (acctId: string | null | undefined) => {
      if (accountScope === 'ALL') return true;
      if (accountScope === 'CHECKING') {
        const acct = visibleAccounts.find((a) => a.id === acctId);
        return acct ? String(acct.account_type).toLowerCase() === 'checking' : visibleAccounts.length === 0;
      }
      return acctId === accountScope;
    };

    let startBal = startingBalance;
    if (accountScope === 'CHECKING') {
      const checkingAccts = visibleAccounts.filter((a) => a.account_type === 'checking');
      if (checkingAccts.length > 0) {
        startBal = checkingAccts.reduce((s, a) => s + a.startingBalance, 0);
      }
    } else if (accountScope !== 'ALL') {
      const targetAcct = visibleAccounts.find((a) => a.id === accountScope);
      if (targetAcct) startBal = targetAcct.startingBalance;
    }

    incomeItems.forEach((item: any) => {
      const amt = getIncomeAmount(item);
      let day = 1;
      const rawDate = item.pay_date || item.expected_date;
      if (rawDate) {
        const parsed = parseInt(String(rawDate).split('-')[2], 10);
        if (!isNaN(parsed)) day = Math.min(daysInMonth, Math.max(1, parsed));
      }

      const itemAllocs = allocations.filter(
        (al: any) =>
          (item.source_id && al.income_source_id === item.source_id) ||
          al.income_event_id === item.item_ref_id ||
          al.income_event_id === item.id
      );

      if (itemAllocs.length > 0) {
        const scale = item.amount > 0 ? amt / item.amount : 0;
        itemAllocs.forEach((al: any) => {
          const allocAmt =
            amt === 0
              ? 0
              : al.allocation_type === 'percent'
              ? amt * (Number(al.allocation_value || 0) / 100)
              : al.allocation_value != null
              ? Number(al.allocation_value) * scale
              : Number(al.amount || 0);
          if (allocAmt > 0 && isAccountIncluded(al.account_id)) {
            dailyIncome[day] = (dailyIncome[day] || 0) + allocAmt;
            if (!dailyEvents[day]) dailyEvents[day] = [];
            dailyEvents[day].push({
              name: item.source_name || item.name || 'Paycheck Deposit',
              amount: allocAmt,
              kind: 'in',
              accountName: al.account_name,
            });
          }
        });
      } else if (isAccountIncluded(item.account_id)) {
        dailyIncome[day] = (dailyIncome[day] || 0) + amt;
        if (!dailyEvents[day]) dailyEvents[day] = [];
        dailyEvents[day].push({
          name: item.source_name || item.name || 'Paycheck Deposit',
          amount: amt,
          kind: 'in',
        });
      }
    });

    const processOutflowItem = (name: string, dueDay: number, amt: number, acctId: string | null) => {
      const d = Math.min(daysInMonth, Math.max(1, dueDay || 1));
      if (isAccountIncluded(acctId)) {
        dailyOutflow[d] = (dailyOutflow[d] || 0) + amt;
        if (!dailyEvents[d]) dailyEvents[d] = [];
        dailyEvents[d].push({ name, amount: amt, kind: 'out' });
      }
    };

    if (unifiedObligations.length > 0) {
      unifiedObligations.forEach((ob) => {
        processOutflowItem(ob.name, ob.dueDay, ob.amount, ob.accountId);
      });
    } else {
      expenseItems.forEach((item: any) => {
        processOutflowItem(item.name, item.due_day || 1, getExpenseAmount(item), item.account_id || null);
      });
      debtItems.forEach((item: any) => {
        processOutflowItem(item.name, item.due_day || 1, getDebtAmount(item), item.account_id || null);
      });
    }

    const rows: any[] = [];
    let balance = startBal;
    let lowestRow = { day: 1, balance: startBal };
    let heaviestOutRow = { day: 1, dailyOut: 0, count: 0 };

    for (let d = 1; d <= daysInMonth; d++) {
      const inc = dailyIncome[d] || 0;
      const out = dailyOutflow[d] || 0;
      balance += inc - out;

      const roundedBal = Math.round(balance * 100) / 100;
      if (roundedBal < lowestRow.balance) {
        lowestRow = { day: d, balance: roundedBal };
      }
      const outEvs = (dailyEvents[d] || []).filter((e) => e.kind === 'out');
      if (out > heaviestOutRow.dailyOut) {
        heaviestOutRow = { day: d, dailyOut: out, count: outEvs.length };
      }

      rows.push({
        day: d,
        label: `${viewMonth}/${d}`,
        balance: roundedBal,
        dailyIn: Math.round(inc * 100) / 100,
        dailyOut: Math.round(out * 100) / 100,
        netDelta: Math.round((inc - out) * 100) / 100,
        events: dailyEvents[d] || [],
      });
    }

    return {
      chartData: rows,
      minBalDay: lowestRow,
      maxOutDay: heaviestOutRow,
      scopedStartBal: startBal,
      scopedEndBal: rows[rows.length - 1]?.balance ?? startBal,
    };
  }, [
    startingBalance,
    incomeItems,
    expenseItems,
    debtItems,
    allocations,
    visibleAccounts,
    unifiedObligations,
    getIncomeAmount,
    getExpenseAmount,
    getDebtAmount,
    viewMonth,
    viewYear,
    accountScope,
  ]);

  const inspectedRow = chartData.find((r) => r.day === selectedDay) || chartData[chartData.length - 1] || chartData[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Account Scope Filter Pills + 4 Trajectory KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Landmark size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>
            Curve Scope:
          </span>
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'CHECKING', label: 'Checking Only' },
            ...visibleAccounts.map((a) => ({ id: a.id, label: a.name })),
          ].map((scope) => {
            const isActive = accountScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => setAccountScope(scope.id)}
                aria-label={`Filter cash flow trajectory by ${scope.label}`}
                style={{
                  padding: '3px 9px',
                  borderRadius: 'var(--as-radius-pill)',
                  border: isActive ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                  background: isActive ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                  color: isActive ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {scope.label}
              </button>
            );
          })}
        </div>

        {/* 4 Compact Trajectory Callout Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontFamily: 'var(--as-font-mono)', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--as-text-secondary)' }}>
            Open: <strong>{fmtFull(scopedStartBal)}</strong>
          </span>
          <span>•</span>
          <span style={{ color: minBalDay.balance < 500 ? 'var(--as-status-error)' : 'var(--as-status-warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            Lowest Day {minBalDay.day}: <strong>{fmtFull(minBalDay.balance)}</strong>
          </span>
          <span>•</span>
          <span style={{ color: 'var(--as-status-error)' }}>
            Peak Drop Day {maxOutDay.day}: <strong>−{fmtFull(maxOutDay.dailyOut)}</strong> ({maxOutDay.count} items)
          </span>
          <span>•</span>
          <span style={{ color: 'var(--as-accent-primary)' }}>
            Day {chartData.length} End: <strong>{fmtFull(scopedEndBal)}</strong>
          </span>
        </div>
      </div>

      {/* LOCKED-IN OPTION D: Compact Zoomed Curve + 31-Day Interactive Cash-Burn Heatmap Strip */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '100%', height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 6, right: 12, left: 8, bottom: 0 }}
              onClick={(state: any) => {
                if (state?.activeLabel) setSelectedDay(Number(state.activeLabel));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--as-border-subtle)" />
              <XAxis dataKey="day" stroke="var(--as-text-muted)" tick={{ fill: 'var(--as-text-muted)', fontSize: 9, fontFamily: 'var(--as-font-mono)' }} tickLine={false} />
              <YAxis
                domain={[(dataMin: number) => Math.floor(dataMin - 300), (dataMax: number) => Math.ceil(dataMax + 300)]}
                stroke="var(--as-text-muted)"
                tick={{ fill: 'var(--as-text-muted)', fontSize: 9, fontFamily: 'var(--as-font-mono)' }}
                tickFormatter={(v) => fmt(v)}
                width={54}
              />
              <RechartsTooltip content={<RichDayTooltip />} />
              <ReferenceLine y={minBalDay.balance} stroke="var(--as-status-error)" strokeDasharray="4 4" opacity={0.65} />
              <Area
                type="stepAfter"
                dataKey="balance"
                stroke="var(--as-accent-primary)"
                strokeWidth={2.2}
                fill="var(--as-accent-primary)"
                fillOpacity={0.14}
                activeDot={{ r: 5, fill: 'var(--as-accent-primary)', stroke: 'var(--as-bg-base)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 31-Day Clickable Cash-Burn Tiles */}
        <div className="tm-heatmap-grid">
          {chartData.map((row) => {
            const hasIn = row.dailyIn > 0;
            const hasOut = row.dailyOut > 0;
            const isSelected = row.day === inspectedRow?.day;
            return (
              <button
                key={row.day}
                onClick={() => setSelectedDay(row.day)}
                aria-label={`Inspect Day ${row.day} cash flow events`}
                style={{
                  padding: '5px 6px',
                  borderRadius: 'var(--as-radius-sm)',
                  border: isSelected
                    ? '1px solid var(--as-accent-primary)'
                    : hasOut || hasIn
                    ? '1px solid var(--as-border-strong)'
                    : '1px solid var(--as-border-subtle)',
                  background: isSelected
                    ? 'var(--as-accent-muted)'
                    : hasIn
                    ? 'var(--as-status-success-bg)'
                    : hasOut
                    ? 'var(--as-bg-elevated)'
                    : 'var(--as-bg-base)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--as-font-mono)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--as-text-muted)' }}>
                  <span>D{row.day}</span>
                  {row.events.length > 0 && <span>{row.events.length}x</span>}
                </div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: hasIn ? 'var(--as-status-success)' : hasOut ? 'var(--as-status-error)' : 'var(--as-text-muted)' }}>
                  {hasIn ? `+${fmt(row.dailyIn)}` : hasOut ? `−${fmt(row.dailyOut)}` : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Cashflow Event Inspector Bar (Click any day on the chart or tile grid to inspect) */}
      {inspectedRow && (
        <div
          style={{
            background: 'var(--as-bg-elevated)',
            border: '1px solid var(--as-border-subtle)',
            borderRadius: 'var(--as-radius-md)',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
              Day {inspectedRow.day} Activity ({inspectedRow.events.length} scheduled items • Ending Bal: {fmtFull(inspectedRow.balance)})
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)' }}>
              • Click any day tile or point on the curve to inspect
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {inspectedRow.events.length === 0 ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--as-text-muted)' }}>No bills or deposits scheduled on Day {inspectedRow.day}</span>
            ) : (
              inspectedRow.events.map((ev: any, i: number) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 'var(--as-radius-pill)',
                    background: 'var(--as-bg-surface)',
                    border: '1px solid var(--as-border-subtle)',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--as-font-mono)',
                  }}
                >
                  {ev.kind === 'in' ? (
                    <ArrowDownLeft size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-success)' }} />
                  ) : (
                    <ArrowUpRight size={10} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-error)' }} />
                  )}
                  <span style={{ fontFamily: 'var(--as-font-body)', fontWeight: 600 }}>{ev.name}</span>
                  <span style={{ color: ev.kind === 'in' ? 'var(--as-status-success)' : 'var(--as-status-warning)', fontWeight: 700 }}>
                    {ev.kind === 'in' ? '+' : '−'}{fmtFull(ev.amount)}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
