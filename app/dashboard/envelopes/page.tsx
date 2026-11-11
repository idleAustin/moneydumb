'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import {
  Mail,
  Wand2,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Home,
  Utensils,
  Zap,
  Car,
  Film,
  CreditCard,
  ShoppingBag,
  Package,
  Folder,
  type LucideIcon,
} from 'lucide-react';

function getCategoryIcon(name: string, icon?: string): LucideIcon {
  const n = (name || '').toLowerCase().replace(/_/g, ' ');
  const i = (icon || '').toLowerCase().trim();
  if (
    n.includes('card') ||
    n.includes('credit') ||
    n.includes('debt') ||
    n.includes('loan') ||
    i === '\u{1F4B8}' ||
    i === 'credit_card'
  ) {
    return CreditCard;
  }
  if (
    n.includes('shop') ||
    n.includes('store') ||
    n.includes('cart') ||
    i === '\u{1F6D2}' ||
    i === 'shopping_cart'
  ) {
    return ShoppingBag;
  }
  if (
    /\bcar\b/.test(n) ||
    n.includes('auto') ||
    n.includes('gas') ||
    n.includes('transit') ||
    n.includes('transport') ||
    i === '\u{1F697}' ||
    i === 'directions_car'
  ) {
    return Car;
  }
  if (
    n.includes('hous') ||
    n.includes('rent') ||
    n.includes('home') ||
    i === '\u{1F3E0}' ||
    i === 'home'
  ) {
    return Home;
  }
  if (
    n.includes('food') ||
    n.includes('groc') ||
    n.includes('dining') ||
    i === '\u{1F354}' ||
    i === 'restaurant'
  ) {
    return Utensils;
  }
  if (
    n.includes('util') ||
    n.includes('power') ||
    n.includes('elect') ||
    i === '\u{26A1}' ||
    i === 'bolt'
  ) {
    return Zap;
  }
  if (
    n.includes('subscript') ||
    n.includes('stream') ||
    n.includes('movie') ||
    n.includes('entertain') ||
    i === '\u{1F504}' ||
    i === 'subscriptions' ||
    i === '\u{1F3AC}' ||
    i === 'movie'
  ) {
    return Film;
  }
  if (n.includes('other') || i === '\u{1F4E6}' || i === 'inventory_2') {
    return Package;
  }
  return Folder;
}

