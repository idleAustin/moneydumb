// Forecast & Flow deck: Locked Option D Cash Flow Trajectory + Locked Option B Waterfall Matrix + Locked Option D Forward Projection.
'use client';

import { TrendingUp } from 'lucide-react';
import { MONTH_NAMES } from '../hooks/useSandboxMonth';
import { DailyCashFlowChart } from './DailyCashFlowChart';
import BudgetFlowWaterfallOptions from './BudgetFlowWaterfallOptions';
import ForwardProjectionOptions from './ForwardProjectionOptions';

export { DailyCashFlowChart };

interface ForecastAndFlowDeckProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function ForecastAndFlowDeck({
  state,
  metrics,
}: ForecastAndFlowDeckProps) {
  const {
    data,
    viewMonth,
    viewYear,
    getIncomeAmount,
    getExpenseAmount,
    getEffectiveDebtAmount,
  } = state;

  const {
    startingBalance,
    totalIncome,
    totalExpenses,
    totalDebtPayments,
  } = metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Locked-In Option D Daily Cash Flow Trajectory */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <TrendingUp size={18} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 6 }} />
              Daily Cash Flow Trajectory
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--as-text-muted)' }}>
              Auto-scaled balance curve + 31-day interactive cash-burn heatmap across {MONTH_NAMES[viewMonth - 1]}
            </span>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <DailyCashFlowChart
            startingBalance={startingBalance}
            incomeItems={data.income_items || []}
            expenseItems={data.expense_items || []}
            debtItems={data.debt_items || []}
            allocations={data.allocations || []}
            accountsWithMetrics={metrics.accountsWithMetrics}
            unifiedObligations={state.unifiedObligations}
            getIncomeAmount={getIncomeAmount}
            getExpenseAmount={getExpenseAmount}
            getDebtAmount={getEffectiveDebtAmount}
            viewMonth={viewMonth}
            viewYear={viewYear}
          />
        </div>
      </div>

      {/* 2. Locked-In Option B Budget Flow Waterfall (8-Column Category Allocation & Burn Matrix) */}
      <BudgetFlowWaterfallOptions
        startingBalance={startingBalance}
        totalIncome={totalIncome}
        incomeReceived={metrics.incomeReceived}
        totalExpenses={totalExpenses}
        totalDebtPayments={totalDebtPayments}
        viewMonth={viewMonth}
        viewYear={viewYear}
        unifiedObligations={state.unifiedObligations}
        accountsWithMetrics={metrics.accountsWithMetrics}
      />

      {/* 3. Locked-In Option D Forward Projection & Debt Payoff Horizon (Creditor Knock-Out Matrix) */}
      <ForwardProjectionOptions
        startingBalance={startingBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        totalDebtPayments={totalDebtPayments}
        viewMonth={viewMonth}
        viewYear={viewYear}
        unifiedObligations={state.unifiedObligations}
        strategy={state.committedPlan?.strategy}
      />
    </div>
  );
}
