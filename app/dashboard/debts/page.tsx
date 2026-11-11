/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  Zap,
  CreditCard,
  Download,
  Upload,
  FileUp,
  Target,
  Plus,
  CheckCircle2,
  ExternalLink,
  Link as LinkIcon,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Settings,
  Snowflake,
  Mountain,
  X,
  Check,
  Eye,
  EyeOff,
  BarChart3,
} from 'lucide-react';
import DeleteButton from '../components/DeleteButton';
import InlineEdit from '../components/InlineEdit';
import useTable from '../hooks/useTable';
import TableSearch from '../components/TableSearch';
import TableHeader from '../components/TableHeader';

const fmt = (n: number | string) => {
  const parsed = typeof n === 'number' ? n : Number(n);
  const val = Number.isFinite(parsed) ? parsed : 0;
  const normalized = Math.abs(val) < 0.005 ? 0 : val;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

interface Debt {
  id: string;
  name: string;
  debt_type: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_day_of_month: number | null;
  amount_due_immediately: number;
  payment_strategy: 'minimum' | 'due_now' | 'payoff_plan';
  debt_quality: 'good' | 'bad' | 'neutral';
  calculated_payment?: number;
  url: string | null;
}

interface BonusPlanAllocation {
  reference_id: string;
  amount: number;
}

interface BonusPlanResult {
  id: string;
  total_amount: number;
  strategy: 'snowball' | 'avalanche';
  notes: string | null;
  allocations: BonusPlanAllocation[];
}

interface PayoffPlanDebtOrder {
  debt_id: string;
  debt_name: string;
  starting_balance: number;
  interest_rate: number;
  required_payment: number;
  months_to_payoff: number;
}

interface PayoffPlanResult {
  strategy: 'snowball' | 'avalanche';
  total_months: number;
  total_interest_paid: number;
  debts_order: PayoffPlanDebtOrder[];
}

const DEBT_TYPES = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_STRATEGIES = [
  { value: 'minimum', label: 'Minimum', color: 'var(--as-text-secondary)' },
  { value: 'due_now', label: 'Due Now', color: 'var(--as-status-error)' },
  { value: 'payoff_plan', label: 'Payoff Plan', color: 'var(--as-status-info)' },
];

const QUALITY_CONFIG = {
  good: {
    label: 'Good',
    color: 'var(--as-status-success)',
    bg: 'color-mix(in srgb, var(--as-status-success) 14%, transparent)',
  },
  bad: {
    label: 'Bad',
    color: 'var(--as-status-error)',
    bg: 'color-mix(in srgb, var(--as-status-error) 14%, transparent)',
  },
  neutral: {
    label: 'Neutral',
    color: 'var(--as-status-warning)',
    bg: 'color-mix(in srgb, var(--as-status-warning) 14%, transparent)',
  },
};

const getDebtTypeLabel = (type: string) =>
  DEBT_TYPES.find((t) => t.value === type)?.label || 'Other';

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    balance: '',
    interest_rate: '',
    minimum_payment: '',
    due_day_of_month: '',
    debt_type: 'credit_card',
    amount_due_immediately: '',
    payment_strategy: 'minimum',
    url: '',
  });
  const [bonusForm, setBonusForm] = useState({ total_amount: '', strategy: 'snowball', notes: '' });
  const [payoff, setPayoff] = useState<PayoffPlanResult | null>(null);
  const [strategy, setStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  const [bonusPlan, setBonusPlan] = useState<BonusPlanResult | null>(null);
  const [excludedDebtIds, setExcludedDebtIds] = useState<string[]>([]);
  const [showPayoffConfig, setShowPayoffConfig] = useState(false);
  const [targetMonths, setTargetMonths] = useState('');
  const [committedPlan, setCommittedPlan] = useState<any>(null);
  const [committing, setCommitting] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkModalDebt, setLinkModalDebt] = useState<Debt | null>(null);
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const allDebtsTable = useTable<Debt>(debts, {
    searchKeys: ['name', 'debt_type', 'debt_quality', 'payment_strategy', 'url'],
    sortExtractors: {
      balance: (item) => Number(item.balance),
      interest_rate: (item) => Number(item.interest_rate),
      minimum_payment: (item) => Number(item.minimum_payment),
      amount_due_immediately: (item) => Number(item.amount_due_immediately) || 0,
      monthly_interest: (item) => (Number(item.balance) * Number(item.interest_rate)) / 100 / 12,
      calculated_payment: (item) => Number(item.calculated_payment) || 0,
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const payoffConfigTable = useTable<Debt>(debts, {
    searchKeys: ['name', 'debt_type'],
    sortExtractors: {
      balance: (item) => Number(item.balance),
      interest_rate: (item) => Number(item.interest_rate),
      minimum_payment: (item) => Number(item.minimum_payment),
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const load = useCallback(() => {
    return Promise.all([
      axios.get('/api/debts'),
      axios.get('/api/debts/payoff/committed').catch(() => ({ data: null })),
    ])
      .then(([debtsRes, committedRes]) => {
        setDebts(debtsRes.data);
        setCommittedPlan(committedRes.data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load debt records. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showModal && !showBonusModal && !showPayoffConfig && !showLinkModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLinkModal) {
          setShowLinkModal(false);
          setLinkModalDebt(null);
        } else if (showPayoffConfig) {
          setShowPayoffConfig(false);
        } else if (showBonusModal) {
          setShowBonusModal(false);
        } else if (showModal) {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showBonusModal, showPayoffConfig, showLinkModal]);

  useEffect(() => {
    let active = true;
    if (debts.length > 0) {
      const params: any = { strategy };
      if (excludedDebtIds.length > 0) {
        params.exclude_ids = excludedDebtIds.join(',');
      }
      if (targetMonths) {
        params.target_months = parseInt(targetMonths, 10);
      }
      axios
        .get('/api/debts/payoff', { params })
        .then((r) => {
          if (active) setPayoff(r.data);
        })
        .catch(console.error);
    } else {
      Promise.resolve().then(() => {
        if (active) setPayoff(null);
      });
    }
    return () => {
      active = false;
    };
  }, [debts, strategy, excludedDebtIds, targetMonths]);

  const toggleDebtInPlan = (debtId: string) => {
    setExcludedDebtIds((prev) =>
      prev.includes(debtId) ? prev.filter((id) => id !== debtId) : [...prev, debtId]
    );
  };

  const calcCreditCardMin = (balance: string | number, apr: string | number) => {
    const bal = parseFloat(String(balance)) || 0;
    const rate = parseFloat(String(apr)) || 0;
    if (bal <= 0) return 0;
    const monthlyInterest = bal * (rate / 100) / 12;
    const percentOfBalance = bal * 0.01;
    return Math.max(percentOfBalance + monthlyInterest, 25);
  };

  const updateForm = (updates: Partial<typeof form>) => {
    const next = { ...form, ...updates };
    if (
      next.debt_type === 'credit_card' &&
      (updates.balance !== undefined ||
        updates.interest_rate !== undefined ||
        updates.debt_type !== undefined)
    ) {
      const autoMin = calcCreditCardMin(next.balance, next.interest_rate);
      if (autoMin > 0) {
        next.minimum_payment = autoMin.toFixed(2);
      }
    }
    setForm(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/debts', {
        name: form.name,
        balance: parseFloat(form.balance),
        interest_rate: parseFloat(form.interest_rate) || 0,
        minimum_payment: parseFloat(form.minimum_payment),
        due_day_of_month: form.due_day_of_month ? parseInt(form.due_day_of_month, 10) : null,
        debt_type: form.debt_type,
        amount_due_immediately: form.amount_due_immediately
          ? parseFloat(form.amount_due_immediately)
          : 0,
        payment_strategy: form.payment_strategy || 'minimum',
        url: form.url || null,
      });
      setForm({
        name: '',
        balance: '',
        interest_rate: '',
        minimum_payment: '',
        due_day_of_month: '',
        debt_type: 'credit_card',
        amount_due_immediately: '',
        payment_strategy: 'minimum',
        url: '',
      });
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to save debt record. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateDebtItem = async (id: string, payload: any) => {
    setError(null);
    try {
      await axios.put(`/api/debts/${id}`, payload);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to update debt record. Please try again.');
    }
  };

  const deleteDebtItem = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`/api/debts/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to delete debt record. Please try again.');
    }
  };

  const openLinkModal = (debt: Debt) => {
    setLinkModalDebt(debt);
    setLinkModalUrl(debt.url || '');
    setShowLinkModal(true);
  };

  const handleLinkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalDebt || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.put(`/api/debts/${linkModalDebt.id}`, { url: linkModalUrl.trim() || null });
      setShowLinkModal(false);
      setLinkModalDebt(null);
      setLinkModalUrl('');
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to update website link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const plan = await axios
        .post('/api/debts/bonus-plans', {
          total_amount: parseFloat(bonusForm.total_amount),
          strategy: bonusForm.strategy,
          notes: bonusForm.notes || null,
        })
        .then((r) => r.data);
      const result = await axios
        .post(`/api/debts/bonus-plans/${plan.id}/generate`)
        .then((r) => r.data);
      setBonusPlan(result);
      setShowBonusModal(false);
    } catch (err) {
      console.error(err);
      setError('Unable to generate bonus allocation plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const headers =
      'name,debt_type,balance,interest_rate,minimum_payment,amount_due_immediately,due_day_of_month,payment_strategy,url';
    const examples = [
      'Chase Sapphire,credit_card,5000,24.99,,500,15,due_now,https://www.chase.com',
      'Honda Civic,car_loan,18000,5.9,350,,1,minimum,https://www.honda.com',
      'Home Mortgage,mortgage,250000,3.5,1200,,1,minimum,',
      'Sallie Mae,student_loan,30000,4.5,280,,15,payoff_plan,',
      'Medical Bill,medical,2500,0,100,2500,,due_now,',
    ];
    const note =
      '# debt_type options: mortgage, car_loan, credit_card, personal_loan, student_loan, medical, other';
    const note2 = '# payment_strategy options: minimum, due_now, payoff_plan';
    const note3 = '# Leave minimum_payment blank for credit_card — it will be auto-calculated';
    const csv = [note, note2, note3, headers, ...examples].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debt_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const downloadExport = () => {
    const headers =
      'name,debt_type,balance,interest_rate,minimum_payment,amount_due_immediately,due_day_of_month,payment_strategy,calculated_payment,url';
    const rows = debts.map((d) =>
      [
        escapeCsvField(d.name),
        d.debt_type,
        d.balance,
        d.interest_rate,
        d.minimum_payment,
        d.amount_due_immediately || 0,
        d.due_day_of_month || '',
        d.payment_strategy,
        (Number(d.calculated_payment) || 0).toFixed(2),
        d.url ? escapeCsvField(d.url) : '',
      ].join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debts_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCsv(true);
    setError(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
      if (lines.length < 2) return;
      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const validTypes = DEBT_TYPES.map((t) => t.value);
      const validStrategies = PAYMENT_STRATEGIES.map((s) => s.value);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 3) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = (cols[idx] || '').trim();
        });
        const debtType = validTypes.includes(row.debt_type) ? row.debt_type : 'other';
        const balance = parseFloat(row.balance) || 0;
        const apr = parseFloat(row.interest_rate) || 0;
        let minPayment = parseFloat(row.minimum_payment);
        if (isNaN(minPayment) || (debtType === 'credit_card' && !row.minimum_payment)) {
          minPayment = debtType === 'credit_card' ? calcCreditCardMin(balance, apr) : 0;
        }
        const str = validStrategies.includes(row.payment_strategy)
          ? row.payment_strategy
          : 'minimum';
        try {
          await axios.post('/api/debts', {
            name: row.name || `Debt ${i}`,
            debt_type: debtType,
            balance,
            interest_rate: apr,
            minimum_payment: minPayment,
            amount_due_immediately: parseFloat(row.amount_due_immediately) || 0,
            due_day_of_month: parseInt(row.due_day_of_month, 10) || null,
            payment_strategy: str,
            url: row.url || null,
          });
        } catch (err) {
          console.error('Row', i, err);
        }
      }
      e.target.value = '';
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to import CSV file. Verify column formatting and try again.');
    } finally {
      setUploadingCsv(false);
    }
  };

  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0);
  const totalPayments = debts.reduce((s, d) => s + Number(d.minimum_payment), 0);
  const goodDebt = debts
    .filter((d) => d.debt_quality === 'good')
    .reduce((s, d) => s + Number(d.balance), 0);
  const badDebt = debts
    .filter((d) => d.debt_quality === 'bad')
    .reduce((s, d) => s + Number(d.balance), 0);
  const totalDueNow = debts.reduce((s, d) => s + (Number(d.amount_due_immediately) || 0), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Debts & Payoff Strategy</h2>
        <p>Track liabilities, interest rates, and monthly payoff amortization.</p>
      </div>

      {error && (
        <div className="error-state-banner section" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="debt-stats-grid section">
        <div className="stat-card">
          <div className="stat-label">Total Debt</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 120, marginTop: 6 }} />
          ) : (
            <div className="stat-value tabular-nums">{fmt(totalDebt)}</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Payments</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 110, marginTop: 6 }} />
          ) : (
            <div className="stat-value tabular-nums">{fmt(totalPayments)}</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Good Debt</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 110, marginTop: 6 }} />
          ) : (
            <>
              <div className="stat-value tabular-nums" style={{ color: 'var(--as-status-success)' }}>
                {fmt(goodDebt)}
              </div>
              <div className="stat-sub tabular-nums" style={{ color: 'var(--as-text-secondary)' }}>
                {totalDebt > 0 ? ((goodDebt / totalDebt) * 100).toFixed(0) : 0}% of total
              </div>
            </>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Bad Debt</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 110, marginTop: 6 }} />
          ) : (
            <>
              <div className="stat-value tabular-nums" style={{ color: 'var(--as-status-error)' }}>
                {fmt(badDebt)}
              </div>
              <div className="stat-sub tabular-nums" style={{ color: 'var(--as-text-secondary)' }}>
                {totalDebt > 0 ? ((badDebt / totalDebt) * 100).toFixed(0) : 0}% of total
              </div>
            </>
          )}
        </div>
        {!loading && totalDueNow > 0 && (
          <div className="stat-card">
            <div
              className="stat-label"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--as-status-error)' }}
            >
              <Zap size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Amount Due Now
            </div>
            <div className="stat-value tabular-nums" style={{ color: 'var(--as-status-error)' }}>
              {fmt(totalDueNow)}
            </div>
          </div>
        )}
      </div>

      {/* Debt List */}
      <div className="card section">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCard
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-text-secondary)' }}
            />
            All Debts
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={downloadTemplate}
              title="Download CSV template"
            >
              <Download size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Template
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={downloadExport}
              disabled={debts.length === 0}
              title="Export debts to CSV"
            >
              <Upload size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Export
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload debts CSV file"
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => csvInputRef.current?.click()}
              disabled={uploadingCsv}
              title="Upload CSV file"
            >
              <FileUp size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              {uploadingCsv ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setShowBonusModal(true)}
              disabled={debts.length === 0}
            >
              <Target size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Plan Bonus
            </button>
            <TableSearch
              searchQuery={allDebtsTable.searchQuery}
              setSearchQuery={allDebtsTable.setSearchQuery}
              isOpen={allDebtsTable.searchOpen}
              setIsOpen={allDebtsTable.setSearchOpen}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Debt
            </button>
          </div>
        </div>
        {loading ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
            aria-busy="true"
            aria-label="Loading debts"
          >
            <div className="skeleton" style={{ height: 38, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
          </div>
        ) : debts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2 size={32} strokeWidth={1.5} aria-hidden="true" focusable="false" />
            </div>
            <h3>No debts recorded</h3>
            <p>Add credit cards, loans, or mortgages to compare Snowball and Avalanche payoff plans.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              style={{ marginTop: 12 }}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Debt
            </button>
          </div>
        ) : allDebtsTable.data.length === 0 ? (
          <div className="empty-state">
            <h3>No matching debts</h3>
            <p>No debts match &ldquo;{allDebtsTable.searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => allDebtsTable.setSearchQuery('')}
              style={{ marginTop: 12 }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="scroll-table-wrapper">
            <div className="scroll-table-inner">
              <table className="data-table">
                <thead>
                  <tr>
                    <TableHeader
                      label="Name"
                      sortKey="name"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                    />
                    <th scope="col">Link</th>
                    <TableHeader
                      label="Type"
                      sortKey="debt_type"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                    />
                    <TableHeader
                      label="Quality"
                      sortKey="debt_quality"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                    />
                    <TableHeader
                      label="Balance"
                      sortKey="balance"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="APR"
                      sortKey="interest_rate"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Min Payment"
                      sortKey="minimum_payment"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Amount Due Now"
                      sortKey="amount_due_immediately"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Monthly Interest"
                      sortKey="monthly_interest"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="This Month Strategy"
                      sortKey="payment_strategy"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                    />
                    <TableHeader
                      label="Calculated Payment"
                      sortKey="calculated_payment"
                      activeKey={allDebtsTable.sortKey}
                      activeDirection={allDebtsTable.sortDirection}
                      onClick={allDebtsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <th scope="col" style={{ width: 96 }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allDebtsTable.data.map((d) => {
                    const qualityInfo = QUALITY_CONFIG[d.debt_quality] || QUALITY_CONFIG.neutral;
                    return (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{d.name}</span>
                            {d.url && (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-action-btn"
                                style={{ textDecoration: 'none' }}
                                title="Visit payment site"
                                aria-label={`Visit payment site for ${d.name}`}
                              >
                                <ExternalLink
                                  size={14}
                                  strokeWidth={2.0}
                                  aria-hidden="true"
                                  focusable="false"
                                />
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-small"
                            onClick={() => openLinkModal(d)}
                            title={d.url ? 'Edit website link' : 'Add website link'}
                            aria-label={
                              d.url
                                ? `Edit website link for ${d.name}`
                                : `Add website link for ${d.name}`
                            }
                          >
                            <LinkIcon
                              size={12}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                              style={{
                                color: d.url ? 'var(--as-status-info)' : 'var(--as-text-secondary)',
                              }}
                            />
                            {d.url ? 'Edit' : 'Add'}
                          </button>
                        </td>
                        <td>
                          <select
                            value={d.debt_type}
                            aria-label={`Debt type for ${d.name}`}
                            className="inline-table-select"
                            onChange={async (e) => {
                              await updateDebtItem(d.id, { debt_type: e.target.value });
                            }}
                          >
                            {DEBT_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 10px',
                              borderRadius: 'var(--as-radius-pill)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: qualityInfo.color,
                              background: qualityInfo.bg,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {d.debt_quality === 'good' ? (
                              <CheckCircle2
                                size={12}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                            ) : d.debt_quality === 'bad' ? (
                              <XCircle
                                size={12}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                            ) : (
                              <AlertTriangle
                                size={12}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                            )}
                            {qualityInfo.label}
                          </span>
                        </td>
                        <td className="amount">
                          <InlineEdit
                            value={d.balance}
                            onSave={async (v) => {
                              await updateDebtItem(d.id, { balance: Number(v) });
                            }}
                          />
                        </td>
                        <td className="amount">
                          <InlineEdit
                            value={d.interest_rate}
                            format="percent"
                            onSave={async (v) => {
                              await updateDebtItem(d.id, { interest_rate: Number(v) });
                            }}
                          />
                        </td>
                        <td className="amount">
                          <InlineEdit
                            value={d.minimum_payment}
                            onSave={async (v) => {
                              await updateDebtItem(d.id, { minimum_payment: Number(v) });
                            }}
                          />
                        </td>
                        <td
                          className="amount"
                          style={{
                            color:
                              Number(d.amount_due_immediately) > 0
                                ? 'var(--as-status-error)'
                                : 'var(--as-text-secondary)',
                            fontWeight: Number(d.amount_due_immediately) > 0 ? 700 : 400,
                          }}
                        >
                          <InlineEdit
                            value={d.amount_due_immediately || null}
                            onSave={async (v) => {
                              await updateDebtItem(d.id, {
                                amount_due_immediately: Number(v) || 0,
                              });
                            }}
                          />
                        </td>
                        <td className="amount" style={{ color: 'var(--as-status-warning)' }}>
                          {fmt((Number(d.balance) * Number(d.interest_rate)) / 100 / 12)}
                        </td>
                        <td>
                          <select
                            value={d.payment_strategy || 'minimum'}
                            aria-label={`Monthly payment strategy for ${d.name}`}
                            className="inline-table-select"
                            onChange={async (e) => {
                              await updateDebtItem(d.id, { payment_strategy: e.target.value });
                            }}
                            style={{
                              color: (() => {
                                const s = PAYMENT_STRATEGIES.find(
                                  (p) => p.value === (d.payment_strategy || 'minimum')
                                );
                                return s ? s.color : 'var(--as-text-primary)';
                              })(),
                              fontWeight: 600,
                              minWidth: 132,
                            }}
                          >
                            {PAYMENT_STRATEGIES.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="amount">
                          <span
                            style={{
                              fontWeight: 700,
                              color: (() => {
                                const s = d.payment_strategy || 'minimum';
                                if (s === 'payoff_plan') return 'var(--as-status-info)';
                                if (s === 'due_now') return 'var(--as-status-error)';
                                return 'var(--as-status-warning)';
                              })(),
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title={
                              d.payment_strategy === 'payoff_plan' && !committedPlan
                                ? 'Commit a payoff plan below to lock in target payments'
                                : `Strategy: ${d.payment_strategy || 'minimum'}`
                            }
                          >
                            {fmt(d.calculated_payment || 0)}
                            {d.payment_strategy === 'payoff_plan' && !committedPlan && (
                              <AlertTriangle
                                size={14}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                                style={{ color: 'var(--as-text-secondary)', marginLeft: 4 }}
                              />
                            )}
                          </span>
                        </td>
                        <td>
                          <DeleteButton
                            onDelete={() => deleteDebtItem(d.id)}
                            ariaLabel={`Delete ${d.name}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payoff Plan Section */}
      {payoff && !loading && (
        <div className="card section">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp
                size={16}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-text-secondary)' }}
              />
              Payoff Plan
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {committedPlan ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  style={{
                    color: 'var(--as-status-success)',
                    borderColor: 'color-mix(in srgb, var(--as-status-success) 35%, transparent)',
                  }}
                  disabled={committing}
                  onClick={async () => {
                    setCommitting(true);
                    setError(null);
                    try {
                      await axios.delete('/api/debts/payoff/committed');
                      setCommittedPlan(null);
                      await load();
                    } catch (e) {
                      console.error(e);
                      setError('Unable to unlock the committed payoff plan. Please try again.');
                    } finally {
                      setCommitting(false);
                    }
                  }}
                >
                  <Unlock size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  {committing ? 'Unlocking...' : 'Unlock Plan'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  style={{
                    color: 'var(--as-status-info)',
                    borderColor: 'color-mix(in srgb, var(--as-status-info) 35%, transparent)',
                  }}
                  disabled={committing}
                  onClick={async () => {
                    setCommitting(true);
                    setError(null);
                    try {
                      const plan = await axios
                        .post('/api/debts/payoff/commit', {
                          strategy,
                          extra_payment: 0,
                          target_months: targetMonths ? parseInt(targetMonths, 10) : null,
                          excluded_debt_ids: excludedDebtIds.length ? excludedDebtIds : null,
                        })
                        .then((r) => r.data);
                      setCommittedPlan(plan);
                      localStorage.setItem('planCommittedAt', Date.now().toString());
                      await load();
                    } catch (e) {
                      console.error(e);
                      setError('Unable to commit payoff plan. Please try again.');
                    } finally {
                      setCommitting(false);
                    }
                  }}
                >
                  <CheckCircle2 size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  {committing ? 'Committing...' : 'Commit This Plan'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setShowPayoffConfig(true)}
              >
                <Settings size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Configure
              </button>
              <div className="seg-tabs" role="group" aria-label="Payoff strategy">
                <button
                  type="button"
                  className={`seg-tab${strategy === 'snowball' ? ' active' : ''}`}
                  aria-pressed={strategy === 'snowball'}
                  onClick={() => setStrategy('snowball')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Snowflake size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  Snowball
                </button>
                <button
                  type="button"
                  className={`seg-tab${strategy === 'avalanche' ? ' active' : ''}`}
                  aria-pressed={strategy === 'avalanche'}
                  onClick={() => setStrategy('avalanche')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Mountain size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  Avalanche
                </button>
              </div>
            </div>
          </div>

          {excludedDebtIds.length > 0 && (
            <div
              style={{
                padding: '8px 14px',
                background: 'color-mix(in srgb, var(--as-status-warning) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--as-status-warning) 30%, transparent)',
                borderRadius: 'var(--as-radius-md)',
                marginBottom: 16,
                fontSize: '0.8125rem',
                color: 'var(--as-status-warning)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <AlertTriangle size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              {excludedDebtIds.length} debt{excludedDebtIds.length > 1 ? 's' : ''} excluded from
              this plan
            </div>
          )}

          {/* Target Months Input */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              padding: '12px 16px',
              background: 'var(--as-bg-base)',
              borderRadius: 'var(--as-radius-md)',
              border: '1px solid var(--as-border-subtle)',
            }}
          >
            <label
              htmlFor="target-payoff-months"
              style={{
                fontSize: '0.85rem',
                color: 'var(--as-text-secondary)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                margin: 0,
              }}
            >
              <Target size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Target payoff in
            </label>
            <input
              id="target-payoff-months"
              aria-label="Target payoff months"
              type="number"
              min="1"
              max="600"
              value={targetMonths}
              onChange={(e) => setTargetMonths(e.target.value)}
              placeholder={String(payoff.total_months || 12)}
              style={{
                width: 84,
                minHeight: 44,
                textAlign: 'center',
                padding: '6px 8px',
                background: 'var(--as-bg-surface)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-sm)',
                color: 'var(--as-text-primary)',
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--as-text-secondary)' }}>months</span>
            {targetMonths && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => setTargetMonths('')}
                aria-label="Clear target payoff months"
              >
                <X size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Clear
              </button>
            )}
            {targetMonths &&
              (() => {
                const targetDate = new Date();
                targetDate.setMonth(targetDate.getMonth() + parseInt(targetMonths, 10));
                return (
                  <span
                    className="tabular-nums"
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.8125rem',
                      color: 'var(--as-status-success)',
                      fontWeight: 600,
                    }}
                  >
                    Debt-free by{' '}
                    {targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                );
              })()}
          </div>

          {/* Flattened Recessed Summary Strip (no nested cards inside card) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 16,
              padding: '16px 20px',
              marginBottom: 24,
              background: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-md)',
            }}
          >
            <div>
              <div className="stat-label">Strategy</div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--as-status-info)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {payoff.strategy === 'snowball' ? (
                  <>
                    <Snowflake size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    Snowball
                  </>
                ) : (
                  <>
                    <Mountain size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    Avalanche
                  </>
                )}
              </div>
              <div className="stat-sub" style={{ color: 'var(--as-text-secondary)' }}>
                {payoff.strategy === 'snowball' ? 'Smallest balance first' : 'Highest APR first'}
              </div>
            </div>
            <div>
              <div className="stat-label">Months to Debt-Free</div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  fontFamily: 'var(--as-font-mono)',
                  color: 'var(--as-status-success)',
                  marginTop: 4,
                }}
              >
                {payoff.total_months}
              </div>
              <div className="stat-sub tabular-nums" style={{ color: 'var(--as-text-secondary)' }}>
                {(payoff.total_months / 12).toFixed(1)} years
              </div>
            </div>
            <div>
              <div className="stat-label">Total Interest Paid</div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  fontFamily: 'var(--as-font-mono)',
                  color: 'var(--as-status-error)',
                  marginTop: 4,
                }}
              >
                {fmt(payoff.total_interest_paid)}
              </div>
            </div>
            {targetMonths && (
              <div>
                <div className="stat-label">Required Monthly Total</div>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    fontFamily: 'var(--as-font-mono)',
                    color: 'var(--as-status-info)',
                    marginTop: 4,
                  }}
                >
                  {fmt(payoff.debts_order.reduce((s, d) => s + Number(d.required_payment), 0))}
                </div>
                <div
                  className="stat-sub tabular-nums"
                  style={{ color: 'var(--as-text-secondary)' }}
                >
                  vs {fmt(totalPayments)} minimum
                </div>
              </div>
            )}
          </div>

          <h4
            style={{
              marginBottom: 12,
              color: 'var(--as-text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            PAYOFF TIMELINE
          </h4>
          {(() => {
            const now = new Date();
            const maxM = Math.max(...payoff.debts_order.map((d) => d.months_to_payoff), 1);
            const tickCount = Math.min(maxM, 12);
            const ticks = Array.from(
              { length: tickCount + 1 },
              (_, i) => Math.round((i * maxM) / tickCount)
            );
            const formatMonthTick = (v: number) => {
              const d = new Date(now);
              d.setMonth(d.getMonth() + v);
              return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            };
            const chartData = payoff.debts_order.map((d) => {
              const payoffDate = new Date(now);
              payoffDate.setMonth(payoffDate.getMonth() + d.months_to_payoff);
              return {
                ...d,
                payoff_label: payoffDate.toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit',
                }),
              };
            });

            // Simulate pivoted schedule monthly allocations
            const debtStates = payoff.debts_order.map((d) => ({
              id: d.debt_id,
              name: d.debt_name,
              balance: Number(d.starting_balance),
              rate: Number(d.interest_rate) / 100 / 12,
              minPay: Number(d.required_payment),
            }));
            const totalBudget = debtStates.reduce((s, d) => s + d.minPay, 0);
            const schedule: any[] = [];
            const simMonths = Math.min(maxM, 120);

            for (let m = 0; m < simMonths; m++) {
              const monthDate = new Date(now);
              monthDate.setMonth(monthDate.getMonth() + m);
              const label = monthDate.toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
              });
              const row: any = { month: m, label, payments: {}, total: 0, isCurrent: m === 0 };

              let remaining_budget = totalBudget;
              for (const ds of debtStates) {
                if (ds.balance <= 0.01) {
                  row.payments[ds.id] = { pay: 0, remaining: 0, paidOff: true };
                  continue;
                }
                const interest = ds.balance * ds.rate;
                const minDue = Math.min(ds.minPay, ds.balance + interest);
                row.payments[ds.id] = {
                  pay: minDue,
                  remaining: ds.balance,
                  interest,
                  paidOff: false,
                };
                remaining_budget -= minDue;
              }

              for (const ds of debtStates) {
                if (ds.balance <= 0.01 || remaining_budget <= 0.01) continue;
                const p = row.payments[ds.id];
                const canApply = Math.min(remaining_budget, ds.balance + p.interest - p.pay);
                if (canApply > 0.01) {
                  p.pay += canApply;
                  remaining_budget -= canApply;
                }
                break;
              }

              for (const ds of debtStates) {
                if (ds.balance <= 0.01) continue;
                const p = row.payments[ds.id];
                const interest = ds.balance * ds.rate;
                ds.balance = Math.max(0, ds.balance + interest - p.pay);
                p.remaining = ds.balance;
                p.paidOff = ds.balance <= 0.01;
                row.total += p.pay;
              }

              schedule.push(row);
              if (debtStates.every((ds) => ds.balance <= 0.01)) break;
            }

            return (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(160, payoff.debts_order.length * 50)}
                >
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--as-border-subtle)" />
                    <XAxis
                      type="number"
                      stroke="var(--as-text-secondary)"
                      fontSize={12}
                      tick={{
                        fill: 'var(--as-text-secondary)',
                        fontSize: 12,
                        fontFamily: 'var(--as-font-mono)',
                      }}
                      ticks={ticks}
                      tickFormatter={formatMonthTick}
                      domain={[0, maxM]}
                      fontFamily="var(--as-font-mono)"
                    />
                    <YAxis
                      type="category"
                      dataKey="debt_name"
                      width={120}
                      stroke="var(--as-text-secondary)"
                      fontSize={12}
                      tick={{ fill: 'var(--as-text-secondary)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--as-bg-overlay)',
                        border: '1px solid var(--as-border-strong)',
                        borderRadius: 'var(--as-radius-md)',
                        color: 'var(--as-text-primary)',
                        fontFamily: 'var(--as-font-mono)',
                        fontSize: '0.8125rem',
                      }}
                      itemStyle={{ color: 'var(--as-text-primary)' }}
                      labelStyle={{ color: 'var(--as-text-primary)', fontWeight: 600 }}
                      cursor={{
                        fill: 'color-mix(in srgb, var(--as-text-primary) 5%, transparent)',
                      }}
                      formatter={(v, name) =>
                        name === 'months_to_payoff' || name === 'Months'
                          ? `${v} months`
                          : fmt(Number(v))
                      }
                    />
                    <Bar
                      dataKey="months_to_payoff"
                      fill="var(--as-accent-primary)"
                      radius={[0, 4, 4, 0]}
                      name="Months"
                    />
                  </BarChart>
                </ResponsiveContainer>

                <h4
                  style={{
                    marginTop: 24,
                    marginBottom: 8,
                    color: 'var(--as-text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  MONTHLY PAYMENT PLAN
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: '0.78rem',
                      marginLeft: 8,
                      letterSpacing: 'normal',
                      color: 'var(--as-text-secondary)',
                    }}
                  >
                    — Pay {fmt(totalBudget)}/mo total, directing extra toward{' '}
                    {payoff.strategy === 'snowball' ? 'smallest balance' : 'highest APR'} first
                  </span>
                </h4>
                {(maxM > 120 || payoff.total_months > 120) && (
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--as-text-secondary)',
                      marginBottom: 12,
                    }}
                  >
                    Showing the first 120 months (10-year horizon) of a {payoff.total_months}
                    -month payoff schedule. Table totals reflect payments within this 120-month
                    window.
                  </p>
                )}
                <div className="scroll-table-wrapper" style={{ marginTop: 8 }}>
                  <div className="scroll-table-inner">
                    <table
                      className="data-table"
                      style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    >
                      <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr>
                          <th
                            scope="col"
                            style={{
                              position: 'sticky',
                              left: 0,
                              top: 0,
                              zIndex: 3,
                              background: 'var(--as-bg-elevated)',
                              minWidth: 130,
                              borderRight: '1px solid var(--as-border-subtle)',
                            }}
                          >
                            Debt
                          </th>
                          {schedule.map((row) => (
                            <th
                              key={row.month}
                              scope="col"
                              style={{
                                textAlign: 'right',
                                minWidth: 96,
                                padding: '8px 12px',
                                color: row.isCurrent
                                  ? 'var(--as-status-info)'
                                  : 'var(--as-text-secondary)',
                                background: row.isCurrent
                                  ? 'color-mix(in srgb, var(--as-status-info) 12%, var(--as-bg-elevated))'
                                  : 'var(--as-bg-elevated)',
                                borderBottom: row.isCurrent
                                  ? '1px solid var(--as-border-strong)'
                                  : undefined,
                              }}
                            >
                              {row.label}
                              {row.isCurrent && (
                                <div
                                  style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 500,
                                    color: 'var(--as-status-info)',
                                    lineHeight: 1.2,
                                    marginTop: 2,
                                  }}
                                >
                                  Current
                                </div>
                              )}
                            </th>
                          ))}
                          <th
                            scope="col"
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              minWidth: 108,
                              color: 'var(--as-text-primary)',
                              background: 'var(--as-bg-elevated)',
                              borderLeft: '1px solid var(--as-border-strong)',
                            }}
                          >
                            Total Paid
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((d, di) => {
                          const debtTotal = schedule.reduce(
                            (sum, row) => sum + (row.payments[d.debt_id]?.pay || 0),
                            0
                          );
                          const stickyRowBg =
                            di % 2 === 0 ? 'var(--as-bg-elevated)' : 'var(--as-bg-surface)';
                          return (
                            <tr key={d.debt_id}>
                              <td
                                style={{
                                  fontWeight: 600,
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 1,
                                  background: stickyRowBg,
                                  maxWidth: 180,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  borderRight: '1px solid var(--as-border-subtle)',
                                }}
                              >
                                {d.debt_name}
                              </td>
                              {schedule.map((row) => {
                                const p = row.payments[d.debt_id];
                                if (!p) {
                                  return (
                                    <td
                                      key={row.month}
                                      className="amount"
                                      style={{
                                        color: 'var(--as-text-secondary)',
                                        background: row.isCurrent
                                          ? 'color-mix(in srgb, var(--as-status-info) 6%, transparent)'
                                          : stickyRowBg,
                                      }}
                                    >
                                      —
                                    </td>
                                  );
                                }
                                const isExtra = p.pay > Number(d.required_payment) + 0.5;
                                const justPaidOff = p.paidOff && p.pay > 0;
                                return (
                                  <td
                                    key={row.month}
                                    className="amount"
                                    style={{
                                      color:
                                        p.paidOff && p.pay === 0
                                          ? 'var(--as-text-secondary)'
                                          : isExtra
                                          ? 'var(--as-status-info)'
                                          : 'var(--as-text-primary)',
                                      fontWeight: isExtra ? 700 : 400,
                                      background: justPaidOff
                                        ? 'color-mix(in srgb, var(--as-status-success) 14%, transparent)'
                                        : row.isCurrent
                                        ? 'color-mix(in srgb, var(--as-status-info) 8%, transparent)'
                                        : stickyRowBg,
                                    }}
                                  >
                                    {p.pay > 0.01 ? fmt(p.pay) : '—'}
                                    {justPaidOff && (
                                      <Check
                                        size={12}
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                        focusable="false"
                                        style={{
                                          marginLeft: 4,
                                          color: 'var(--as-status-success)',
                                          display: 'inline-block',
                                          verticalAlign: 'middle',
                                        }}
                                      />
                                    )}
                                  </td>
                                );
                              })}
                              <td
                                className="amount"
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--as-text-primary)',
                                  background: stickyRowBg,
                                  borderLeft: '1px solid var(--as-border-strong)',
                                }}
                              >
                                {fmt(debtTotal)}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total / month row */}
                        <tr
                          style={{
                            borderTop: '1px solid var(--as-border-strong)',
                            background: 'var(--as-bg-elevated)',
                          }}
                        >
                          <td
                            style={{
                              fontWeight: 700,
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                              background: 'var(--as-bg-elevated)',
                              borderRight: '1px solid var(--as-border-subtle)',
                            }}
                          >
                            Total / mo
                          </td>
                          {schedule.map((row) => (
                            <td
                              key={row.month}
                              className="amount"
                              style={{
                                fontWeight: 700,
                                color: 'var(--as-status-info)',
                                background: row.isCurrent
                                  ? 'color-mix(in srgb, var(--as-status-info) 12%, var(--as-bg-elevated))'
                                  : 'var(--as-bg-elevated)',
                              }}
                            >
                              {fmt(row.total)}
                            </td>
                          ))}
                          <td
                            className="amount"
                            style={{
                              fontWeight: 700,
                              color: 'var(--as-text-primary)',
                              background: 'var(--as-bg-elevated)',
                              borderLeft: '1px solid var(--as-border-strong)',
                            }}
                          >
                            {fmt(schedule.reduce((s, r) => s + r.total, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Bonus Plan Result */}
      {bonusPlan && (
        <div className="card section">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target
                size={16}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-text-secondary)' }}
              />
              Bonus Allocation Plan
            </h3>
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => setBonusPlan(null)}
              aria-label="Dismiss bonus allocation plan"
            >
              <X size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </button>
          </div>
          <p style={{ color: 'var(--as-text-secondary)', marginBottom: 16 }}>
            <span className="tabular-nums" style={{ fontFamily: 'var(--as-font-mono)' }}>
              {fmt(bonusPlan.total_amount)}
            </span>{' '}
            bonus using <strong>{bonusPlan.strategy}</strong> strategy:
          </p>
          {bonusPlan.allocations.map((a, i) => {
            const debt = debts.find((d) => d.id === a.reference_id);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--as-border-subtle)',
                }}
              >
                <span>
                  {i + 1}. {debt?.name || 'Unknown'}
                </span>
                <span
                  className="amount"
                  style={{ color: 'var(--as-status-success)', fontWeight: 700 }}
                >
                  {fmt(a.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Debt Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-debt-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-debt-modal-title">Add Debt</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="debt-name">Name</label>
                <input
                  id="debt-name"
                  required
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="e.g. Chase Sapphire, Honda Civic"
                />
              </div>
              <div className="form-group">
                <label htmlFor="debt-type">Debt Type</label>
                <select
                  id="debt-type"
                  required
                  value={form.debt_type}
                  onChange={(e) => updateForm({ debt_type: e.target.value })}
                >
                  {DEBT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="debt-balance">Balance</label>
                  <input
                    id="debt-balance"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.balance}
                    onChange={(e) => updateForm({ balance: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="debt-apr">APR (%)</label>
                  <input
                    id="debt-apr"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.interest_rate}
                    onChange={(e) => updateForm({ interest_rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="debt-min-payment">
                    Minimum Payment
                    {form.debt_type === 'credit_card' && (
                      <span
                        style={{
                          color: 'var(--as-status-info)',
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          marginLeft: 6,
                        }}
                      >
                        (auto-calculated)
                      </span>
                    )}
                  </label>
                  <input
                    id="debt-min-payment"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.minimum_payment}
                    onChange={(e) => setForm({ ...form, minimum_payment: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="debt-due-day">Due Day</label>
                  <input
                    id="debt-due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={form.due_day_of_month}
                    onChange={(e) => setForm({ ...form, due_day_of_month: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="debt-due-now" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  Amount Due Now
                </label>
                <input
                  id="debt-due-now"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount_due_immediately}
                  onChange={(e) => setForm({ ...form, amount_due_immediately: e.target.value })}
                  placeholder="0.00 — leave blank if none"
                />
              </div>
              <div className="form-group">
                <label htmlFor="debt-url">Website Direct Link</label>
                <input
                  id="debt-url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="e.g. https://www.chase.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="debt-strategy" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BarChart3 size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  This Month Payment Strategy
                </label>
                <select
                  id="debt-strategy"
                  value={form.payment_strategy}
                  onChange={(e) => setForm({ ...form, payment_strategy: e.target.value })}
                >
                  {PAYMENT_STRATEGIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--as-text-secondary)', marginTop: 6 }}>
                  Minimum uses the standard minimum payment, Due Now uses Amount Due Now, and Payoff
                  Plan uses your committed plan payment.
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus Modal */}
      {showBonusModal && (
        <div className="modal-overlay" onClick={() => setShowBonusModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bonus-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="bonus-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Plan Bonus Allocation
            </h3>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              Enter a bonus amount to compute the optimal allocation across active debts.
            </p>
            <form onSubmit={handleBonusSubmit}>
              <div className="form-group">
                <label htmlFor="bonus-amount">Bonus Amount</label>
                <input
                  id="bonus-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={bonusForm.total_amount}
                  onChange={(e) => setBonusForm({ ...bonusForm, total_amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bonus-strategy">Strategy</label>
                <select
                  id="bonus-strategy"
                  value={bonusForm.strategy}
                  onChange={(e) => setBonusForm({ ...bonusForm, strategy: e.target.value })}
                >
                  <option value="snowball">Snowball (smallest first)</option>
                  <option value="avalanche">Avalanche (highest APR first)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bonus-notes">Notes</label>
                <input
                  id="bonus-notes"
                  value={bonusForm.notes}
                  onChange={(e) => setBonusForm({ ...bonusForm, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBonusModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payoff Configure Modal */}
      {showPayoffConfig && (
        <div className="modal-overlay" onClick={() => setShowPayoffConfig(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payoff-config-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <h3
                id="payoff-config-modal-title"
                style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}
              >
                <Settings size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Configure Payoff Plan
              </h3>
              <TableSearch
                searchQuery={payoffConfigTable.searchQuery}
                setSearchQuery={payoffConfigTable.setSearchQuery}
                isOpen={payoffConfigTable.searchOpen}
                setIsOpen={payoffConfigTable.setSearchOpen}
              />
            </div>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              Toggle which debts are excluded from the payoff calculation.
            </p>
            {payoffConfigTable.data.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No debts match &ldquo;{payoffConfigTable.searchQuery}&rdquo;.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => payoffConfigTable.setSearchQuery('')}
                  style={{ marginTop: 8 }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="scroll-table-wrapper">
                <div className="scroll-table-inner">
                  <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: 48 }}>
                          <span className="sr-only">Exclude from plan</span>
                        </th>
                        <TableHeader
                          label="Name"
                          sortKey="name"
                          activeKey={payoffConfigTable.sortKey}
                          activeDirection={payoffConfigTable.sortDirection}
                          onClick={payoffConfigTable.requestSort}
                        />
                        <TableHeader
                          label="Type"
                          sortKey="debt_type"
                          activeKey={payoffConfigTable.sortKey}
                          activeDirection={payoffConfigTable.sortDirection}
                          onClick={payoffConfigTable.requestSort}
                        />
                        <TableHeader
                          label="Balance"
                          sortKey="balance"
                          activeKey={payoffConfigTable.sortKey}
                          activeDirection={payoffConfigTable.sortDirection}
                          onClick={payoffConfigTable.requestSort}
                          style={{ textAlign: 'right' }}
                        />
                        <TableHeader
                          label="APR"
                          sortKey="interest_rate"
                          activeKey={payoffConfigTable.sortKey}
                          activeDirection={payoffConfigTable.sortDirection}
                          onClick={payoffConfigTable.requestSort}
                          style={{ textAlign: 'right' }}
                        />
                        <TableHeader
                          label="Min Payment"
                          sortKey="minimum_payment"
                          activeKey={payoffConfigTable.sortKey}
                          activeDirection={payoffConfigTable.sortDirection}
                          onClick={payoffConfigTable.requestSort}
                          style={{ textAlign: 'right' }}
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {payoffConfigTable.data.map((d) => {
                        const excluded = excludedDebtIds.includes(d.id);
                        return (
                          <tr
                            key={d.id}
                            style={{ opacity: excluded ? 0.5 : 1, transition: 'opacity 0.15s' }}
                          >
                            <td>
                              <button
                                type="button"
                                className="icon-action-btn"
                                onClick={() => toggleDebtInPlan(d.id)}
                                aria-pressed={excluded}
                                title={excluded ? 'Include in plan' : 'Exclude from plan'}
                                aria-label={`Exclude ${d.name} from payoff plan`}
                              >
                                {excluded ? (
                                  <EyeOff
                                    size={16}
                                    strokeWidth={2.0}
                                    aria-hidden="true"
                                    focusable="false"
                                  />
                                ) : (
                                  <Eye
                                    size={16}
                                    strokeWidth={2.0}
                                    aria-hidden="true"
                                    focusable="false"
                                  />
                                )}
                              </button>
                            </td>
                            <td style={{ fontWeight: 600 }}>{d.name}</td>
                            <td>
                              <span
                                style={{ fontSize: '0.78rem', color: 'var(--as-text-secondary)' }}
                              >
                                {getDebtTypeLabel(d.debt_type)}
                              </span>
                            </td>
                            <td className="amount">{fmt(d.balance)}</td>
                            <td className="amount">{Number(d.interest_rate).toFixed(2)}%</td>
                            <td className="amount">{fmt(d.minimum_payment)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              {excludedDebtIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => setExcludedDebtIds([])}
                  style={{ marginRight: 'auto' }}
                >
                  Include All
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowPayoffConfig(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit website link modal */}
      {showLinkModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowLinkModal(false);
            setLinkModalDebt(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="link-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LinkIcon size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Website Link for {linkModalDebt?.name}
            </h3>
            <p style={{ color: 'var(--as-text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              Configure a direct shortcut to this account&apos;s online payment portal.
            </p>
            <form onSubmit={handleLinkSave}>
              <div className="form-group">
                <label htmlFor="link-modal-url">Website URL</label>
                <input
                  id="link-modal-url"
                  type="url"
                  value={linkModalUrl}
                  onChange={(e) => setLinkModalUrl(e.target.value)}
                  placeholder="e.g. https://www.chase.com"
                  required={false}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkModalDebt(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
