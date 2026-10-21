/* eslint-disable @typescript-eslint/no-explicit-any */
// Derived treasury totals, account safe-balance breakdowns, and urgency buckets for the This Month workspace.

export interface AccountWithMetrics {
  id: string;
  name: string;
  account_type: string;
  startingBalance: number;
  incomingTotal: number;
  incomingReceived: number;
  incomingPending: number;
  paidDeductions: number;
  pendingDeductions: number;
  currentSafeBalance: number;
  projectedEndBalance: number;
  linkedCount: number;
  visible: boolean;
}

export function computeSandboxMetrics(state: ReturnType<typeof import('./useSandboxMonth').useSandboxMonth>) {
  const {
    data,
    paidIncome,
    paidExpenses,
    paidDebts,
    paidAdhoc,
    adhocItems,
    getIncomeAmount,
    getExpenseAmount,
    getEffectiveDebtAmount,
    accountBalanceOverrides,
    unifiedObligations,
    selectedAccountFilter,
    accountPreset,
    hiddenAccountIds,
  } = state;

  if (!data) {
    return null;
  }

  const accounts = data.accounts || [];
  const startingBalance = accounts.reduce(
    (sum: number, a: any) => sum + Number(accountBalanceOverrides?.[a.id] ?? a.balance ?? 0),
    0
  );
  const incomeItems = data.income_items || [];
  const expenseItems = data.expense_items || [];
  const debtItems = data.debt_items || [];

  const totalIncome = incomeItems.reduce((s: number, i: any) => s + getIncomeAmount(i), 0);
  const incomeReceived = incomeItems
    .filter((i: any) => paidIncome[i.id])
    .reduce((s: number, i: any) => s + getIncomeAmount(i), 0);
  const pendingIncomeCount = incomeItems.filter((i: any) => !paidIncome[i.id]).length;

  const totalExpenses = expenseItems.reduce((s: number, e: any) => s + getExpenseAmount(e), 0);
  const expensesPaid = expenseItems
    .filter((e: any) => paidExpenses[e.id])
    .reduce((s: number, e: any) => s + getExpenseAmount(e), 0);
  const unpaidExpensesCount = expenseItems.filter((e: any) => !paidExpenses[e.id]).length;

  const totalDebtPayments = debtItems.reduce((s: number, d: any) => s + getEffectiveDebtAmount(d), 0);
  const debtsPaid = debtItems
    .filter((d: any) => paidDebts[d.id])
    .reduce((s: number, d: any) => s + getEffectiveDebtAmount(d), 0);
  const unpaidDebtsCount = debtItems.filter((d: any) => !paidDebts[d.id]).length;

  const totalAdhoc = adhocItems.reduce((s: number, a: any) => s + Number(a.amount_override || 0), 0);
  const adhocSpent = adhocItems
    .filter((a: any) => paidAdhoc[a.id])
    .reduce((s: number, a: any) => s + Number(a.amount_override || 0), 0);

  const totalObligations = totalExpenses + totalDebtPayments;
  const totalPaidObligations = expensesPaid + debtsPaid;
  const totalRemainingObligations = totalObligations - totalPaidObligations;
  const totalObligationCount = unifiedObligations.length;
  const paidObligationCount = unifiedObligations.filter((o) => o.isPaid).length;
  const dueObligationCount = totalObligationCount - paidObligationCount;

  const currentLiquidSafe = startingBalance + incomeReceived - expensesPaid - debtsPaid - adhocSpent;
  const monthEndProjected = startingBalance + totalIncome - totalExpenses - totalDebtPayments - totalAdhoc;

  const computeAllocationsFor = (items: any[]) => {
    const byAccount: Record<string, number> = {};
    if (!data.allocations) return byAccount;
    items.forEach((item) => {
      const amount = getIncomeAmount(item);
      const sourceAllocs = data.allocations.filter((alloc: any) => alloc.income_source_id === item.source_id);
      const scale = item.amount > 0 ? amount / item.amount : 0;
      sourceAllocs.forEach((alloc: any) => {
        const allocated =
          amount === 0
            ? 0
            : alloc.allocation_type === 'percent'
            ? amount * (alloc.allocation_value / 100)
            : alloc.allocation_value * scale;
        byAccount[alloc.account_id] = (byAccount[alloc.account_id] || 0) + allocated;
      });
    });
    return byAccount;
  };

  const allInflowByAcct = computeAllocationsFor(incomeItems);
  const receivedInflowByAcct = computeAllocationsFor(incomeItems.filter((i: any) => paidIncome[i.id]));

  const accountsWithMetrics: AccountWithMetrics[] = accounts.map((a: any) => {
    const linked = unifiedObligations.filter((o) => o.accountId === a.id);
    const paidDeductions = linked.filter((o) => o.isPaid).reduce((s, o) => s + o.amount, 0);
    const pendingDeductions = linked.filter((o) => !o.isPaid).reduce((s, o) => s + o.amount, 0);
    const incomingTotal = allInflowByAcct[a.id] || 0;
    const incomingReceived = receivedInflowByAcct[a.id] || 0;
    const incomingPending = Math.max(0, incomingTotal - incomingReceived);
    const startBal = Number(accountBalanceOverrides?.[a.id] ?? a.balance ?? 0);
    const currentSafeBalance = startBal + incomingReceived - paidDeductions;
    const projectedEndBalance = startBal + incomingTotal - paidDeductions - pendingDeductions;

    let visible = !hiddenAccountIds[a.id];
    if (accountPreset === 'checking') {
      visible = visible && String(a.account_type).toLowerCase() === 'checking';
    } else if (accountPreset === 'active') {
      visible = visible && (startBal > 0 || linked.length > 0 || incomingTotal > 0);
    }

    return {
      id: a.id,
      name: a.name,
      account_type: a.account_type || 'checking',
      startingBalance: startBal,
      incomingTotal,
      incomingReceived,
      incomingPending,
      paidDeductions,
      pendingDeductions,
      currentSafeBalance,
      projectedEndBalance,
      linkedCount: linked.length,
      visible,
    };
  });

  const filteredObligations = selectedAccountFilter
    ? unifiedObligations.filter((o) => o.accountId === selectedAccountFilter)
    : unifiedObligations;

  const overdueItems = unifiedObligations.filter((o) => o.urgency === 'overdue');
  const dueSoonItems = unifiedObligations.filter((o) => o.urgency === 'due_soon');

  return {
    startingBalance,
    totalIncome,
    incomeReceived,
    pendingIncomeCount,
    totalExpenses,
    expensesPaid,
    unpaidExpensesCount,
    totalDebtPayments,
    debtsPaid,
    unpaidDebtsCount,
    totalAdhoc,
    adhocSpent,
    totalObligations,
    totalPaidObligations,
    totalRemainingObligations,
    totalObligationCount,
    paidObligationCount,
    dueObligationCount,
    currentLiquidSafe,
    monthEndProjected,
    accountsWithMetrics,
    filteredObligations,
    overdueItems,
    dueSoonItems,
  };
}
