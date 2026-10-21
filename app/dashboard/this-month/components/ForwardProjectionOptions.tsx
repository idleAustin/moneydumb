// Locked-in Option D Forward Projection & Debt Payoff Horizon: Creditor-by-Month Knock-Out Matrix.
'use client';

import { useState, useMemo } from 'react';
import { Compass, TrendingUp, Sparkles } from 'lucide-react';
import { fmt, fmtFull, MONTH_NAMES, UnifiedObligation } from '../hooks/useSandboxMonth';

export interface ForwardProjectionOptionsProps {
  startingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  viewMonth: number;
  viewYear: number;
  unifiedObligations: UnifiedObligation[];
  strategy?: 'snowball' | 'avalanche';
}

interface SimulatedDebtDetail {
  id: string;
  name: string;
  apr: number;
  startBalance: number;
  payment: number;
  interestCharged: number;
  principalPaid: number;
  endBalance: number;
  justPaidOff: boolean;
  alreadyPaidOff: boolean;
  minPaymentFreed: number;
}

interface SimulatedMonthRow {
  monthIndex: number;
  monthNum: number;
  yearNum: number;
  label: string;
  shortLabel: string;
  startingCash: number;
  income: number;
  expenses: number;
  debtPayments: number;
  endingCash: number;
  surplus: number;
  remainingDebt: number;
  netWorth: number;
  paidOffNames: string[];
  debtDetails: SimulatedDebtDetail[];
}

