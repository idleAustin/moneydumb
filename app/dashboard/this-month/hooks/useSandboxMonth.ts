/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared state, financial calculations, and persistence hook for the This Month sandbox workspace and UI variants.
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function formatPayDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}${getOrdinal(d.getDate())}`;
}

function getMonogram(name: string): string {
  if (!name) return 'OB';
  const words = name.trim().split(/\s+/);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const BENCHMARK_DATA = {
  totals: { total_balance: 14850 },
  accounts: [
    { id: 'sofi', name: 'Apex Checking', account_type: 'checking', balance: 4250.0 },
    { id: 'arvest', name: 'Meridian Primary', account_type: 'checking', balance: 2140.0 },
    { id: 'sofisavings', name: 'Apex Reserve Vault', account_type: 'savings', balance: 8460.0 },
    { id: 'onechecking', name: 'Civic Operating', account_type: 'checking', balance: 0.0 },
  ],
  allocations: [
    { income_source_id: 'inc-1', account_id: 'sofi', allocation_type: 'percent', allocation_value: 60 },
    { income_source_id: 'inc-1', account_id: 'arvest', allocation_type: 'percent', allocation_value: 25 },
    { income_source_id: 'inc-1', account_id: 'sofisavings', allocation_type: 'percent', allocation_value: 15 },
  ],
  income_items: [
    { id: 'inc-pay-1', source_id: 'inc-1', name: 'Primary Salary — Cycle 1', amount: 3225, pay_date: '2026-10-01', frequency: 'semimonthly' },
    { id: 'inc-pay-2', source_id: 'inc-1', name: 'Primary Salary — Cycle 2', amount: 3225, pay_date: '2026-10-15', frequency: 'semimonthly' },
  ],
  expense_items: [
    { id: 'exp-1', name: 'Primary Mortgage / Lease', category_name: 'Housing', amount: 1850, due_day: 1, account_id: 'sofi', url: '' },
    { id: 'exp-2', name: 'HOA Community Assessment', category_name: 'Housing', amount: 125, due_day: 5, account_id: 'sofi', url: '' },
    { id: 'exp-3', name: 'Homeowners Hazard Policy', category_name: 'Housing', amount: 145, due_day: 10, account_id: 'sofi', url: '' },
    { id: 'exp-4', name: 'Lawn & Pest Maintenance', category_name: 'Housing', amount: 85, due_day: 18, account_id: 'arvest', url: '' },
    { id: 'exp-5', name: 'Taxes', category_name: 'Taxes', amount: 250, due_day: 10, account_id: 'sofi', url: '' },
    { id: 'exp-6', name: 'Property Tax Escrow', category_name: 'Taxes', amount: 310, due_day: 15, account_id: 'sofi', url: '' },
    { id: 'exp-7', name: 'Primary SUV Auto Note', category_name: 'Transportation', amount: 420, due_day: 15, account_id: 'arvest', url: '' },
    { id: 'exp-8', name: 'Commuter Sedan Note', category_name: 'Transportation', amount: 310, due_day: 15, account_id: 'arvest', url: '' },
    { id: 'exp-9', name: 'Utility Truck Note', category_name: 'Transportation', amount: 640, due_day: 15, account_id: 'sofi', url: '' },
    { id: 'exp-10', name: 'Family Crossover Note', category_name: 'Transportation', amount: 580, due_day: 15, account_id: 'sofi', url: '' },
    { id: 'exp-11', name: 'Multi-Vehicle Auto Insurance', category_name: 'Transportation', amount: 285, due_day: 22, account_id: 'arvest', url: '' },
    { id: 'exp-12', name: 'Primary Fiber Internet', category_name: 'Utilities', amount: 95, due_day: 2, account_id: 'sofi', url: '' },
    { id: 'exp-13', name: 'Backup Broadband Line', category_name: 'Utilities', amount: 75, due_day: 14, account_id: 'sofi', url: '' },
    { id: 'exp-14', name: 'Municipal District Fee', category_name: 'Utilities', amount: 45, due_day: 15, account_id: 'arvest', url: '' },
    { id: 'exp-15', name: 'Municipal Waste Service', category_name: 'Utilities', amount: 38, due_day: 15, account_id: 'arvest', url: '' },
    { id: 'exp-16', name: 'Municipal Water & Sewer', category_name: 'Utilities', amount: 65, due_day: 15, account_id: 'arvest', url: '' },
    { id: 'exp-17', name: 'Metro Electric Utility', category_name: 'Utilities', amount: 160, due_day: 20, account_id: 'sofi', url: '' },
    { id: 'exp-18', name: 'Natural Gas Heating', category_name: 'Utilities', amount: 74.5, due_day: 24, account_id: 'arvest', url: '' },
    { id: 'exp-19', name: 'Mobile Wireless Plan', category_name: 'Utilities', amount: 165, due_day: 26, account_id: 'sofi', url: '' },
    { id: 'exp-20', name: 'Apple One Premier', category_name: 'Subscriptions', amount: 37.95, due_day: 3, account_id: 'sofi', url: '' },
    { id: 'exp-21', name: 'YouTube TV Base Plan', category_name: 'Subscriptions', amount: 72.99, due_day: 8, account_id: 'sofi', url: '' },
    { id: 'exp-22', name: 'ChatGPT Plus & Claude Pro', category_name: 'Subscriptions', amount: 40, due_day: 11, account_id: 'sofi', url: '' },
    { id: 'exp-23', name: 'AWS & Cloudflare Infra', category_name: 'Subscriptions', amount: 45, due_day: 16, account_id: 'arvest', url: '' },
    { id: 'exp-24', name: 'Spotify Duo Membership', category_name: 'Subscriptions', amount: 16.99, due_day: 19, account_id: 'sofi', url: '' },
    { id: 'exp-25', name: 'Costco Executive Annual', category_name: 'Subscriptions', amount: 15, due_day: 23, account_id: 'arvest', url: '' },
    { id: 'exp-26', name: 'Gym & Recovery Club', category_name: 'Subscriptions', amount: 89, due_day: 25, account_id: 'sofi', url: '' },
    { id: 'exp-27', name: 'Term Life Policy', category_name: 'Insurance', amount: 68, due_day: 12, account_id: 'arvest', url: '' },
    { id: 'exp-28', name: 'Umbrella Liability Policy', category_name: 'Insurance', amount: 42, due_day: 28, account_id: 'arvest', url: '' },
  ],
  debt_items: [
    { id: 'debt-1', name: 'Sapphire Reserve Card', debt_type: 'credit_card', balance: 2850, interest_rate: 21.9, minimum_payment: 95, amount_due_immediately: 250, calculated_payment: 450, payment_strategy: 'payoff_plan', due_day: 19, account_id: 'sofi', url: '' },
    { id: 'debt-2', name: 'Amex Platinum Charge', debt_type: 'credit_card', balance: 1420, interest_rate: 24.9, minimum_payment: 65, amount_due_immediately: 150, calculated_payment: 320, payment_strategy: 'payoff_plan', due_day: 12, account_id: 'sofi', url: '' },
    { id: 'debt-3', name: 'Citi Double Cash', debt_type: 'credit_card', balance: 3190, interest_rate: 19.9, minimum_payment: 88, amount_due_immediately: 88, calculated_payment: 180, payment_strategy: 'minimum', due_day: 16, account_id: 'arvest', url: '' },
    { id: 'debt-4', name: 'Apple Card Monthly', debt_type: 'credit_card', balance: 940, interest_rate: 18.4, minimum_payment: 45, amount_due_immediately: 95, calculated_payment: 95, payment_strategy: 'minimum', due_day: 30, account_id: 'sofi', url: '' },
    { id: 'debt-5', name: 'Capital One Venture X', debt_type: 'credit_card', balance: 1760, interest_rate: 22.4, minimum_payment: 55, amount_due_immediately: 110, calculated_payment: 160, payment_strategy: 'minimum', due_day: 21, account_id: 'sofi', url: '' },
    { id: 'debt-6', name: 'Discover It Balance', debt_type: 'credit_card', balance: 680, interest_rate: 17.9, minimum_payment: 35, amount_due_immediately: 35, calculated_payment: 80, payment_strategy: 'minimum', due_day: 25, account_id: 'arvest', url: '' },
    { id: 'debt-7', name: 'Amazon Prime Visa', debt_type: 'credit_card', balance: 510, interest_rate: 20.9, minimum_payment: 30, amount_due_immediately: 60, calculated_payment: 60, payment_strategy: 'minimum', due_day: 8, account_id: 'sofi', url: '' },
    { id: 'debt-8', name: 'Best Buy 0% Promo', debt_type: 'credit_card', balance: 1100, interest_rate: 0.0, minimum_payment: 50, amount_due_immediately: 50, calculated_payment: 50, payment_strategy: 'minimum', due_day: 17, account_id: 'arvest', url: '' },
    { id: 'debt-9', name: 'Personal Consolidation Loan', debt_type: 'personal_loan', balance: 8400, interest_rate: 8.9, minimum_payment: 245, amount_due_immediately: 245, calculated_payment: 245, payment_strategy: 'minimum', due_day: 15, account_id: 'sofi', url: '' },
    { id: 'debt-10', name: 'Federal Student Loan', debt_type: 'student_loan', balance: 14200, interest_rate: 5.2, minimum_payment: 182, amount_due_immediately: 182, calculated_payment: 182, payment_strategy: 'minimum', due_day: 27, account_id: 'arvest', url: '' },
  ],
};

export interface UnifiedObligation {
  id: string;
  rawItem: any;
  type: 'expense' | 'debt';
  name: string;
  category: string;
  dueDay: number;
  dueLabel: string;
  countdownLabel: string;
  urgency: 'overdue' | 'due_soon' | 'upcoming' | 'cleared';
  accountId: string | null;
  accountName: string;
  amount: number;
  baseAmount: number;
  isPaid: boolean;
  isOverridden: boolean;
  monogram: string;
  url?: string;
  debtBalance?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueImmediately?: number;
  calculatedPayment?: number;
  paymentStrategy?: string;
  activeTier?: string;
}

export function useSandboxMonth(defaultMemoryOnly = false) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(defaultMemoryOnly);
  const [usingBenchmark, setUsingBenchmark] = useState(false);

  const [paidIncome, setPaidIncome] = useState<Record<string, boolean>>({});
  const [paidExpenses, setPaidExpenses] = useState<Record<string, boolean>>({});
  const [paidDebts, setPaidDebts] = useState<Record<string, boolean>>({});
  const [paidAdhoc, setPaidAdhoc] = useState<Record<string, boolean>>({});
  const [incomeAmounts, setIncomeAmounts] = useState<Record<string, number>>({});
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, number>>({});
  const [debtAmounts, setDebtAmounts] = useState<Record<string, number>>({});
  const [debtPayTiers, setDebtPayTiers] = useState<Record<string, string>>({});
  const [expenseAccounts, setExpenseAccounts] = useState<Record<string, string>>({});
  const [debtAccounts, setDebtAccounts] = useState<Record<string, string>>({});
  const [accountBalanceOverrides, setAccountBalanceOverrides] = useState<Record<string, number>>({});
  const [adhocItems, setAdhocItems] = useState<any[]>([]);

  const [committedPlan, setCommittedPlan] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);
  const [usePaymentStrategy, setUsePaymentStrategy] = useState(true);

  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [accountPreset, setAccountPreset] = useState<'active' | 'checking' | 'all'>('all');
  const [hiddenAccountIds, setHiddenAccountIds] = useState<Record<string, boolean>>({});
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'execute' | 'forecast'>('execute');
  const [inspectedObligationId, setInspectedObligationId] = useState<string | null>(null);
  const [inboundModalAccountId, setInboundModalAccountId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  const applyBenchmarkState = useCallback(() => {
    setData(BENCHMARK_DATA);
    setUsingBenchmark(true);
    setPaidIncome({ 'inc-pay-1': true, 'inc-pay-2': true });
    setPaidExpenses({ 'exp-1': true });
    setPaidDebts({});
    setPaidAdhoc({});
    setIncomeAmounts({});
    setExpenseAmounts({});
    setDebtAmounts({});
    setDebtPayTiers({});
    setExpenseAccounts({});
    setDebtAccounts({});
    setAccountBalanceOverrides({});
    setSelectedAccountFilter(null);
    setAdhocItems([]);
    setCommittedPlan({ strategy: 'avalanche', target_months: 11, extra_payment: 350 });
  }, []);

  const loadMonth = useCallback(async (m: number, y: number) => {
    setLoading(true);
    try {
      const [monthData, instance, committed, proj] = await Promise.all([
        axios.get('/api/summary/this-month').then((r) => r.data),
        axios.post('/api/sandbox/instances', { month: m, year: y }).then((r) => r.data),
        axios.get('/api/debts/payoff/committed').then((r) => r.data).catch(() => null),
        axios.get('/api/summary/budget-projection', { params: { months: 3 } }).then((r) => r.data).catch(() => null),
      ]);

      const hasLiveItems =
        (monthData?.expense_items?.length || 0) +
          (monthData?.debt_items?.length || 0) +
          (monthData?.accounts?.length || 0) >
        0;

      if (!hasLiveItems && defaultMemoryOnly) {
        applyBenchmarkState();
        setLoading(false);
        return;
      }

      setUsingBenchmark(false);
      setData(monthData);
      setInstanceId(instance.id);
      setCommittedPlan(committed);
      setProjection(proj);

      const items = await axios.get(`/api/sandbox/instances/${instance.id}/items`).then((r) => r.data);
      const pi: Record<string, boolean> = {};
      const pe: Record<string, boolean> = {};
      const pd: Record<string, boolean> = {};
      const pa: Record<string, boolean> = {};
      const ia: Record<string, number> = {};
      const ea: Record<string, number> = {};
      const da: Record<string, number> = {};
      const eAcct: Record<string, string> = {};
      const dAcct: Record<string, string> = {};
      const adhocs: any[] = [];

      items.forEach((item: any) => {
        if (item.item_type === 'income') {
          if (item.is_paid) pi[item.item_ref_id] = true;
          if (item.amount_override != null) ia[item.item_ref_id] = item.amount_override;
        } else if (item.item_type === 'expense') {
          if (item.is_paid) pe[item.item_ref_id] = true;
          if (item.amount_override != null) ea[item.item_ref_id] = item.amount_override;
          if (item.account_id) eAcct[item.item_ref_id] = item.account_id;
        } else if (item.item_type === 'debt') {
          if (item.is_paid) pd[item.item_ref_id] = true;
          if (item.amount_override != null) da[item.item_ref_id] = item.amount_override;
          if (item.account_id) dAcct[item.item_ref_id] = item.account_id;
        } else if (item.item_type === 'adhoc') {
          adhocs.push(item);
          if (item.is_paid) pa[item.id] = true;
        }
      });

      setPaidIncome(pi);
      setPaidExpenses(pe);
      setPaidDebts(pd);
      setPaidAdhoc(pa);
      setIncomeAmounts(ia);
      setExpenseAmounts(ea);
      setDebtAmounts(da);
      setExpenseAccounts(eAcct);
      setDebtAccounts(dAcct);
      setAccountBalanceOverrides({});
      setAdhocItems(adhocs);
    } catch {
      applyBenchmarkState();
    } finally {
      setLoading(false);
    }
  }, [applyBenchmarkState, defaultMemoryOnly]);

  useEffect(() => {
    loadMonth(viewMonth, viewYear);
  }, [viewMonth, viewYear, loadMonth]);

  const persistState = useCallback(() => {
    if (memoryOnly || usingBenchmark || !instanceId || !data) return;
    const items: any[] = [];
    data.income_items.forEach((item: any) => {
      items.push({
        item_type: 'income',
        item_ref_id: item.id,
        is_paid: !!paidIncome[item.id],
        amount_override: incomeAmounts[item.id] ?? null,
        account_id: null,
      });
    });
    data.expense_items.forEach((item: any) => {
      items.push({
        item_type: 'expense',
        item_ref_id: item.id,
        is_paid: !!paidExpenses[item.id],
        amount_override: expenseAmounts[item.id] ?? null,
        account_id: expenseAccounts[item.id] || item.account_id || null,
      });
    });
    data.debt_items.forEach((item: any) => {
      items.push({
        item_type: 'debt',
        item_ref_id: item.id,
        is_paid: !!paidDebts[item.id],
        amount_override: debtAmounts[item.id] ?? null,
        account_id: debtAccounts[item.id] || item.account_id || null,
      });
    });
    axios.put(`/api/sandbox/instances/${instanceId}/items`, items).catch(console.error);
  }, [memoryOnly, usingBenchmark, instanceId, data, paidIncome, paidExpenses, paidDebts, incomeAmounts, expenseAmounts, debtAmounts, expenseAccounts, debtAccounts]);

  useEffect(() => {
    if (!instanceId || !data || memoryOnly || usingBenchmark) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistState(), 300);
  }, [paidIncome, paidExpenses, paidDebts, incomeAmounts, expenseAmounts, debtAmounts, expenseAccounts, debtAccounts, persistState, instanceId, data, memoryOnly, usingBenchmark]);

  const currentMonthNum = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthOffset = (viewYear - currentYear) * 12 + (viewMonth - currentMonthNum);
  const isFutureMonth = monthOffset > 0;
  const isCurrentMonth = viewMonth === currentMonthNum && viewYear === currentYear;
  const todayDay = now.getDate();

  const getIncomeAmount = useCallback((item: any) => incomeAmounts[item.id] ?? item.amount, [incomeAmounts]);
  const getExpenseAmount = useCallback((item: any) => expenseAmounts[item.id] ?? item.amount, [expenseAmounts]);
  const getDebtAmount = useCallback((item: any) => {
    if (debtAmounts[item.id] != null) return debtAmounts[item.id];
    if (usePaymentStrategy && item.calculated_payment != null) return item.calculated_payment;
    return item.amount_due_immediately > 0 ? item.amount_due_immediately : item.minimum_payment;
  }, [debtAmounts, usePaymentStrategy]);

  const getEffectiveDebtAmount = useCallback((item: any) => {
    if (isFutureMonth && projection?.months) {
      const projMonth = projection.months.find((m: any) => m.month === viewMonth && m.year === viewYear);
      const detail = projMonth?.debt_details?.find((dd: any) => dd.debt_id === item.id);
      if (detail) return detail.payment;
    }
    return getDebtAmount(item);
  }, [isFutureMonth, projection, viewMonth, viewYear, getDebtAmount]);

  const getDebtTier = useCallback((item: any) => {
    if (debtPayTiers[item.id]) return debtPayTiers[item.id];
    if (usePaymentStrategy && item.payment_strategy) {
      if (item.payment_strategy === 'payoff_plan') return 'payoff_plan';
      if (item.payment_strategy === 'due_now') return 'due';
      return 'min';
    }
    if (debtAmounts[item.id] != null) return 'custom';
    return item.amount_due_immediately > 0 ? 'due' : 'min';
  }, [debtPayTiers, usePaymentStrategy, debtAmounts]);

  const getExpenseAccountId = useCallback((item: any) => expenseAccounts[item.id] || item.account_id || null, [expenseAccounts]);
  const getDebtAccountId = useCallback((item: any) => debtAccounts[item.id] || item.account_id || null, [debtAccounts]);

  const unifiedObligations: UnifiedObligation[] = useMemo(() => {
    if (!data) return [];
    const accounts = data.accounts || [];
    const monthShort = MONTH_NAMES[viewMonth - 1]?.slice(0, 3) || 'Oct';

    const buildCountdown = (dueDay: number, isPaid: boolean): { label: string; urgency: UnifiedObligation['urgency'] } => {
      if (isPaid) return { label: 'Cleared', urgency: 'cleared' };
      if (!dueDay) return { label: 'Scheduled', urgency: 'upcoming' };
      if (monthOffset > 0) return { label: `${monthShort} ${dueDay}${getOrdinal(dueDay)}`, urgency: 'upcoming' };
      if (monthOffset < 0) return { label: 'Past due', urgency: 'overdue' };
      const diff = dueDay - todayDay;
      if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgency: 'overdue' };
      if (diff === 0) return { label: 'Due today', urgency: 'due_soon' };
      if (diff <= 7) return { label: `In ${diff}d`, urgency: 'due_soon' };
      return { label: `${monthShort} ${dueDay}${getOrdinal(dueDay)}`, urgency: 'upcoming' };
    };

    const expRows: UnifiedObligation[] = (data.expense_items || []).map((item: any) => {
      const isPaid = !!paidExpenses[item.id];
      const dueDay = item.due_day || 1;
      const acctId = getExpenseAccountId(item);
      const acct = accounts.find((a: any) => a.id === acctId);
      const cd = buildCountdown(dueDay, isPaid);
      const amt = getExpenseAmount(item);
      return {
        id: item.id,
        rawItem: item,
        type: 'expense',
        name: item.name,
        category: item.category_name || 'General',
        dueDay,
        dueLabel: `${monthShort} ${dueDay}${getOrdinal(dueDay)}`,
        countdownLabel: cd.label,
        urgency: cd.urgency,
        accountId: acctId,
        accountName: acct?.name || 'Unassigned',
        amount: amt,
        baseAmount: item.amount,
        isPaid,
        isOverridden: expenseAmounts[item.id] != null && expenseAmounts[item.id] !== item.amount,
        monogram: getMonogram(item.name),
        url: item.url,
      };
    });

    const debtRows: UnifiedObligation[] = (data.debt_items || []).map((item: any) => {
      const isPaid = !!paidDebts[item.id];
      const dueDay = item.due_day || 1;
      const acctId = getDebtAccountId(item);
      const acct = accounts.find((a: any) => a.id === acctId);
      const cd = buildCountdown(dueDay, isPaid);
      const amt = getEffectiveDebtAmount(item);
      const catLabel = (item.debt_type || 'Debt')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        id: item.id,
        rawItem: item,
        type: 'debt',
        name: item.name,
        category: catLabel,
        dueDay,
        dueLabel: `${monthShort} ${dueDay}${getOrdinal(dueDay)}`,
        countdownLabel: cd.label,
        urgency: cd.urgency,
        accountId: acctId,
        accountName: acct?.name || 'Unassigned',
        amount: amt,
        baseAmount: item.minimum_payment,
        isPaid,
        isOverridden: debtAmounts[item.id] != null,
        monogram: getMonogram(item.name),
        url: item.url,
        debtBalance: item.balance,
        interestRate: item.interest_rate,
        minimumPayment: item.minimum_payment,
        dueImmediately: item.amount_due_immediately,
        calculatedPayment: item.calculated_payment,
        paymentStrategy: item.payment_strategy,
        activeTier: getDebtTier(item),
      };
    });

    return [...expRows, ...debtRows].sort((a, b) => a.dueDay - b.dueDay);
  }, [data, viewMonth, monthOffset, todayDay, paidExpenses, paidDebts, getExpenseAccountId, getDebtAccountId, getExpenseAmount, getEffectiveDebtAmount, expenseAmounts, debtAmounts, getDebtTier]);

  const toggleObligation = useCallback((ob: UnifiedObligation) => {
    const nextPaid = !ob.isPaid;
    if (ob.type === 'debt') {
      setPaidDebts((p) => ({ ...p, [ob.id]: nextPaid }));
    } else {
      setPaidExpenses((p) => ({ ...p, [ob.id]: nextPaid }));
    }
    showToast(
      nextPaid
        ? `Cleared ${ob.name} (${fmtFull(ob.amount)}) from ${ob.accountName}.`
        : `Restored ${ob.name} to due queue.`
    );
  }, [showToast]);

  const handleSetDebtTier = useCallback((ob: UnifiedObligation, tier: string) => {
    const item = ob.rawItem;
    setDebtPayTiers((p) => ({ ...p, [item.id]: tier }));
    if (tier === 'min') {
      setDebtAmounts((p) => ({ ...p, [item.id]: item.minimum_payment }));
    } else if (tier === 'due') {
      setDebtAmounts((p) => ({ ...p, [item.id]: item.amount_due_immediately || item.minimum_payment }));
    } else if (tier === 'payoff_plan') {
      setDebtAmounts((p) => ({ ...p, [item.id]: item.calculated_payment || item.minimum_payment }));
    } else if (tier === 'full') {
      setDebtAmounts((p) => ({ ...p, [item.id]: item.balance }));
    }
    showToast(`Updated ${ob.name} tier to ${tier.toUpperCase()}.`);
  }, [showToast]);

  const saveObligationAmount = useCallback(async (ob: UnifiedObligation, val: number, scope: 'month' | 'master' = 'month') => {
    if (isNaN(val) || val < 0) return;
    if (ob.type === 'debt') {
      setDebtAmounts((p) => ({ ...p, [ob.id]: val }));
      setDebtPayTiers((p) => ({ ...p, [ob.id]: 'custom' }));
      if (scope === 'master' && !memoryOnly && !usingBenchmark) {
        await axios.put(`/api/debts/${ob.id}`, { minimum_payment: val }).catch(console.error);
      }
    } else {
      setExpenseAmounts((p) => ({ ...p, [ob.id]: val }));
      if (scope === 'master' && !memoryOnly && !usingBenchmark) {
        await axios.put(`/api/expenses/${ob.id}`, { amount: val }).catch(console.error);
      }
    }
    showToast(`Saved ${ob.name} amount (${fmtFull(val)}) — ${scope === 'master' ? 'Master Rule' : 'This Month'}.`);
  }, [memoryOnly, usingBenchmark, showToast]);

  const assignObligationAccount = useCallback((ob: UnifiedObligation, accountId: string) => {
    if (ob.type === 'debt') {
      setDebtAccounts((p) => ({ ...p, [ob.id]: accountId }));
    } else {
      setExpenseAccounts((p) => ({ ...p, [ob.id]: accountId }));
    }
    const acctName = data?.accounts?.find((a: any) => a.id === accountId)?.name || 'Unassigned';
    showToast(`Routed ${ob.name} to ${acctName}.`);
  }, [data, showToast]);

  const saveAccountBalance = useCallback(async (accountId: string, newBalance: number) => {
    if (isNaN(newBalance)) return;
    setAccountBalanceOverrides((p) => ({ ...p, [accountId]: newBalance }));
    const acctName = data?.accounts?.find((a: any) => a.id === accountId)?.name || 'Account';
    if (!memoryOnly && !usingBenchmark) {
      await axios.put(`/api/accounts/${accountId}`, { balance: newBalance }).catch(console.error);
    }
    showToast(`Updated ${acctName} balance to ${fmtFull(newBalance)}.`);
  }, [data, memoryOnly, usingBenchmark, showToast]);

  const saveIncomeDate = useCallback((incomeId: string, newDate: string) => {
    if (!newDate) return;
    setData((prev: any) => {
      if (!prev?.income_items) return prev;
      return {
        ...prev,
        income_items: prev.income_items.map((item: any) =>
          item.id === incomeId ? { ...item, pay_date: newDate } : item
        ),
      };
    });
    const incName = data?.income_items?.find((i: any) => i.id === incomeId)?.name || 'Inbound deposit';
    showToast(`Updated ${incName} date to ${formatPayDate(newDate)}.`);
  }, [data, showToast]);

  const saveIncomeAmount = useCallback((incomeId: string, newAmount: number) => {
    if (isNaN(newAmount) || newAmount < 0) return;
    setIncomeAmounts((p) => ({ ...p, [incomeId]: newAmount }));
    const incName = data?.income_items?.find((i: any) => i.id === incomeId)?.name || 'Inbound deposit';
    showToast(`Updated ${incName} amount to ${fmtFull(newAmount)}.`);
  }, [data, showToast]);

  const saveAllocationValue = useCallback((incomeSourceId: string, accountId: string, newValue: number, allocationType: 'percent' | 'fixed' = 'percent') => {
    if (isNaN(newValue) || newValue < 0) return;
    setData((prev: any) => {
      if (!prev) return prev;
      const existing = prev.allocations || [];
      const found = existing.some(
        (a: any) => a.income_source_id === incomeSourceId && a.account_id === accountId
      );
      const nextAllocs = found
        ? existing.map((a: any) =>
            a.income_source_id === incomeSourceId && a.account_id === accountId
              ? { ...a, allocation_value: newValue, allocation_type: allocationType }
              : a
          )
        : [
            ...existing,
            {
              income_source_id: incomeSourceId,
              account_id: accountId,
              allocation_type: allocationType,
              allocation_value: newValue,
            },
          ];
      return { ...prev, allocations: nextAllocs };
    });
    const acctName = data?.accounts?.find((a: any) => a.id === accountId)?.name || 'Account';
    showToast(
      `Updated ${acctName} inbound allocation to ${allocationType === 'percent' ? `${newValue}%` : fmtFull(newValue)}.`
    );
  }, [data, showToast]);

  return {
    data, loading, viewMonth, viewYear, setViewMonth, setViewYear,
    isCurrentMonth, isFutureMonth, monthOffset, todayDay,
    memoryOnly, setMemoryOnly, usingBenchmark, applyBenchmarkState, loadMonth,
    paidIncome, setPaidIncome, paidExpenses, setPaidExpenses, paidDebts, setPaidDebts, paidAdhoc, setPaidAdhoc,
    incomeAmounts, setIncomeAmounts, adhocItems, setAdhocItems,
    committedPlan, projection, usePaymentStrategy, setUsePaymentStrategy,
    getIncomeAmount, getExpenseAmount, getEffectiveDebtAmount, getExpenseAccountId, getDebtAccountId,
    unifiedObligations, toggleObligation, handleSetDebtTier, saveObligationAmount, assignObligationAccount,
    accountBalanceOverrides, saveAccountBalance, saveIncomeDate, saveIncomeAmount, saveAllocationValue,
    inboundModalAccountId, setInboundModalAccountId,
    selectedAccountFilter, setSelectedAccountFilter, accountPreset, setAccountPreset, hiddenAccountIds, setHiddenAccountIds,
    activeWorkspaceTab, setActiveWorkspaceTab, inspectedObligationId, setInspectedObligationId,
    toastMsg, showToast, instanceId,
  };
}

