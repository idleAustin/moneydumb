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
          <h3>
            <BarChart3 size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
            Budget Flow Waterfall
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--as-text-secondary)' }}>
            {MONTH_NAMES[viewMonth - 1]} cash bridge into {nextMonthName} {nextYear} • Expand any category row to inspect bills
          </span>
        </div>
      </div>

      {/* Top Summary Telemetry Strip (recessed --as-bg-base inside card) */}
      <div className="tm-waterfall-kpi-grid">
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Starting Cash + Inbound</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem', fontWeight: 700, color: 'var(--as-text-primary)', marginTop: 2 }}>
            {fmtFull(startingBalance)} <span style={{ color: totalIncome > 0.005 ? 'var(--as-accent-primary)' : 'var(--as-text-tertiary)', fontSize: '0.76rem' }}>{totalIncome > 0.005 ? `+${fmtFull(totalIncome)}` : fmtFull(0)}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Peak Monthly Cash Pool</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem', fontWeight: 700, color: Math.abs(startingBalance + totalIncome) < 0.005 ? 'var(--as-text-tertiary)' : 'var(--as-status-info)', marginTop: 2 }}>
            {fmtFull(startingBalance + totalIncome)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Paid vs. Remaining Outflow</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem', fontWeight: 700, marginTop: 2 }}>
            <span style={{ color: totalPaidOutflow > 0.005 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)' }}>{fmt(totalPaidOutflow)} paid</span>
            <span style={{ color: 'var(--as-text-tertiary)' }}> / </span>
            <span style={{ color: totalUnpaidOutflow > 0.005 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)' }}>{fmt(totalUnpaidOutflow)} left</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Net Monthly Cash Delta</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem', fontWeight: 700, color: Math.abs(netMonthlyChange) < 0.005 ? 'var(--as-text-tertiary)' : netMonthlyChange > 0 ? 'var(--as-status-success)' : 'var(--as-status-error)', marginTop: 2 }}>
            {Math.abs(netMonthlyChange) < 0.005 ? fmtFull(0) : netMonthlyChange > 0 ? `+${fmtFull(netMonthlyChange)}` : fmtFull(netMonthlyChange)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--as-text-tertiary)' }}>Projected {nextMonthName} 1st Start</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.92rem', fontWeight: 700, color: Math.abs(endBalance) < 0.005 ? 'var(--as-text-tertiary)' : endBalance > 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)', marginTop: 2 }}>
            {fmtFull(endBalance)}
          </div>
        </div>
      </div>

      {/* LOCKED-IN OPTION B: 8-Column Category Allocation & Burn Matrix Table */}
      <div className="table-responsive">
          <table className="data-table" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
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
                <td style={{ textAlign: 'center', color: 'var(--as-text-tertiary)', fontFamily: 'var(--as-font-mono)' }}>{visibleAccounts.length} accts</td>
                <td className="amount" style={{ color: 'var(--as-text-tertiary)' }}>—</td>
                <td className="amount" style={{ color: 'var(--as-text-tertiary)' }}>—</td>
                <td className="amount" style={{ fontWeight: 700 }}>{fmtFull(startingBalance)}</td>
                <td className="amount" style={{ color: 'var(--as-text-tertiary)' }}>Base</td>
                <td />
                <td className="amount" style={{ fontWeight: 700, color: startingBalance >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>{fmtFull(startingBalance)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>2. + Inbound Paychecks &amp; Deposits</td>
                <td style={{ textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Inflow</td>
                <td className="amount" style={{ color: 'var(--as-accent-primary)' }}>+{fmtFull(incomeReceived ?? totalIncome)}</td>
                <td className="amount" style={{ color: Math.max(0, totalIncome - (incomeReceived ?? totalIncome)) > 0 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)' }}>{fmtFull(Math.max(0, totalIncome - (incomeReceived ?? totalIncome)))}</td>
                <td className="amount" style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>+{fmtFull(totalIncome)}</td>
                <td className="amount" style={{ color: 'var(--as-accent-primary)' }}>100.0%</td>
                <td />
                <td className="amount" style={{ fontWeight: 700, color: startingBalance + totalIncome >= 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>{fmtFull(startingBalance + totalIncome)}</td>
              </tr>
              {categoryBuckets.map((b, idx) => {
                const pctIncome = totalIncome > 0 ? (b.total / totalIncome) * 100 : 0;
                const paidPct = b.total > 0 ? (b.paid / b.total) * 100 : 0;
                const isExpanded = expandedStepId === b.id;
                const detailRowId = `tm-waterfall-detail-${b.id}`;
                return (
                  <Fragment key={b.id}>
                    <tr>
                      <td style={{ fontWeight: 600 }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(b.id)}
                          aria-expanded={isExpanded}
                          aria-controls={detailRowId}
                          className="tm-waterfall-expand-btn"
                        >
                          {isExpanded ? (
                            <ChevronDown size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                          ) : (
                            <ChevronRight size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                          )}
                          <span>{idx + 3}. − {b.label}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.72rem', color: 'var(--as-text-secondary)' }}>{b.paidCount}/{b.count}</td>
                      <td className="amount" style={{ color: b.paid > 0.005 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)' }}>{fmtFull(b.paid)}</td>
                      <td className="amount" style={{ color: b.unpaid > 0.005 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)' }}>{fmtFull(b.unpaid)}</td>
                      <td className="amount" style={{ fontWeight: 700, color: b.kind === 'debt' ? 'var(--as-status-warning)' : 'var(--as-status-error)' }}>−{fmtFull(b.total)}</td>
                      <td className="amount" style={{ color: 'var(--as-text-secondary)' }}>{pctIncome.toFixed(1)}%</td>
                      <td>
                        <div
                          role="progressbar"
                          aria-valuenow={Math.round(paidPct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${b.label} paid progress`}
                          style={{ height: 6, background: 'var(--as-bg-base)', borderRadius: 3, overflow: 'hidden' }}
                        >
                          <div style={{ width: `${paidPct}%`, height: '100%', background: 'var(--as-accent-primary)' }} />
                        </div>
                      </td>
                      <td className="amount" style={{ fontWeight: 700, color: b.endRunning >= 0 ? 'var(--as-text-primary)' : 'var(--as-status-error)' }}>{fmtFull(b.endRunning)}</td>
                    </tr>
                    {isExpanded && (
                      <tr id={detailRowId}>
                        <td colSpan={8} style={{ background: 'var(--as-bg-base)', padding: '10px 16px', whiteSpace: 'normal' }}>
                          {b.items.length === 0 ? (
                            <div style={{ fontSize: '0.74rem', color: 'var(--as-text-secondary)' }}>
                              No obligations in {b.label} for this month.
                            </div>
                          ) : (
                            <div className="tm-waterfall-detail-grid">
                              {b.items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: '0.74rem', padding: '5px 8px', background: 'var(--as-bg-surface)', borderRadius: 4, border: '1px solid var(--as-border-subtle)' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: item.isPaid ? 'line-through' : 'none', color: item.isPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)', minWidth: 0 }}>
                                    {item.isPaid ? (
                                      <CheckCircle2 size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-success)', flexShrink: 0 }} />
                                    ) : (
                                      <Circle size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', flexShrink: 0 }} />
                                    )}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                  </span>
                                  <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: item.isPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)', flexShrink: 0 }}>{fmtFull(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>= Projected Start of {nextMonthName}</td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--as-text-secondary)' }}>
                  {unifiedObligations.filter((o) => o.isPaid).length}/{unifiedObligations.length}
                </td>
                <td className="amount" style={{ fontWeight: 700, color: totalPaidOutflow > 0.005 ? 'var(--as-status-success)' : 'var(--as-text-tertiary)' }}>{fmtFull(totalPaidOutflow)}</td>
                <td className="amount" style={{ fontWeight: 700, color: totalUnpaidOutflow > 0.005 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)' }}>{fmtFull(totalUnpaidOutflow)}</td>
                <td className="amount" style={{ fontWeight: 700, color: (totalExpenses + totalDebtPayments) > 0.005 ? 'var(--as-status-error)' : 'var(--as-text-tertiary)' }}>
                  {(totalExpenses + totalDebtPayments) > 0.005 ? `−${fmtFull(totalExpenses + totalDebtPayments)}` : fmtFull(0)}
                </td>
                <td className="amount" style={{ fontWeight: 700 }}>{totalIncome > 0 ? (((totalExpenses + totalDebtPayments) / totalIncome) * 100).toFixed(1) : '0.0'}%</td>
                <td />
                <td className="amount" style={{ fontSize: '0.92rem', fontWeight: 700, color: Math.abs(endBalance) < 0.005 ? 'var(--as-text-tertiary)' : endBalance > 0 ? 'var(--as-accent-primary)' : 'var(--as-status-error)' }}>{fmtFull(endBalance)}</td>
              </tr>
            </tfoot>
          </table>
      </div>
    </div>
  );
}