export default function ForwardProjectionOptions({
  startingBalance,
  totalIncome,
  totalExpenses,
  totalDebtPayments,
  viewMonth,
  viewYear,
  unifiedObligations,
  strategy = 'avalanche',
}: ForwardProjectionOptionsProps) {
  const [horizonMonths, setHorizonMonths] = useState<3 | 6 | 12>(6);
  const [extraMonthlyBoost, setExtraMonthlyBoost] = useState<number>(0);

  const { simulatedMonths, initialTotalDebt, totalEliminatedDebt, allKnockedOutCards, monthlyFreedCash } = useMemo(() => {
    const debtObligations = unifiedObligations
      .filter((o) => o.type === 'debt')
      .map((o) => ({
        id: o.id,
        name: o.name,
        balance: Number(o.debtBalance ?? o.rawItem?.balance ?? o.amount * 12),
        apr: Number(o.interestRate ?? o.rawItem?.interest_rate ?? 19.99),
        minPayment: Number(o.minimumPayment ?? o.baseAmount ?? o.amount),
        plannedPayment: Number(o.amount),
      }))
      .sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr));

    const startDebtSum = debtObligations.reduce((s, d) => s + d.balance, 0);
    const liveBalances: Record<string, number> = {};
    const paidOffTracker: Record<string, boolean> = {};
    debtObligations.forEach((d) => {
      liveBalances[d.id] = d.balance;
      paidOffTracker[d.id] = d.balance <= 0.01;
    });

    const rows: SimulatedMonthRow[] = [];
    let runningCash = startingBalance;
    const totalPlannedDebtBudget = Math.max(
      totalDebtPayments + extraMonthlyBoost,
      debtObligations.reduce((s, d) => s + d.plannedPayment, 0) + extraMonthlyBoost
    );

    const knockedOutSet = new Map<string, { name: string; monthLabel: string; minPayment: number }>();

    for (let m = 0; m < horizonMonths; m++) {
      const mNum = ((viewMonth - 1 + m) % 12) + 1;
      const yNum = viewMonth + m > 12 ? viewYear + Math.floor((viewMonth - 1 + m) / 12) : viewYear;
      const label = `${MONTH_NAMES[mNum - 1]} ${yNum}`;
      const shortLabel = `${MONTH_NAMES[mNum - 1].slice(0, 3)} '${String(yNum).slice(-2)}`;

      let remainingBudget = totalPlannedDebtBudget;
      let actualMonthDebtPmt = 0;
      const details: SimulatedDebtDetail[] = [];
      const paidOffThisMonth: string[] = [];

      debtObligations.forEach((d) => {
        const prevBal = liveBalances[d.id];
        if (prevBal <= 0.01) {
          details.push({
            id: d.id,
            name: d.name,
            apr: d.apr,
            startBalance: 0,
            payment: 0,
            interestCharged: 0,
            principalPaid: 0,
            endBalance: 0,
            justPaidOff: false,
            alreadyPaidOff: true,
            minPaymentFreed: d.minPayment,
          });
          return;
        }

        const monthlyInterest = prevBal * (d.apr / 100 / 12);
        const totalOwed = prevBal + monthlyInterest;
        const targetPmt = Math.min(totalOwed, Math.min(remainingBudget, d.plannedPayment));
        remainingBudget = Math.max(0, remainingBudget - targetPmt);
        actualMonthDebtPmt += targetPmt;
        const nextBal = Math.max(0, totalOwed - targetPmt);
        liveBalances[d.id] = nextBal;

        details.push({
          id: d.id,
          name: d.name,
          apr: d.apr,
          startBalance: prevBal,
          payment: targetPmt,
          interestCharged: monthlyInterest,
          principalPaid: Math.max(0, targetPmt - monthlyInterest),
          endBalance: nextBal,
          justPaidOff: false,
          alreadyPaidOff: false,
          minPaymentFreed: d.minPayment,
        });
      });

      if (remainingBudget > 0.01) {
        for (const det of details) {
          if (det.endBalance > 0.01 && remainingBudget > 0.01) {
            const extra = Math.min(det.endBalance, remainingBudget);
            det.payment += extra;
            det.principalPaid = Math.max(0, det.payment - det.interestCharged);
            det.endBalance = Math.max(0, det.endBalance - extra);
            liveBalances[det.id] = det.endBalance;
            remainingBudget -= extra;
            actualMonthDebtPmt += extra;
          }
        }
      }

      details.forEach((det) => {
        if (!paidOffTracker[det.id] && det.endBalance <= 0.01) {
          paidOffTracker[det.id] = true;
          det.justPaidOff = true;
          paidOffThisMonth.push(det.name);
          knockedOutSet.set(det.id, { name: det.name, monthLabel: shortLabel, minPayment: det.minPaymentFreed });
        }
      });

      const monthSurplus = totalIncome - totalExpenses - actualMonthDebtPmt;
      const endCash = runningCash + monthSurplus;
      const remDebt = details.reduce((s, d) => s + d.endBalance, 0);

      rows.push({
        monthIndex: m,
        monthNum: mNum,
        yearNum: yNum,
        label,
        shortLabel,
        startingCash: runningCash,
        income: totalIncome,
        expenses: totalExpenses,
        debtPayments: actualMonthDebtPmt,
        endingCash: endCash,
        surplus: monthSurplus,
        remainingDebt: remDebt,
        netWorth: endCash - remDebt,
        paidOffNames: paidOffThisMonth,
        debtDetails: details,
      });

      runningCash = endCash;
    }

    const lastRow = rows[rows.length - 1];
    const eliminated = Math.max(0, startDebtSum - (lastRow?.remainingDebt ?? startDebtSum));
    const knockedList = Array.from(knockedOutSet.values());
    const freedSum = knockedList.reduce((s, k) => s + k.minPayment, 0);

    return {
      simulatedMonths: rows,
      initialTotalDebt: startDebtSum,
      totalEliminatedDebt: eliminated,
      allKnockedOutCards: knockedList,
      monthlyFreedCash: freedSum,
    };
  }, [unifiedObligations, startingBalance, totalIncome, totalExpenses, totalDebtPayments, viewMonth, viewYear, horizonMonths, extraMonthlyBoost, strategy]);

  const lastMonth = simulatedMonths[simulatedMonths.length - 1];

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
            <Compass size={17} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 6 }} />
            Forward Projection & Debt Payoff Horizon
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--as-text-muted)' }}>
            Creditor-by-month knock-out matrix with snowball/avalanche rollover and extra payment simulator
          </span>
        </div>
      </div>

      {/* Interactive Controls Bar: Horizon (3M / 6M / 12M) + What-If Debt Accelerator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12, padding: '8px 12px', background: 'var(--as-bg-base)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Horizon:</span>
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setHorizonMonths(m)}
              aria-label={`Project ${m} months forward`}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--as-radius-pill)',
                border: horizonMonths === m ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                background: horizonMonths === m ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                color: horizonMonths === m ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {m} Months
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Sparkles size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>What-If Extra Debt Boost:</span>
          {[0, 250, 500, 1000].map((boost) => (
            <button
              key={boost}
              onClick={() => setExtraMonthlyBoost(boost)}
              aria-label={`Simulate adding ${fmt(boost)} extra per month toward debt payoff`}
              style={{
                padding: '3px 9px',
                borderRadius: 'var(--as-radius-pill)',
                border: extraMonthlyBoost === boost ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                background: extraMonthlyBoost === boost ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                color: extraMonthlyBoost === boost ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.68rem',
                fontFamily: 'var(--as-font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {boost === 0 ? 'Current Plan' : `+${fmt(boost)}/mo`}
            </button>
          ))}
        </div>
      </div>

      {/* 4-KPI Horizon Telemetry Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 8, marginBottom: 14, padding: '10px 12px', background: 'var(--as-bg-elevated)', borderRadius: 'var(--as-radius-md)', border: '1px solid var(--as-border-subtle)' }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>{lastMonth?.shortLabel} Projected Ending Cash</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--as-accent-primary)', marginTop: 2 }}>
            {fmtFull(lastMonth?.endingCash || 0)} <span style={{ fontSize: '0.72rem', color: 'var(--as-status-success)' }}>(+{fmt((lastMonth?.endingCash || 0) - startingBalance)})</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Remaining Debt in {horizonMonths}M</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--as-status-warning)', marginTop: 2 }}>
            {fmtFull(lastMonth?.remainingDebt || 0)} <span style={{ fontSize: '0.72rem', color: 'var(--as-status-success)' }}>(−{fmt(totalEliminatedDebt)} paid down)</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Cards Knocked Out ({horizonMonths}M)</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--as-status-info)', marginTop: 2 }}>
            {allKnockedOutCards.length} Debts Eliminated
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--as-text-muted)' }}>Monthly Cash Flow Unlocked</div>
          <div style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--as-status-success)', marginTop: 2 }}>
            +{fmtFull(monthlyFreedCash)}/mo freed
          </div>
        </div>
      </div>

      {/* LOCKED-IN OPTION D: Creditor-by-Month Knock-Out Matrix Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>CREDITOR / METRIC</th>
              <th style={{ textAlign: 'right' }}>START BAL</th>
              {simulatedMonths.map((m) => (
                <th key={m.monthIndex} style={{ textAlign: 'right' }}>{m.shortLabel.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'var(--as-bg-elevated)' }}>
              <td style={{ fontWeight: 700, color: 'var(--as-accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Total Projected Liquid Cash
              </td>
              <td className="amount" style={{ fontWeight: 700 }}>{fmt(startingBalance)}</td>
              {simulatedMonths.map((m) => (
                <td key={m.monthIndex} className="amount" style={{ fontWeight: 700, color: 'var(--as-accent-primary)' }}>{fmt(m.endingCash)}</td>
              ))}
            </tr>
            {(simulatedMonths[0]?.debtDetails || []).map((firstDebt) => (
              <tr key={firstDebt.id}>
                <td style={{ fontWeight: 600 }}>
                  {firstDebt.name} <span style={{ fontSize: '0.66rem', color: 'var(--as-text-muted)' }}>({firstDebt.apr}%)</span>
                </td>
                <td className="amount" style={{ color: 'var(--as-text-secondary)' }}>{fmt(firstDebt.startBalance)}</td>
                {simulatedMonths.map((m) => {
                  const cell = m.debtDetails.find((d) => d.id === firstDebt.id);
                  const bal = cell?.endBalance ?? 0;
                  return (
                    <td
                      key={m.monthIndex}
                      className="amount"
                      style={{
                        fontWeight: bal <= 0.01 ? 700 : 500,
                        color: bal <= 0.01 ? 'var(--as-status-success)' : 'var(--as-status-warning)',
                      }}
                    >
                      {bal <= 0.01 ? 'PAID OFF' : fmt(bal)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ background: 'var(--as-bg-elevated)' }}>
              <td style={{ fontWeight: 700, color: 'var(--as-status-warning)' }}>Total Remaining Debt</td>
              <td className="amount" style={{ fontWeight: 700, color: 'var(--as-status-warning)' }}>{fmt(initialTotalDebt)}</td>
              {simulatedMonths.map((m) => (
                <td key={m.monthIndex} className="amount" style={{ fontWeight: 700, color: 'var(--as-status-warning)' }}>{fmt(m.remainingDebt)}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
