'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BarChart3,
  Receipt,
  Tags,
  Pencil,
  ExternalLink,
  Landmark,
  Plus,
  Home,
  Utensils,
  Car,
  Zap,
  Tv,
  CreditCard,
  PiggyBank,
  ShoppingCart,
  Folder,
  AlertTriangle,
  Check,
} from 'lucide-react';
import DeleteButton from '../components/DeleteButton';
import InlineEdit from '../components/InlineEdit';
import ExcelUpload from '../components/ExcelUpload';
import useTable from '../hooks/useTable';
import TableSearch from '../components/TableSearch';
import TableHeader from '../components/TableHeader';

const DEFAULT_CAT_COLOR = '#38bdf8';

const CATEGORY_SWATCHES = [
  { value: '#38bdf8', label: 'Sky' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#eab308', label: 'Gold' },
  { value: '#f43f5e', label: 'Rose' },
  { value: '#a1a1aa', label: 'Slate' },
];

const EXPENSE_PALETTE = [
  '#84cc16',
  '#38bdf8',
  '#10b981',
  '#eab308',
  '#f43f5e',
  '#65a30d',
  '#a1a1aa',
];

const CATEGORY_ICON_OPTIONS = [
  { value: 'folder', label: 'General', Icon: Folder },
  { value: 'home', label: 'Housing', Icon: Home },
  { value: 'utensils', label: 'Dining', Icon: Utensils },
  { value: 'car', label: 'Transport', Icon: Car },
  { value: 'zap', label: 'Utilities', Icon: Zap },
  { value: 'tv', label: 'Media', Icon: Tv },
  { value: 'shopping', label: 'Shopping', Icon: ShoppingCart },
  { value: 'card', label: 'Credit', Icon: CreditCard },
  { value: 'savings', label: 'Savings', Icon: PiggyBank },
];

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const getMonthlyMultiplier = (frequency?: string) => {
  const f = (frequency || 'monthly').toLowerCase();
  if (f === 'quarterly') return 1 / 3;
  if (f === 'yearly' || f === 'annual' || f === 'annually') return 1 / 12;
  return 1;
};

const formatOrdinalDay = (day: number | null | undefined): string => {
  if (day == null || !Number.isFinite(day) || day < 1 || day > 31) return '—';
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

const resolveCategoryColor = (rawColor?: string | null): string => {
  const trimmed = (rawColor || '').trim();
  if (!trimmed || trimmed === '#000000' || trimmed === '#000') {
    return 'var(--as-status-info)';
  }
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    const r = parseInt(trimmed.slice(1, 3), 16);
    const g = parseInt(trimmed.slice(3, 5), 16);
    const b = parseInt(trimmed.slice(5, 7), 16);
    if (r < 40 && g < 40 && b < 40) return 'var(--as-status-info)';
  }
  return trimmed;
};

const getCategoryIcon = (iconName?: string, catName?: string) => {
  const key = `${iconName || ''} ${catName || ''}`.toLowerCase().replace(/_/g, ' ');
  if (
    key.includes('card') ||
    key.includes('credit') ||
    key.includes('debt') ||
    key.includes('loan')
  ) {
    return <CreditCard size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (key.includes('shop') || key.includes('store') || key.includes('cart')) {
    return <ShoppingCart size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    /\bcar\b/.test(key) ||
    key.includes('auto') ||
    key.includes('gas') ||
    key.includes('transport') ||
    key.includes('transit')
  ) {
    return <Car size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    key.includes('house') ||
    key.includes('home') ||
    key.includes('housing') ||
    key.includes('rent') ||
    key.includes('mortgage')
  ) {
    return <Home size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    key.includes('food') ||
    key.includes('dining') ||
    key.includes('dine') ||
    key.includes('grocer') ||
    key.includes('restaurant') ||
    /\beat\b/.test(key) ||
    key.includes('utensil')
  ) {
    return <Utensils size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    key.includes('util') ||
    key.includes('electric') ||
    key.includes('power') ||
    key.includes('water') ||
    key.includes('energy') ||
    key.includes('zap')
  ) {
    return <Zap size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    key.includes('tv') ||
    key.includes('stream') ||
    key.includes('entertain') ||
    key.includes('movie') ||
    key.includes('subscript') ||
    key.includes('media') ||
    key.includes('music')
  ) {
    return <Tv size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  if (
    key.includes('sav') ||
    key.includes('invest') ||
    key.includes('piggy') ||
    key.includes('bank')
  ) {
    return <PiggyBank size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
  }
  return <Folder size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />;
};

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

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
}

interface Expense {
  id: string;
  category_id: string | null;
  name: string;
  amount: number;
  due_day_of_month: number | null;
  is_recurring: boolean;
  frequency: string;
  account_id: string | null;
  notes: string;
  url: string | null;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category_id: '',
    name: '',
    amount: '',
    due_day_of_month: '',
    is_recurring: true,
    frequency: 'monthly',
    account_id: '',
    notes: '',
    url: '',
  });
  const [catForm, setCatForm] = useState({
    name: '',
    color: DEFAULT_CAT_COLOR,
    icon: 'folder',
  });

  const {
    data: filteredAndSortedExpenses,
    sortKey,
    sortDirection,
    requestSort,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
  } = useTable<Expense>(expenses, {
    searchKeys: [
      'name',
      (item) => categories.find((c) => c.id === item.category_id)?.name || 'Uncategorized',
      (item) => accounts.find((a) => a.id === item.account_id)?.name || '',
      (item) => (item.due_day_of_month != null ? formatOrdinalDay(item.due_day_of_month) : ''),
      (item) =>
        item.is_recurring
          ? FREQUENCY_LABELS[(item.frequency || 'monthly').toLowerCase()] || item.frequency
          : 'One-time',
      'notes',
    ],
    sortExtractors: {
      category: (item) => categories.find((c) => c.id === item.category_id)?.name || '',
      account: (item) => accounts.find((a) => a.id === item.account_id)?.name || '',
      amount: (item) => Number(item.amount),
      due_day_of_month: (item) => item.due_day_of_month ?? 99,
      is_recurring: (item) =>
        item.is_recurring ? FREQUENCY_LABELS[item.frequency] || item.frequency : 'zzz',
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const load = useCallback(() => {
    return Promise.all([
      axios.get('/api/expenses').then((r) => r.data),
      axios.get('/api/expenses/categories').then((r) => r.data),
      axios.get('/api/accounts').then((r) => r.data),
    ])
      .then(([e, c, a]) => {
        setExpenses(e);
        setCategories(c);
        setAccounts(a);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load expense records. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = useCallback(() => {
    setForm({
      category_id: '',
      name: '',
      amount: '',
      due_day_of_month: '',
      is_recurring: true,
      frequency: 'monthly',
      account_id: '',
      notes: '',
      url: '',
    });
    setEditingId(null);
  }, []);

  useEffect(() => {
    if (!showModal && !showCatModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCatModal) {
          setShowCatModal(false);
        } else if (showModal) {
          setShowModal(false);
          resetForm();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal, showCatModal, resetForm]);

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setForm({
      category_id: e.category_id || '',
      name: e.name || '',
      amount: Number(e.amount).toFixed(2),
      due_day_of_month: e.due_day_of_month != null ? String(e.due_day_of_month) : '',
      is_recurring: e.is_recurring,
      frequency: e.frequency || 'monthly',
      account_id: e.account_id || '',
      notes: e.notes || '',
      url: e.url || '',
    });
    setEditingId(e.id);
    setShowModal(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      due_day_of_month: form.due_day_of_month ? parseInt(form.due_day_of_month, 10) : null,
      account_id: form.account_id || null,
      category_id: form.category_id || null,
      notes: form.notes.trim() || '',
      url: form.url.trim() || null,
    };
    try {
      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, payload);
      } else {
        await axios.post('/api/expenses', payload);
      }
      resetForm();
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to save expense. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const safeColor =
      catForm.color === '#000000' || !catForm.color ? DEFAULT_CAT_COLOR : catForm.color;
    try {
      await axios.post('/api/expenses/categories', {
        name: catForm.name.trim(),
        color: safeColor,
        icon: catForm.icon || 'folder',
      });
      setCatForm({ name: '', color: DEFAULT_CAT_COLOR, icon: 'folder' });
      setShowCatModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to add category. Check the name and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpenseItem = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`/api/expenses/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to delete expense. Please try again.');
    }
  };

  const updateExpenseItem = async (
    id: string,
    key: string,
    val: string | number | boolean | null
  ) => {
    setError(null);
    try {
      await axios.put(`/api/expenses/${id}`, { [key]: val });
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to update expense. Please try again.');
    }
  };

  const totalMonthly = expenses
    .filter((e) => e.is_recurring)
    .reduce((s, e) => s + Number(e.amount) * getMonthlyMultiplier(e.frequency), 0);

  const byCategory = (() => {
    const knownIds = new Set(categories.map((c) => c.id));
    const grouped = categories
      .map((c, idx) => {
        const items = expenses.filter((e) => e.category_id === c.id);
        const value = items.reduce(
          (s, e) =>
            s + Number(e.amount) * (e.is_recurring ? getMonthlyMultiplier(e.frequency) : 1),
          0
        );
        const resolved = resolveCategoryColor(c.color);
        return {
          id: c.id,
          name: c.name,
          color:
            resolved === 'var(--as-status-info)'
              ? EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length]
              : resolved,
          icon: c.icon,
          value,
          count: items.length,
        };
      })
      .filter((c) => c.value > 0);

    const uncategorizedItems = expenses.filter((e) => !e.category_id || !knownIds.has(e.category_id));
    const uncategorizedValue = uncategorizedItems.reduce(
      (s, e) => s + Number(e.amount) * (e.is_recurring ? getMonthlyMultiplier(e.frequency) : 1),
      0
    );
    if (uncategorizedValue > 0) {
      grouped.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        color: '#9494a1',
        icon: 'folder',
        value: uncategorizedValue,
        count: uncategorizedItems.length,
      });
    }
    return grouped.sort((a, b) => b.value - a.value);
  })();

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>
            <Receipt
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }}
            />
            <span>Expenses</span>
          </h2>
          <p>Monthly recurring obligations and discretionary allocations.</p>
        </div>
        <div className="page-header-actions">
          <Link href="/dashboard/types" className="btn btn-secondary">
            <Tags size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Categories</span>
          </Link>
        </div>
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

      <div className="expense-top-grid section">
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3
                size={16}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-text-secondary)' }}
              />
              Expense Breakdown
            </h3>
          </div>
          {loading ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
              aria-busy="true"
              aria-label="Loading expense breakdown"
            >
              <div className="skeleton" style={{ height: 180, width: '100%' }} />
            </div>
          ) : byCategory.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <div style={{ width: '100%', minWidth: 0, height: 190 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={76}
                      innerRadius={52}
                      paddingAngle={2}
                      isAnimationActive={false}
                      stroke="var(--as-bg-surface)"
                    >
                      {byCategory.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(Number(v))}
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byCategory.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '6px 0',
                      borderBottom: '1px solid var(--as-border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--as-text-primary)',
                        minWidth: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 'var(--as-radius-pill)',
                          background: c.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getCategoryIcon(c.icon, c.name)}
                        {c.name}
                      </span>
                    </span>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: 'var(--as-font-mono)',
                        fontWeight: 600,
                        color: 'var(--as-text-secondary)',
                        flexShrink: 0,
                      }}
                    >
                      {fmt(c.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>Add expenses to view your monthly category distribution.</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className={`stat-card${!loading && Math.abs(totalMonthly) < 0.005 ? ' stat-zero' : ''}`}>
            <div className="stat-label">Total Monthly</div>
            {loading ? (
              <div className="skeleton" style={{ height: 28, width: 120, marginTop: 6 }} />
            ) : (
              <>
                <div className="stat-value tabular-nums">{fmt(totalMonthly)}</div>
                <div
                  className="stat-sub tabular-nums"
                  style={{ color: 'var(--as-text-secondary)' }}
                >
                  {expenses.filter((e) => e.is_recurring).length} recurring (prorated monthly)
                </div>
              </>
            )}
          </div>
          <div className={`stat-card${!loading && categories.length < 0.005 ? ' stat-zero' : ''}`}>
            <div className="stat-label">Categories</div>
            {loading ? (
              <div className="skeleton" style={{ height: 28, width: 60, marginTop: 6 }} />
            ) : (
              <div className="stat-value tabular-nums">{categories.length}</div>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-small"
              style={{ marginTop: 8, alignSelf: 'flex-start' }}
              onClick={() => setShowCatModal(true)}
            >
              <Plus size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Add Category</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>
            <Receipt
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-text-secondary)' }}
            />
            <span>All Expenses</span>
          </h3>
          <div className="card-header-actions">
            <ExcelUpload
              templateName="expenses_template.xlsx"
              templateColumns={[
                { header: 'Name', example: 'Rent' },
                { header: 'Category', example: 'Housing' },
                { header: 'Amount', example: 1500.0 },
                { header: 'Due Day', example: 1 },
                { header: 'Recurring', example: 'yes' },
                { header: 'Frequency', example: 'monthly' },
                { header: 'Notes', example: '' },
              ]}
              onImport={async (rows) => {
                let created = 0;
                const errors: string[] = [];
                for (let i = 0; i < rows.length; i++) {
                  const r = rows[i];
                  const name = String(r['Name'] || '').trim();
                  if (!name) {
                    errors.push(`Row ${i + 2}: Missing Name`);
                    continue;
                  }
                  const amount = parseFloat(r['Amount']);
                  if (isNaN(amount)) {
                    errors.push(`Row ${i + 2}: Invalid Amount`);
                    continue;
                  }
                  const catName = String(r['Category'] || '').trim();
                  const cat = categories.find(
                    (c) => c.name.toLowerCase() === catName.toLowerCase()
                  );
                  if (!cat && catName) {
                    errors.push(`Row ${i + 2}: Category "${catName}" not found — create it first`);
                    continue;
                  }
                  const isRec = String(r['Recurring'] || 'yes')
                    .trim()
                    .toLowerCase();
                  try {
                    await axios.post('/api/expenses', {
                      name,
                      category_id: cat?.id || null,
                      amount,
                      due_day_of_month: parseInt(r['Due Day'], 10) || null,
                      is_recurring: isRec !== 'no' && isRec !== 'false' && isRec !== '0',
                      frequency: String(r['Frequency'] || 'monthly')
                        .trim()
                        .toLowerCase(),
                      notes: r['Notes'] || '',
                    });
                    created++;
                  } catch (e: unknown) {
                    const err = e as { message?: string };
                    errors.push(`Row ${i + 2}: ${err.message || 'Import error'}`);
                  }
                }
                return { created, errors };
              }}
              onComplete={load}
            />
            <TableSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isOpen={searchOpen}
              setIsOpen={setSearchOpen}
            />
            <button type="button" className="btn btn-primary btn-small" onClick={openCreate}>
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
        {loading ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
            aria-busy="true"
            aria-label="Loading expenses"
          >
            <div className="skeleton" style={{ height: 38, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
            <div className="skeleton" style={{ height: 48, width: '100%' }} />
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Receipt size={32} strokeWidth={1.5} aria-hidden="true" focusable="false" />
            </div>
            <h3>No expenses recorded</h3>
            <p>Add monthly bills, subscriptions, or recurring obligations to track cash burn.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreate}
              style={{ marginTop: 12 }}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Expense
            </button>
          </div>
        ) : filteredAndSortedExpenses.length === 0 ? (
          <div className="empty-state">
            <h3>No matching expenses</h3>
            <p>No expenses match &ldquo;{searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setSearchQuery('')}
              style={{ marginTop: 12 }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <TableHeader
                    label="Expense"
                    sortKey="name"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                  />
                  <TableHeader
                    label="Category"
                    sortKey="category"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                  />
                  <TableHeader
                    label="Amount"
                    sortKey="amount"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                    style={{ textAlign: 'right' }}
                  />
                  <TableHeader
                    label="Account"
                    sortKey="account"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                  />
                  <TableHeader
                    label="Due Day"
                    sortKey="due_day_of_month"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                    style={{ textAlign: 'right' }}
                  />
                  <TableHeader
                    label="Frequency"
                    sortKey="is_recurring"
                    activeKey={sortKey}
                    activeDirection={sortDirection}
                    onClick={requestSort}
                  />
                  <th scope="col" className="col-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedExpenses.map((e) => {
                  const cat = categories.find((c) => c.id === e.category_id);
                  const acct = accounts.find((a) => a.id === e.account_id);
                  const safeCatColor = cat ? resolveCategoryColor(cat.color) : null;
                  const freqKey = (e.frequency || 'monthly').toLowerCase();
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{e.name}</div>
                        {e.notes && (
                          <div
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 400,
                              color: 'var(--as-text-secondary)',
                              marginTop: 2,
                            }}
                          >
                            {e.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        {cat && safeCatColor ? (
                          <span
                            className="badge"
                            style={{
                              background: `color-mix(in srgb, ${safeCatColor} 16%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${safeCatColor} 32%, transparent)`,
                              color: safeCatColor,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            {getCategoryIcon(cat.icon, cat.name)}
                            {cat.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--as-text-secondary)', fontSize: '0.82rem' }}>
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="amount">
                        <InlineEdit
                          value={e.amount}
                          onSave={async (v) => {
                            await updateExpenseItem(e.id, 'amount', Number(v));
                          }}
                        />
                      </td>
                      <td>
                        {acct ? (
                          <span
                            className="badge badge-blue"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Landmark
                              size={12}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                            />
                            {acct.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--as-text-secondary)' }}>—</span>
                        )}
                      </td>
                      <td className="amount" style={{ color: 'var(--as-text-secondary)' }}>
                        {formatOrdinalDay(e.due_day_of_month)}
                      </td>
                      <td>
                        {e.is_recurring ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                            <span className="badge badge-blue">
                              {FREQUENCY_LABELS[freqKey] || e.frequency || 'Monthly'}
                            </span>
                            {(freqKey === 'quarterly' || freqKey === 'yearly') && (
                              <span
                                className="tabular-nums"
                                style={{
                                  fontSize: '0.72rem',
                                  fontFamily: 'var(--as-font-mono)',
                                  color: 'var(--as-text-secondary)',
                                }}
                              >
                                {fmt(Number(e.amount) * getMonthlyMultiplier(e.frequency))}/mo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-amber">One-time</span>
                        )}
                      </td>
                      <td className="col-actions">
                        <div className="row-actions-group">
                          {e.url && (
                            <div className="tooltip-wrapper">
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-action-btn"
                                aria-label={`Visit billing site for ${e.name}`}
                              >
                                <ExternalLink
                                  size={14}
                                  strokeWidth={2.0}
                                  aria-hidden="true"
                                  focusable="false"
                                />
                              </a>
                              <div className="tooltip-bubble" role="tooltip">
                                <span>Visit billing site</span>
                              </div>
                            </div>
                          )}
                          <div className="tooltip-wrapper">
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => openEdit(e)}
                              aria-label={`Edit ${e.name}`}
                            >
                              <Pencil
                                size={14}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                            </button>
                            <div className="tooltip-bubble" role="tooltip">
                              <span>Edit {e.name}</span>
                            </div>
                          </div>
                          <DeleteButton
                            onDelete={() => deleteExpenseItem(e.id)}
                            ariaLabel={`Delete ${e.name}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Expense Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 id="expense-modal-title">{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="expense-name">Name</label>
                <input
                  id="expense-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rent, Netflix"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expense-category">Category</label>
                  <select
                    id="expense-category"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="expense-amount">Amount</label>
                  <div className="input-unit-wrap">
                    <span className="input-unit-left" aria-hidden="true">
                      $
                    </span>
                    <input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      className="has-unit-left"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expense-due-day">Due Day of Month</label>
                  <input
                    id="expense-due-day"
                    type="number"
                    min="1"
                    max="31"
                    value={form.due_day_of_month}
                    onChange={(e) => setForm({ ...form, due_day_of_month: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expense-frequency">Frequency</label>
                  <select
                    id="expense-frequency"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="expense-account">Deducted From Account</label>
                <select
                  id="expense-account"
                  value={form.account_id}
                  onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                >
                  <option value="">No specific account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="expense-url">Website Direct Link</label>
                <input
                  id="expense-url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="e.g. https://www.netflix.com/your-account"
                />
              </div>
              <div className="form-group">
                <label htmlFor="expense-notes">Notes</label>
                <input
                  id="expense-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional billing details or memo"
                />
              </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    minHeight: 44,
                  }}
                >
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={form.is_recurring}
                    onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                    style={{
                      width: 18,
                      height: 18,
                      minHeight: 18,
                      padding: 0,
                      margin: 0,
                      accentColor: 'var(--as-accent-primary)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <label
                    htmlFor="isRecurring"
                    style={{
                      margin: 0,
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--as-text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Recurring expense
                  </label>
                </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 id="cat-modal-title">Add Category</h3>
            <form onSubmit={handleCatSubmit}>
              <div className="form-group">
                <label htmlFor="cat-name">Name</label>
                <input
                  id="cat-name"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Housing, Subscriptions"
                />
              </div>
              <div className="form-group">
                <label htmlFor="cat-color">Color</label>
                <div
                  role="group"
                  aria-label="Category color presets"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {CATEGORY_SWATCHES.map((swatch) => {
                    const selected = catForm.color.toLowerCase() === swatch.value.toLowerCase();
                    return (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, color: swatch.value })}
                        aria-label={`Select ${swatch.label} color`}
                        aria-pressed={selected}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--as-radius-sm)',
                          background: swatch.value,
                          border: selected
                            ? '1px solid var(--as-text-primary)'
                            : '1px solid var(--as-border-subtle)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--as-bg-base)',
                        }}
                      >
                        {selected && (
                          <Check size={16} strokeWidth={2.5} aria-hidden="true" focusable="false" />
                        )}
                      </button>
                    );
                  })}
                  <input
                    id="cat-color"
                    type="color"
                    value={catForm.color}
                    onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                    aria-label="Custom category color"
                    style={{
                      width: 44,
                      height: 44,
                      padding: 2,
                      background: 'var(--as-bg-base)',
                      border: '1px solid var(--as-border-subtle)',
                      borderRadius: 'var(--as-radius-sm)',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <span
                  id="cat-icon-group-label"
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--as-text-secondary)',
                  }}
                >
                  Icon
                </span>
                <div
                  role="group"
                  aria-labelledby="cat-icon-group-label"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 8,
                  }}
                >
                  {CATEGORY_ICON_OPTIONS.map(({ value, label, Icon }) => {
                    const selected = catForm.icon === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, icon: value })}
                        aria-pressed={selected}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          minHeight: 44,
                          padding: '6px 10px',
                          borderRadius: 'var(--as-radius-sm)',
                          background: selected ? 'var(--as-bg-overlay)' : 'var(--as-bg-base)',
                          border: selected
                            ? '1px solid var(--as-accent-primary)'
                            : '1px solid var(--as-border-subtle)',
                          color: selected ? 'var(--as-accent-primary)' : 'var(--as-text-primary)',
                          fontSize: '0.8125rem',
                          fontWeight: selected ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Icon size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCatModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
