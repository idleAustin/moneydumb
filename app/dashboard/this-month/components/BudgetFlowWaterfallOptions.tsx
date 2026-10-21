// Locked-in Option B Budget Flow Waterfall: 8-Column Category Allocation & Burn Matrix Statement.
'use client';

import { useState, useMemo, Fragment } from 'react';
import { BarChart3, ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { fmt, fmtFull, MONTH_NAMES, UnifiedObligation } from '../hooks/useSandboxMonth';
import { AccountWithMetrics } from '../hooks/sandboxMetrics';

export interface BudgetFlowWaterfallOptionsProps {
  startingBalance: number;
  totalIncome: number;
  incomeReceived?: number;
  totalExpenses: number;
  totalDebtPayments: number;
  viewMonth: number;
  viewYear: number;
  unifiedObligations: UnifiedObligation[];
  accountsWithMetrics: AccountWithMetrics[];
}

interface CategoryBucket {
  id: string;
  label: string;
  kind: 'expense' | 'debt';
  total: number;
  paid: number;
  unpaid: number;
  count: number;
  paidCount: number;
  items: UnifiedObligation[];
  startRunning: number;
  endRunning: number;
}

export default function BudgetFlowWaterfallOptions({
  startingBalance,
  totalIncome,
  incomeReceived,
  totalExpenses,
  totalDebtPayments,
  viewMonth,
  viewYear,
  unifiedObligations,
  accountsWithMetrics,
}: BudgetFlowWaterfallOptionsProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
  const nextMonthName = MONTH_NAMES[nextMonth - 1];

  const visibleAccounts = useMemo(
    () => accountsWithMetrics.filter((a) => a.id !== '__unassigned__'),
    [accountsWithMetrics]
  );

  const { endBalance, netMonthlyChange, categoryBuckets, totalPaidOutflow, totalUnpaidOutflow } = useMemo(() => {
    const peak = startingBalance + totalIncome;
    const catMap = new Map<string, UnifiedObligation[]>();
    const debtList: UnifiedObligation[] = [];

    unifiedObligations.forEach((ob) => {
      if (ob.type === 'debt') {
        debtList.push(ob);
      } else {
        const cat = ob.category || 'Uncategorized';
        const list = catMap.get(cat) || [];
        list.push(ob);
        catMap.set(cat, list);
      }
    });

    const rawExpenseGroups = Array.from(catMap.entries())
      .map(([catName, items]) => {
        const total = items.reduce((s, i) => s + i.amount, 0);
        const paid = items.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);
        return {
          id: `cat-${catName}`,
          label: catName,
          kind: 'expense' as const,
          total,
          paid,
          unpaid: Math.max(0, total - paid),
          count: items.length,
          paidCount: items.filter((i) => i.isPaid).length,
          items,
        };
      })
      .sort((a, b) => b.total - a.total);

    const debtTotal = debtList.reduce((s, i) => s + i.amount, 0) || totalDebtPayments;
    const debtPaid = debtList.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0);

    const allGroups = [
      ...rawExpenseGroups,
      {
        id: 'cat-debts',
        label: 'Credit Cards & Debts',
        kind: 'debt' as const,
        total: debtTotal,
        paid: debtPaid,
        unpaid: Math.max(0, debtTotal - debtPaid),
        count: debtList.length,
        paidCount: debtList.filter((i) => i.isPaid).length,
        items: debtList,
      },
    ];

    let running = peak;
    const buckets: CategoryBucket[] = allGroups.map((g) => {
      const startRun = running;
      const endRun = running - g.total;
      running = endRun;
      return { ...g, startRunning: startRun, endRunning: endRun };
    });

    const paidSum = buckets.reduce((s, b) => s + b.paid, 0);
    const unpaidSum = buckets.reduce((s, b) => s + b.unpaid, 0);
    const finalEnd = startingBalance + totalIncome - totalExpenses - totalDebtPayments;

    return {
      endBalance: finalEnd,
      netMonthlyChange: totalIncome - totalExpenses - totalDebtPayments,
      categoryBuckets: buckets,
      totalPaidOutflow: paidSum,
      totalUnpaidOutflow: unpaidSum,
    };
  }, [startingBalance, totalIncome, totalExpenses, totalDebtPayments, unifiedObligations]);

  const toggleExpand = (id: string) => setExpandedStepId((prev) => (prev === id ? null : id));

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
            <BarChart3 size={17} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 6 }} />
            Budget Flow Waterfall
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--as-text-muted)' }}>
            {MONTH_NAMES[viewMonth - 1]} cash bridge into {nextMonthName} {nextYear} • Click any category row to inspect bills
          </span>
        </div>
      </div>

      {/* Top Summary Telemetry Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          marginBottom: 14,
          padding: '10px 12px',
          background: 'var(--as-bg-elevated)',
          borderRadius: 'var(--as-radius-md)',
          border: '1px solid var(--as-border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Starting Cash + Inbound</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 2 }}>
            {fmtFull(startingBalance)} <span style={{ color: 'var(--as-accent-primary)', fontSize: '0.76rem' }}>+{fmtFull(totalIncome)}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Peak Monthly Cash Pool</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--as-status-info)', marginTop: 2 }}>
            {fmtFull(startingBalance + totalIncome)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Paid vs. Remaining Outflow</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.84rem', fontWeight: 700, marginTop: 2 }}>
            <span style={{ color: 'var(--as-status-success)' }}>{fmt(totalPaidOutflow)} paid</span>
            <span style={{ color: 'var(--as-text-muted)' }}> / </span>
            <span style={{ color: 'var(--as-status-warning)' }}>{fmt(totalUnpaidOutflow)} left</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Net Monthly Cash Delta</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.9rem', fontWeight: 700, color: netMonthlyChange >= 0 ? 'var(--as-status-success)' : 'var(--as-status-error)', marginTop: 2 }}>
            {netMonthlyChange >= 0 ? '+' : ''}
            {fmtFull(netMonthlyChange)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Projected {nextMonthName} 1st Start</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.95rem', fontWeight: 700, color: endBalance >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)', marginTop: 2 }}>
            {fmtFull(endBalance)}
          </div>
        </div>
      </div>

      {/* LOCKED-IN OPTION B: 8-Column Category Allocation & Burn Matrix Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>WATERFALL STEP / CATEGORY</th>
              <th style={{ textAlign: 'center' }}>ITEMS</th>
              <th style={{ textAlign: 'right' }}>PAID SO FAR</th>
              <th style={{ textAlign: 'right' }}>STILL UNPAID</th>
              <th style={{ textAlign: 'right' }}>STEP TOTAL</th>
              <th style={{ textAlign: 'right' }}>% OF INCOME</th>
              <th style={{ width: 150 }}>PAID PROGRESS</th>
              <th style={{ textAlign: 'right' }}>RUNNING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>1. Starting Bank Balances</td>
              <td style={{ textAlign: 'center', color: 'var(--as-text-muted)' }}>{visibleAccounts.length} accts</td>
              <td className="amount" style={{ color: 'var(--as-text-muted)' }}>—</td>
              <td className="amount" style={{ color: 'var(--as-text-muted)' }}>—</td>
              <td className="amount" style={{ fontWeight: 700 }}>{fmtFull(startingBalance)}</td>
              <td className="amount" style={{ color: 'var(--as-text-muted)' }}>Base</td>
              <td />
              <td className="amount" style={{ fontWeight: 700 }}>{fmtFull(startingBalance)}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>2. + Inbound Paychecks & Deposits</td>
              <td style={{ textAlign: 'center', color: 'var(--as-text-muted)' }}>Inflow</td>
              <td className="amount" style={{ color: 'var(--as-accent-primary)' }}>+{fmtFull(incomeReceived ?? totalIncome)}</td>
              <td className="amount" style={{ color: Math.max(0, totalIncome - (incomeReceived ?? totalIncome)) > 0 ? 'var(--as-status-warning)' : 'var(--as-text-muted)' }}>{fmtFull(Math.max(0, totalIncome - (incomeReceived ?? totalIncome)))}</td>
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>+{fmtFull(totalIncome)}</td>
              <td className="amount" style={{ color: 'var(--as-accent-primary)' }}>100.0%</td>
              <td />
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>{fmtFull(startingBalance + totalIncome)}</td>
            </tr>
            {categoryBuckets.map((b, idx) => {
              const pctIncome = totalIncome > 0 ? (b.total / totalIncome) * 100 : 0;
              const paidPct = b.total > 0 ? (b.paid / b.total) * 100 : 0;
              const isExpanded = expandedStepId === b.id;
              return (
                <Fragment key={b.id}>
                  <tr onClick={() => toggleExpand(b.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {isExpanded ? <ChevronDown size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" /> : <ChevronRight size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
                        {idx + 3}. − {b.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--as-font-mono)', fontSize: '0.72rem' }}>{b.paidCount}/{b.count}</td>
                    <td className="amount" style={{ color: 'var(--as-status-success)' }}>{fmtFull(b.paid)}</td>
                    <td className="amount" style={{ color: b.unpaid > 0 ? 'var(--as-status-warning)' : 'var(--as-text-muted)' }}>{fmtFull(b.unpaid)}</td>
                    <td className="amount" style={{ fontWeight: 700, color: b.kind === 'debt' ? 'var(--as-status-warning)' : 'var(--as-status-error)' }}>−{fmtFull(b.total)}</td>
                    <td className="amount" style={{ color: 'var(--as-text-secondary)' }}>{pctIncome.toFixed(1)}%</td>
                    <td>
                      <div style={{ height: 6, background: 'var(--as-bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${paidPct}%`, height: '100%', background: 'var(--as-accent-primary)' }} />
                      </div>
                    </td>
                    <td className="amount" style={{ fontWeight: 700 }}>{fmtFull(b.endRunning)}</td>
                  </tr>
                  {isExpanded && b.items.length > 0 && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--as-bg-base)', padding: '8px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
                          {b.items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', padding: '4px 8px', background: 'var(--as-bg-surface)', borderRadius: 4, border: '1px solid var(--as-border-subtle)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: item.isPaid ? 'line-through' : 'none', color: item.isPaid ? 'var(--as-text-muted)' : 'var(--as-text-primary)' }}>
                                {item.isPaid ? (
                                  <CheckCircle2 size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-success)' }} />
                                ) : (
                                  <Circle size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-muted)' }} />
                                )}
                                {item.name}
                              </span>
                              <span style={{ fontFamily: 'var(--as-font-mono)', fontWeight: 700, color: item.isPaid ? 'var(--as-text-muted)' : 'var(--as-text-primary)' }}>{fmtFull(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            <tr style={{ background: 'var(--as-bg-elevated)' }}>
              <td style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>= Projected Start of {nextMonthName}</td>
              <td style={{ textAlign: 'center', fontFamily: 'var(--as-font-mono)' }}>
                {unifiedObligations.filter((o) => o.isPaid).length}/{unifiedObligations.length}
              </td>
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-status-success)' }}>{fmtFull(totalPaidOutflow)}</td>
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-status-warning)' }}>{fmtFull(totalUnpaidOutflow)}</td>
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-status-error)' }}>−{fmtFull(totalExpenses + totalDebtPayments)}</td>
              <td className="amount" style={{ fontWeight: 700 }}>{totalIncome > 0 ? (((totalExpenses + totalDebtPayments) / totalIncome) * 100).toFixed(1) : '0.0'}%</td>
              <td />
              <td className="amount" style={{ fontSize: '0.96rem', fontWeight: 700, color: endBalance >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>{fmtFull(endBalance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