const fmt = (n: number) => {
  const val = Object.is(n, -0) || Math.abs(n) < 0.00001 ? 0 : n;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

interface Envelope {
  id: string;
  category_id: string | null;
  name: string;
  budgeted_amount: number;
  spent_amount: number;
  notes: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface SmartEnvelopeResult {
  created?: unknown[];
  skipped: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Envelopes() {
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState<string | null>(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingSpend, setSubmittingSpend] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [spendError, setSpendError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category_id: '', budgeted_amount: '', notes: '' });
  const [spendForm, setSpendForm] = useState({ amount: '', description: '' });
  const [smartResult, setSmartResult] = useState<SmartEnvelopeResult | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      axios.get('/api/envelopes', { params: { month, year } }).then((r) => r.data),
      axios.get('/api/expenses/categories').then((r) => r.data),
    ])
      .then(([e, c]) => {
        setEnvelopes(Array.isArray(e) ? e : []);
        setCategories(Array.isArray(c) ? c : []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load envelopes for this month. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, year]);

  const handleRetry = () => {
    if (envelopes.length === 0) setLoading(true);
    setError(null);
    void load();
  };

  const shiftMonth = (delta: -1 | 1) => {
    setLoading(true);
    setError(null);
    setSmartResult(null);
    if (delta === -1) {
      if (month === 1) {
        setMonth(12);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      if (month === 12) {
        setMonth(1);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!showModal && !showSpendModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showSpendModal && !submittingSpend) {
        setShowSpendModal(null);
        setSpendError(null);
      } else if (showModal && !submittingCreate) {
        setShowModal(false);
        setFormError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showSpendModal, submittingCreate, submittingSpend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingCreate) return;
    setSubmittingCreate(true);
    setFormError(null);
    try {
      await axios.post('/api/envelopes', {
        ...form,
        budgeted_amount: parseFloat(form.budgeted_amount) || 0,
        category_id: form.category_id || null,
        month,
        year,
      });
      setForm({ name: '', category_id: '', budgeted_amount: '', notes: '' });
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setFormError('Could not create envelope. Verify your entries and try again.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSpendModal || submittingSpend) return;
    setSubmittingSpend(true);
    setSpendError(null);
    try {
      await axios.post('/api/envelopes/transactions', {
        envelope_id: showSpendModal,
        amount: parseFloat(spendForm.amount) || 0,
        description: spendForm.description || null,
      });
      setSpendForm({ amount: '', description: '' });
      setShowSpendModal(null);
      await load();
    } catch (err) {
      console.error(err);
      setSpendError('Could not record spending entry. Verify the amount and try again.');
    } finally {
      setSubmittingSpend(false);
    }
  };

  const handleSmartEnvelope = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await axios
        .post('/api/envelopes/smart', { month, year })
        .then((r) => r.data);
      setSmartResult(result);
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not generate envelopes from recurring expenses. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteEnvelopeItem = async (id: string) => {
    try {
      await axios.delete(`/api/envelopes/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not delete envelope. Please retry.');
    }
  };

  const totalBudgeted = envelopes.reduce((s, e) => s + Number(e.budgeted_amount), 0);
  const totalSpent = envelopes.reduce((s, e) => s + Number(e.spent_amount), 0);
  const overCount = envelopes.filter(
    (e) => Number(e.spent_amount) > Number(e.budgeted_amount)
  ).length;
  const selectedEnvelope = envelopes.find((e) => e.id === showSpendModal) || null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          <Mail
            size={20}
            strokeWidth={2.0}
            aria-hidden="true"
            focusable="false"
            style={{ marginRight: 8, color: 'var(--as-accent-primary)' }}
          />{' '}
          Envelope Budgeting
        </h2>
        <p>Set monthly category spending caps and track remaining safe allocation.</p>
      </div>

      {/* Month Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          <span>Prev</span>
        </button>
        <span
          style={{
            fontWeight: 700,
            fontSize: '1.05rem',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 150,
            textAlign: 'center',
          }}
        >
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          <span>Next</span>
          <ChevronRight size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </button>
      </div>

      {error && (
        <div className="error-state-banner section" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-status-error)', flexShrink: 0 }}
            />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Smart Result Banner */}
      {smartResult && (
        <div
          className="alert alert-info section"
          role="status"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Wand2
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 4, color: 'var(--as-status-info)' }}
            />
            <span>
              Created{' '}
              <strong style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {smartResult.created?.length || 0}
              </strong>{' '}
              envelope{smartResult.created?.length !== 1 ? 's' : ''} from recurring expenses
            </span>
            {smartResult.skipped > 0 && (
              <span
                style={{
                  color: 'var(--as-text-secondary)',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                · {smartResult.skipped} skipped (already exist)
              </span>
            )}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => setSmartResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div aria-busy="true" aria-label="Loading monthly envelopes">
          <div className="card-grid-3 section">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="stat-card">
                <div
                  className="skeleton"
                  style={{ height: 12, width: '42%', marginBottom: 12 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 28, width: '64%' }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
          <div className="card-grid">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="envelope-card">
                <div
                  className="skeleton"
                  style={{ height: 18, width: '55%', marginBottom: 16 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 14, width: '75%', marginBottom: 12 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 8, width: '100%', marginBottom: 10 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 12, width: '40%' }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="card-grid-3 section">
            <div className="stat-card stat-blue">
              <div className="stat-label">Total Budgeted</div>
              <div
                className="stat-value"
                style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(totalBudgeted)}
              </div>
            </div>
            <div className={`stat-card ${totalSpent > totalBudgeted ? 'stat-red' : 'stat-green'}`}>
              <div className="stat-label">Total Spent</div>
              <div
                className="stat-value"
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  ...(totalSpent > totalBudgeted ? { color: 'var(--as-status-error)' } : {}),
                }}
              >
                {fmt(totalSpent)}
              </div>
            </div>
            <div className={`stat-card ${overCount > 0 ? 'stat-red' : 'stat-green'}`}>
              <div className="stat-label">Over Budget</div>
              <div
                className="stat-value"
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  ...(overCount > 0 ? { color: 'var(--as-status-error)' } : {}),
                }}
              >
                {overCount}
              </div>
              <div
                className="stat-sub"
                style={{
                  color: 'var(--as-text-secondary)',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                of {envelopes.length} {envelopes.length === 1 ? 'envelope' : 'envelopes'}
              </div>
            </div>
          </div>

          {envelopes.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSmartEnvelope}
                disabled={generating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {generating ? (
                  <>
                    <Loader2
                      size={16}
                      strokeWidth={2.0}
                      className="animate-spin"
                      aria-hidden="true"
                      focusable="false"
                    />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    <span>Smart Envelope</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setFormError(null);
                  setShowModal(true);
                }}
              >
                + New Envelope
              </button>
            </div>
          )}

          {envelopes.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">
                  <Mail
                    size={32}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    focusable="false"
                    style={{ color: 'var(--as-accent-primary)' }}
                  />
                </div>
                <h3>
                  No envelopes for {MONTH_NAMES[month - 1]} {year}
                </h3>
                <p>
                  Create monthly category caps manually or generate envelopes automatically from your
                  recurring expenses.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSmartEnvelope}
                    disabled={generating}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {generating ? (
                      <>
                        <Loader2
                          size={16}
                          strokeWidth={2.0}
                          className="animate-spin"
                          aria-hidden="true"
                          focusable="false"
                        />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                        <span>Smart Envelope</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setFormError(null);
                      setShowModal(true);
                    }}
                  >
                    + New Envelope
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-grid">
              {envelopes.map((env) => {
                const budgetNum = Number(env.budgeted_amount) || 0;
                const spentNum = Number(env.spent_amount) || 0;
                const pct =
                  budgetNum > 0
                    ? Math.min(Math.max((spentNum / budgetNum) * 100, 0), 100)
                    : spentNum > 0
                    ? 100
                    : 0;
                const ariaNow = Math.round(pct);
                const over = spentNum > budgetNum;
                const remaining = budgetNum - spentNum;
                const cat = categories.find((c) => c.id === env.category_id);
                const colorClass = over
                  ? 'progress-red'
                  : pct > 75
                  ? 'progress-amber'
                  : 'progress-green';
                return (
                  <div key={env.id} className="envelope-card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          className="envelope-name"
                          title={env.name}
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {env.name}
                        </div>
                        {cat &&
                          (() => {
                            const IconComp = getCategoryIcon(cat.name, cat.icon);
                            return (
                              <span
                                className="badge"
                                style={{
                                  background: 'var(--as-bg-elevated)',
                                  border: '1px solid var(--as-border-subtle)',
                                  color: 'var(--as-text-secondary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--as-radius-pill)',
                                  fontSize: '0.75rem',
                                  marginTop: 4,
                                  maxWidth: '100%',
                                }}
                              >
                                <IconComp
                                  size={13}
                                  strokeWidth={2.0}
                                  aria-hidden="true"
                                  focusable="false"
                                  style={{ color: 'var(--as-text-secondary)', flexShrink: 0 }}
                                />
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {cat.name}
                                </span>
                              </span>
                            );
                          })()}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => {
                            setSpendError(null);
                            setSpendForm({ amount: '', description: '' });
                            setShowSpendModal(env.id);
                          }}
                          aria-label={`+ Spend for ${env.name}`}
                        >
                          + Spend
                        </button>
                        <DeleteButton
                          onDelete={() => deleteEnvelopeItem(env.id)}
                          ariaLabel={`Delete envelope ${env.name}`}
                        />
                      </div>
                    </div>

                    <div
                      className="envelope-amounts"
                      style={{
                        fontFamily: 'var(--as-font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <span
                        className="spent"
                        style={{ color: over ? 'var(--as-status-error)' : 'var(--as-text-primary)' }}
                      >
                        {fmt(spentNum)} spent
                      </span>
                      <span style={{ color: 'var(--as-text-secondary)' }}>
                        of {fmt(budgetNum)}
                      </span>
                    </div>

                    <div
                      className={`progress-bar ${colorClass}`}
                      role="progressbar"
                      aria-label={`${env.name} spending progress`}
                      aria-valuenow={ariaNow}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: '0.8125rem',
                        fontFamily: 'var(--as-font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        color: over ? 'var(--as-status-error)' : 'var(--as-status-success)',
                        fontWeight: 600,
                      }}
                    >
                      {over
                        ? `${fmt(Math.abs(remaining))} over budget`
                        : `${fmt(remaining)} remaining`}
                    </div>

                    {env.notes && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: '0.75rem',
                          color: 'var(--as-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 0,
                        }}
                      >
                        <FileText
                          size={13}
                          strokeWidth={2.0}
                          aria-hidden="true"
                          focusable="false"
                          style={{ marginRight: 4, flexShrink: 0 }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {env.notes}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* New Envelope Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!submittingCreate) {
              setShowModal(false);
              setFormError(null);
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-envelope-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="new-envelope-modal-title">
              New Envelope — {MONTH_NAMES[month - 1]} {year}
            </h3>
            {formError && (
              <p
                role="alert"
                style={{ color: 'var(--as-status-error)', fontSize: '0.85rem', marginBottom: 12 }}
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="envelope-name">Name</label>
                <input
                  id="envelope-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Groceries, Gas, Dining"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="envelope-category">Category</label>
                  <select
                    id="envelope-category"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="envelope-budget">Budget Amount</label>
                  <input
                    id="envelope-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.budgeted_amount}
                    onChange={(e) => setForm({ ...form, budgeted_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="envelope-notes">Notes (optional)</label>
                <input
                  id="envelope-notes"
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional allocation notes"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submittingCreate}
                  onClick={() => {
                    setShowModal(false);
                    setFormError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingCreate}
                >
                  {submittingCreate ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spend Modal */}
      {showSpendModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!submittingSpend) {
              setShowSpendModal(null);
              setSpendError(null);
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="spend-envelope-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="spend-envelope-modal-title">
              {selectedEnvelope ? `Log Spending — ${selectedEnvelope.name}` : 'Log Spending'}
            </h3>
            {spendError && (
              <p
                role="alert"
                style={{ color: 'var(--as-status-error)', fontSize: '0.85rem', marginBottom: 12 }}
              >
                {spendError}
              </p>
            )}
            <form onSubmit={handleSpend}>
              <div className="form-group">
                <label htmlFor="spend-amount">Amount</label>
                <input
                  id="spend-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={spendForm.amount}
                  onChange={(e) => setSpendForm({ ...spendForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label htmlFor="spend-description">Description</label>
                <input
                  id="spend-description"
                  type="text"
                  value={spendForm.description}
                  onChange={(e) => setSpendForm({ ...spendForm, description: e.target.value })}
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submittingSpend}
                  onClick={() => {
                    setShowSpendModal(null);
                    setSpendError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingSpend}
                >
                  {submittingSpend ? 'Logging...' : 'Log Spend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
