'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import useTable from '../hooks/useTable';
import TableSearch from '../components/TableSearch';
import TableHeader from '../components/TableHeader';
import {
  Sparkles,
  BarChart3,
  Clock,
  ExternalLink,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  CircleDot,
  Circle,
  ArrowDownCircle,
  Loader2,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';

const priorityConfig: Record<string, { label: string; class: string; Icon: LucideIcon }> = {
  dream: { label: 'Dream', class: 'badge-purple', Icon: Sparkles },
  high: { label: 'High', class: 'badge-red', Icon: CircleDot },
  medium: { label: 'Medium', class: 'badge-amber', Icon: Circle },
  low: { label: 'Low', class: 'badge-green', Icon: ArrowDownCircle },
};

function sanitizeApiText(raw: string): string {
  return raw
    .replace(
      /[\p{Extended_Pictographic}\u{10000}-\u{10FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu,
      ''
    )
    .replace(/\u0021/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function renderRecommendation(rec?: string | null) {
  if (!rec) return null;
  let Icon = CheckCircle2;
  let iconColor = 'var(--as-status-success)';
  const lower = rec.toLowerCase();

  if (rec.includes('\u{26D4}') || lower.includes('costs more than')) {
    Icon = AlertOctagon;
    iconColor = 'var(--as-status-error)';
  } else if (rec.includes('\u{26A0}') || lower.includes('significant expense')) {
    Icon = AlertTriangle;
    iconColor = 'var(--as-status-warning)';
  } else if (rec.includes('\u{1F7E1}') || lower.includes('moderate')) {
    Icon = Info;
    iconColor = 'var(--as-status-warning)';
  } else if (rec.includes('\u{2705}') || lower.includes('affordable')) {
    Icon = CheckCircle2;
    iconColor = 'var(--as-status-success)';
  }

  const cleanText = sanitizeApiText(rec);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px' }}>
      <Icon
        size={16}
        strokeWidth={2.0}
        aria-hidden="true"
        focusable="false"
        style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}
      />
      <span style={{ color: 'var(--as-text-primary)', fontSize: '0.875rem', lineHeight: '1.5' }}>
        {cleanText}
      </span>
    </div>
  );
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

interface Want {
  id: string;
  name: string;
  estimated_cost: number;
  priority: 'low' | 'medium' | 'high' | 'dream';
  notes: string | null;
  url: string | null;
  created_at: string;
  purchased_at: string | null;
}

interface WantAnalysis {
  want: Want;
  monthly_discretionary: number;
  cost_as_percent_of_income: number;
  months_to_save: number;
  recommendation: string;
  best_purchase_timing: string;
}

export default function Wants() {
  const [wants, setWants] = useState<Want[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [confirmingPurchaseId, setConfirmingPurchaseId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    estimated_cost: string;
    priority: Want['priority'];
    notes: string;
    url: string;
  }>({
    name: '',
    estimated_cost: '',
    priority: 'medium',
    notes: '',
    url: '',
  });
  const [analysis, setAnalysis] = useState<WantAnalysis | null>(null);

  const load = useCallback(() => {
    return axios
      .get('/api/wants')
      .then((r) => {
        setWants(Array.isArray(r.data) ? r.data : []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load wishlist items. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleRetry = () => {
    if (wants.length === 0) setLoading(true);
    setError(null);
    void load();
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setShowModal(false);
        setFormError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, submitting]);

  useEffect(() => {
    if (!confirmingPurchaseId) return;
    const timer = window.setTimeout(() => {
      setConfirmingPurchaseId(null);
    }, 3500);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmingPurchaseId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmingPurchaseId]);

  const unpurchased = wants.filter((w) => !w.purchased_at);
  const purchased = wants.filter((w) => Boolean(w.purchased_at));

  const wishlistTable = useTable<Want>(unpurchased, {
    searchKeys: ['name', 'priority', 'notes'],
    sortExtractors: {
      estimated_cost: (item) => Number(item.estimated_cost),
      created_at: (item) => item.created_at,
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const purchasedTable = useTable<Want>(purchased, {
    searchKeys: ['name'],
    sortExtractors: {
      estimated_cost: (item) => Number(item.estimated_cost),
      purchased_at: (item) => item.purchased_at ?? '',
    },
    defaultSort: { key: 'purchased_at', direction: 'desc' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await axios.post('/api/wants', {
        ...form,
        estimated_cost: parseFloat(form.estimated_cost) || 0,
        url: form.url || null,
        notes: form.notes || null,
      });
      setForm({ name: '', estimated_cost: '', priority: 'medium', notes: '', url: '' });
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setFormError('Could not add wishlist item. Verify your entries and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async (id: string) => {
    if (analyzingId) return;
    setAnalyzingId(id);
    setError(null);
    try {
      const a = await axios.get(`/api/wants/${id}/analyze`).then((r) => r.data);
      setAnalysis(a);
    } catch (err) {
      console.error(err);
      setError('Could not run feasibility analysis for this item. Please retry.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handlePurchaseClick = async (id: string) => {
    if (purchasingId) return;
    if (confirmingPurchaseId !== id) {
      setConfirmingPurchaseId(id);
      return;
    }
    setPurchasingId(id);
    setConfirmingPurchaseId(null);
    try {
      await axios.put(`/api/wants/${id}/purchase`);
      if (analysis?.want.id === id) {
        setAnalysis(null);
      }
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not mark item as purchased. Please retry.');
    } finally {
      setPurchasingId(null);
    }
  };

  const deleteWantItem = async (id: string) => {
    try {
      await axios.delete(`/api/wants/${id}`);
      if (analysis?.want.id === id) {
        setAnalysis(null);
      }
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not delete wishlist item. Please retry.');
    }
  };

  const totalUnpurchasedCost = unpurchased.reduce((s, w) => s + Number(w.estimated_cost), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>
            <Sparkles
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }}
            />
            <span>Wants Wishlist</span>
          </h2>
          <p>Rank discretionary purchases and evaluate post-bill cash-flow feasibility.</p>
        </div>
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

      {loading ? (
        <div aria-busy="true" aria-label="Loading wants wishlist">
          <div className="card-grid-3 section">
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="stat-card">
                <div
                  className="skeleton"
                  style={{ height: 12, width: '44%', marginBottom: 12 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 28, width: '58%' }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
          <div className="card section">
            <div className="card-header">
              <div className="skeleton" style={{ height: 18, width: 120 }} aria-hidden="true" />
              <div className="skeleton" style={{ height: 36, width: 120 }} aria-hidden="true" />
            </div>
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="skeleton"
                style={{ height: 46, width: '100%', marginBottom: 8 }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="card-grid-3 section">
            <div className={`stat-card ${unpurchased.length === 0 ? 'stat-zero' : ''}`}>
              <div className="stat-label">Wishlist Items</div>
              <div
                className="stat-value"
                style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {unpurchased.length}
              </div>
            </div>
            <div className={`stat-card ${totalUnpurchasedCost < 0.005 ? 'stat-zero' : ''}`}>
              <div className="stat-label">Total Cost</div>
              <div
                className="stat-value"
                style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {fmt(totalUnpurchasedCost)}
              </div>
            </div>
            <div className={`stat-card ${purchased.length > 0 ? 'stat-green' : 'stat-zero'}`}>
              <div className="stat-label">Purchased</div>
              <div
                className="stat-value"
                style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
              >
                {purchased.length}
              </div>
            </div>
          </div>

          {/* Affordability Analysis Live Region */}
          <div role="region" aria-live="polite" aria-label="Affordability analysis">
            {analysis && (() => {
              const disc = Number(analysis.monthly_discretionary) || 0;
              const pctIncome = Number(analysis.cost_as_percent_of_income);
              const monthsToSave = Number(analysis.months_to_save);
              const noIncomePct = !Number.isFinite(pctIncome) || pctIncome >= 999 || pctIncome < 0;
              const noSurplus =
                disc <= 0 || !Number.isFinite(monthsToSave) || monthsToSave >= 999;

              return (
                <div
                  className="ai-summary section"
                  style={{ borderColor: 'var(--as-border-strong)' }}
                >
                  <h3
                    id="want-analysis-heading"
                    style={{
                      color: 'var(--as-status-success)',
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 14,
                    }}
                  >
                    <BarChart3
                      size={18}
                      strokeWidth={2.0}
                      aria-hidden="true"
                      focusable="false"
                      style={{ marginRight: 6, flexShrink: 0 }}
                    />
                    <span>Analysis: {analysis.want.name}</span>
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 16,
                      paddingBottom: 14,
                      borderBottom: '1px solid var(--as-border-subtle)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--as-text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        Monthly discretionary
                      </div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color:
                            disc < -0.005
                              ? 'var(--as-status-error)'
                              : Math.abs(disc) < 0.005
                              ? 'var(--as-text-tertiary)'
                              : 'var(--as-status-success)',
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmt(disc)}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--as-text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        % of income
                      </div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color:
                            noIncomePct || pctIncome < 0.005
                              ? 'var(--as-text-tertiary)'
                              : 'var(--as-status-warning)',
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {noIncomePct
                          ? '—'
                          : `${pctIncome.toFixed(1).replace(/\.0$/, '')}%`}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--as-text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        Months to save
                      </div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: noSurplus
                            ? 'var(--as-status-error)'
                            : monthsToSave < 0.005
                            ? 'var(--as-text-tertiary)'
                            : 'var(--as-status-info)',
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {noSurplus ? 'No surplus' : `${monthsToSave} mo`}
                      </div>
                    </div>
                  </div>

                  {renderRecommendation(analysis.recommendation)}

                  {analysis.best_purchase_timing && (
                    <p
                      style={{
                        color: 'var(--as-status-info)',
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 8,
                        fontSize: '0.85rem',
                      }}
                    >
                      <Clock
                        size={14}
                        strokeWidth={2.0}
                        aria-hidden="true"
                        focusable="false"
                        style={{ marginRight: 6, flexShrink: 0 }}
                      />
                      <span>{sanitizeApiText(analysis.best_purchase_timing)}</span>
                    </p>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    style={{ marginTop: 12 }}
                    onClick={() => setAnalysis(null)}
                  >
                    Dismiss
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Wishlist */}
          <div className="card section">
            <div className="card-header">
              <h3>Wishlist</h3>
              <div className="card-header-actions">
                {unpurchased.length > 0 && (
                  <TableSearch
                    searchQuery={wishlistTable.searchQuery}
                    setSearchQuery={wishlistTable.setSearchQuery}
                    isOpen={wishlistTable.searchOpen}
                    setIsOpen={wishlistTable.setSearchOpen}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFormError(null);
                    setShowModal(true);
                  }}
                >
                  <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span>Add Want</span>
                </button>
              </div>
            </div>

            {unpurchased.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Sparkles
                    size={32}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    focusable="false"
                    style={{ color: 'var(--as-accent-primary)' }}
                  />
                </div>
                <h3>No items on your wishlist</h3>
                <p>
                  Add upcoming discretionary purchases to test how many months of safe surplus they
                  require.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFormError(null);
                    setShowModal(true);
                  }}
                >
                  <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span>Add Want</span>
                </button>
              </div>
            ) : wishlistTable.data.length === 0 ? (
              <div className="empty-state">
                <h3>No matching wishlist items</h3>
                <p>
                  No wishlist items match &ldquo;{wishlistTable.searchQuery}&rdquo;. Clear the search
                  filter to view all items.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => wishlistTable.setSearchQuery('')}
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
                        label="Item"
                        sortKey="name"
                        activeKey={wishlistTable.sortKey}
                        activeDirection={wishlistTable.sortDirection}
                        onClick={wishlistTable.requestSort}
                      />
                      <TableHeader
                        label="Cost"
                        sortKey="estimated_cost"
                        activeKey={wishlistTable.sortKey}
                        activeDirection={wishlistTable.sortDirection}
                        onClick={wishlistTable.requestSort}
                        style={{ textAlign: 'right' }}
                      />
                      <TableHeader
                        label="Priority"
                        sortKey="priority"
                        activeKey={wishlistTable.sortKey}
                        activeDirection={wishlistTable.sortDirection}
                        onClick={wishlistTable.requestSort}
                      />
                      <TableHeader
                        label="Added"
                        sortKey="created_at"
                        activeKey={wishlistTable.sortKey}
                        activeDirection={wishlistTable.sortDirection}
                        onClick={wishlistTable.requestSort}
                      />
                      <th scope="col" className="col-actions">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {wishlistTable.data.map((w) => {
                      const isConfirming = confirmingPurchaseId === w.id;
                      const isPurchasing = purchasingId === w.id;
                      const isAnalyzing = analyzingId === w.id;
                      const estCost = Number(w.estimated_cost);
                      return (
                        <tr key={w.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--as-text-primary)' }}>
                              {w.name}
                            </div>
                            {w.notes && (
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--as-text-secondary)',
                                  marginTop: 2,
                                }}
                              >
                                {w.notes}
                              </div>
                            )}
                          </td>
                          <td
                            className="amount"
                            style={{
                              color:
                                estCost < 0.005
                                  ? 'var(--as-text-tertiary)'
                                  : 'var(--as-text-primary)',
                              fontFamily: 'var(--as-font-mono)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {fmt(estCost)}
                          </td>
                          <td>
                            {(() => {
                              const cfg = priorityConfig[w.priority] || priorityConfig.medium;
                              const Icon = cfg.Icon;
                              return (
                                <span
                                  className={`badge ${cfg.class || 'badge-blue'}`}
                                  style={{ display: 'inline-flex', alignItems: 'center' }}
                                >
                                  <Icon
                                    size={12}
                                    strokeWidth={2.0}
                                    aria-hidden="true"
                                    focusable="false"
                                    style={{ marginRight: 4 }}
                                  />
                                  {cfg.label || w.priority}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="cell-date">
                            {w.created_at?.substring(0, 10) || '—'}
                          </td>
                          <td className="col-actions">
                            <div className="row-actions-group">
                              {w.url && (
                                <div className="tooltip-wrapper">
                                  <a
                                    href={w.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icon-action-btn"
                                    aria-label={`Open link for ${w.name}`}
                                  >
                                    <ExternalLink
                                      size={14}
                                      strokeWidth={2.0}
                                      aria-hidden="true"
                                      focusable="false"
                                    />
                                  </a>
                                  <div className="tooltip-bubble" role="tooltip">
                                    <span>Open link</span>
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                disabled={Boolean(analyzingId)}
                                onClick={() => handleAnalyze(w.id)}
                                aria-label={`Analyze feasibility for ${w.name}`}
                              >
                                {isAnalyzing ? (
                                  <>
                                    <Loader2
                                      size={13}
                                      strokeWidth={2.0}
                                      className="animate-spin"
                                      aria-hidden="true"
                                      focusable="false"
                                    />
                                    <span>Analyzing...</span>
                                  </>
                                ) : (
                                  <span>Analyze</span>
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                disabled={isPurchasing}
                                onClick={() => handlePurchaseClick(w.id)}
                                aria-label={
                                  isConfirming
                                    ? `Confirm? Mark ${w.name} as purchased`
                                    : `Bought: mark ${w.name} as purchased`
                                }
                                style={
                                  isConfirming
                                    ? {
                                        borderColor: 'var(--as-status-success)',
                                        color: 'var(--as-status-success)',
                                      }
                                    : undefined
                                }
                              >
                                <Check
                                  size={14}
                                  strokeWidth={2.0}
                                  aria-hidden="true"
                                  focusable="false"
                                />
                                <span>
                                  {isPurchasing
                                    ? 'Saving...'
                                    : isConfirming
                                    ? 'Confirm?'
                                    : 'Bought'}
                                </span>
                              </button>

                              {isConfirming && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-small"
                                  onClick={() => setConfirmingPurchaseId(null)}
                                  aria-label={`Cancel marking ${w.name} as purchased`}
                                  style={{ padding: '0 8px' }}
                                >
                                  <X
                                    size={14}
                                    strokeWidth={2.0}
                                    aria-hidden="true"
                                    focusable="false"
                                  />
                                </button>
                              )}

                              <DeleteButton
                                onDelete={() => deleteWantItem(w.id)}
                                ariaLabel={`Delete want ${w.name}`}
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

          {/* Purchased History */}
          {purchased.length > 0 && (
            <div className="card section">
              <div className="card-header">
                <h3>
                  <CheckCircle2
                    size={18}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    focusable="false"
                    style={{ color: 'var(--as-status-success)', flexShrink: 0 }}
                  />
                  <span>Purchased</span>
                </h3>
                <div className="card-header-actions">
                  <TableSearch
                    searchQuery={purchasedTable.searchQuery}
                    setSearchQuery={purchasedTable.setSearchQuery}
                    isOpen={purchasedTable.searchOpen}
                    setIsOpen={purchasedTable.setSearchOpen}
                  />
                </div>
              </div>

              {purchasedTable.data.length === 0 ? (
                <div className="empty-state">
                  <h3>No matching purchased items</h3>
                  <p>
                    No purchased items match &ldquo;{purchasedTable.searchQuery}&rdquo;. Clear the
                    search filter to view history.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => purchasedTable.setSearchQuery('')}
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
                          label="Item"
                          sortKey="name"
                          activeKey={purchasedTable.sortKey}
                          activeDirection={purchasedTable.sortDirection}
                          onClick={purchasedTable.requestSort}
                        />
                        <TableHeader
                          label="Cost"
                          sortKey="estimated_cost"
                          activeKey={purchasedTable.sortKey}
                          activeDirection={purchasedTable.sortDirection}
                          onClick={purchasedTable.requestSort}
                          style={{ textAlign: 'right' }}
                        />
                        <TableHeader
                          label="Purchased"
                          sortKey="purchased_at"
                          activeKey={purchasedTable.sortKey}
                          activeDirection={purchasedTable.sortDirection}
                          onClick={purchasedTable.requestSort}
                        />
                        <th scope="col" className="col-actions">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchasedTable.data.map((w) => {
                        const estCost = Number(w.estimated_cost);
                        return (
                          <tr key={w.id}>
                            <td style={{ fontWeight: 500, color: 'var(--as-text-primary)' }}>
                              {w.name}
                            </td>
                            <td
                              className="amount"
                              style={{
                                color:
                                  estCost < 0.005
                                    ? 'var(--as-text-tertiary)'
                                    : 'var(--as-text-primary)',
                                fontFamily: 'var(--as-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {fmt(estCost)}
                            </td>
                            <td className="cell-date">
                              {w.purchased_at?.substring(0, 10) || '—'}
                            </td>
                            <td className="col-actions">
                              <div className="row-actions-group">
                                <DeleteButton
                                  onDelete={() => deleteWantItem(w.id)}
                                  ariaLabel={`Delete purchased item ${w.name}`}
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
          )}
        </>
      )}

      {/* Add Want Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!submitting) {
              setShowModal(false);
              setFormError(null);
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-want-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-want-modal-title">Add Want</h3>
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
                <label htmlFor="want-name">Item Name</label>
                <input
                  id="want-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. OLED Monitor, Ergonomic Chair"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="want-cost">Estimated Cost</label>
                  <div className="input-unit-wrap">
                    <span className="input-unit-left" aria-hidden="true">
                      $
                    </span>
                    <input
                      id="want-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="has-unit-left"
                      value={form.estimated_cost}
                      onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="want-priority">Priority</label>
                  <select
                    id="want-priority"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as Want['priority'] })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="dream">Dream</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="want-url">URL (optional)</label>
                <input
                  id="want-url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="want-notes">Notes (optional)</label>
                <input
                  id="want-notes"
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Target sale price or spec notes"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
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
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
