'use client';

import { useState, useEffect } from 'react';
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
  Info,
  CircleDot,
  Circle,
  ArrowDownCircle,
  type LucideIcon,
} from 'lucide-react';

const priorityConfig: Record<string, { label: string; class: string; Icon: LucideIcon }> = {
  dream: { label: 'Dream', class: 'badge-purple', Icon: Sparkles },
  high: { label: 'High', class: 'badge-red', Icon: CircleDot },
  medium: { label: 'Medium', class: 'badge-amber', Icon: Circle },
  low: { label: 'Low', class: 'badge-green', Icon: ArrowDownCircle },
};

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

  const cleanText = rec
    .replace(/[\p{Extended_Pictographic}\u{10000}-\u{10FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[!]/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '12px' }}>
      <Icon
        size={16}
        strokeWidth={2.0}
        aria-hidden="true"
        focusable="false"
        style={{ color: iconColor, marginTop: '2px', flexShrink: 0 }}
      />
      <span style={{ color: 'var(--as-text-primary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
        {cleanText}
      </span>
    </div>
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);

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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    estimated_cost: '',
    priority: 'medium',
    notes: '',
    url: '',
  });
  const [analysis, setAnalysis] = useState<WantAnalysis | null>(null);

  const load = () => {
    axios
      .get('/api/wants')
      .then((r) => setWants(r.data))
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const unpurchased = wants.filter((w) => !w.purchased_at);
  const purchased = wants.filter((w) => w.purchased_at);

  // Wishlist table hook
  const wishlistTable = useTable<Want>(unpurchased, {
    searchKeys: ['name', 'priority', 'notes'],
    sortExtractors: {
      estimated_cost: (item) => item.estimated_cost,
      created_at: (item) => item.created_at,
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  // Purchased table hook
  const purchasedTable = useTable<Want>(purchased, {
    searchKeys: ['name'],
    sortExtractors: {
      estimated_cost: (item) => item.estimated_cost,
      purchased_at: (item) => item.purchased_at ?? '',
    },
    defaultSort: { key: 'purchased_at', direction: 'desc' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/wants', {
        ...form,
        estimated_cost: parseFloat(form.estimated_cost) || 0,
        url: form.url || null,
        notes: form.notes || null,
      });
      setForm({ name: '', estimated_cost: '', priority: 'medium', notes: '', url: '' });
      setShowModal(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyze = async (id: string) => {
    try {
      const a = await axios.get(`/api/wants/${id}/analyze`).then((r) => r.data);
      setAnalysis(a);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurchase = async (id: string) => {
    if (confirm('Mark as purchased?')) {
      try {
        await axios.put(`/api/wants/${id}/purchase`);
        load();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const deleteWantItem = async (id: string) => {
    try {
      await axios.delete(`/api/wants/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCost = unpurchased.reduce((s, w) => s + Number(w.estimated_cost), 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          <Sparkles
            size={20}
            strokeWidth={2.0}
            aria-hidden="true"
            focusable="false"
            style={{ marginRight: 8, color: 'var(--as-accent-primary)' }}
          />{' '}
          Wants Wishlist
        </h2>
        <p>Track things you want to buy and get financial feasibility analysis</p>
      </div>

      <div className="card-grid-3 section">
        <div className="stat-card stat-purple">
          <div className="stat-label">Wishlist Items</div>
          <div className="stat-value">{unpurchased.length}</div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">{fmt(totalCost)}</div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-label">Purchased</div>
          <div className="stat-value">{purchased.length}</div>
        </div>
      </div>

      {/* Analysis Result */}
      {analysis && (
        <div className="ai-summary section" style={{ borderColor: 'var(--as-border-strong)' }}>
          <h3
            style={{
              color: 'var(--as-status-success)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <BarChart3
              size={18}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 6 }}
            />{' '}
            Analysis: {analysis.want.name}
          </h3>
          <div
            className="card-grid-3"
            style={{ marginBottom: 16 }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>
                Monthly Discretionary
              </div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--as-status-success)',
                  fontFamily: 'var(--as-font-mono)',
                }}
              >
                {fmt(analysis.monthly_discretionary)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>% of Income</div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--as-status-warning)',
                  fontFamily: 'var(--as-font-mono)',
                }}
              >
                {analysis.cost_as_percent_of_income}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--as-text-muted)' }}>Months to Save</div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--as-status-info)',
                  fontFamily: 'var(--as-font-mono)',
                }}
              >
                {analysis.months_to_save}
              </div>
            </div>
          </div>
          {renderRecommendation(analysis.recommendation)}
          <p
            style={{
              color: 'var(--as-status-info)',
              display: 'flex',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Clock
              size={14}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 4 }}
            />{' '}
            {analysis.best_purchase_timing}
          </p>
          <button
            className="btn btn-secondary btn-small"
            style={{ marginTop: 12 }}
            onClick={() => setAnalysis(null)}
            aria-label="Dismiss feasibility analysis"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Wants List */}
      <div className="card section">
        <div className="card-header">
          <h3>Wishlist</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <TableSearch
              searchQuery={wishlistTable.searchQuery}
              setSearchQuery={wishlistTable.setSearchQuery}
              isOpen={wishlistTable.searchOpen}
              setIsOpen={wishlistTable.setSearchOpen}
            />
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              aria-label="Add want item to wishlist"
            >
              + Add Want
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
            <h3>Zero items on wishlist.</h3>
            <p>Track potential acquisitions and inspect discretionary feasibility telemetry.</p>
          </div>
        ) : (
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
                <th scope="col" style={{ width: 140 }}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {wishlistTable.data.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{w.name}</div>
                    {w.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--as-text-muted)' }}>
                        {w.notes}
                      </div>
                    )}
                    {w.url && (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--as-accent-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          marginTop: 4,
                        }}
                      >
                        <ExternalLink
                          size={12}
                          strokeWidth={2.0}
                          aria-hidden="true"
                          focusable="false"
                          style={{ marginRight: 4 }}
                        />{' '}
                        Link
                      </a>
                    )}
                  </td>
                  <td className="amount" style={{ color: 'var(--as-status-warning)' }}>
                    {fmt(w.estimated_cost)}
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
                  <td style={{ color: 'var(--as-text-muted)', fontSize: '0.85rem' }}>
                    {w.created_at?.substring(0, 10)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleAnalyze(w.id)}
                        aria-label={`Analyze feasibility for ${w.name}`}
                      >
                        Analyze
                      </button>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handlePurchase(w.id)}
                        style={{ display: 'flex', alignItems: 'center' }}
                        aria-label={`Mark ${w.name} as purchased`}
                      >
                        <Check
                          size={14}
                          strokeWidth={2.0}
                          aria-hidden="true"
                          focusable="false"
                          style={{ marginRight: 4 }}
                        />{' '}
                        Bought
                      </button>
                      <DeleteButton
                        onDelete={() => deleteWantItem(w.id)}
                        ariaLabel={`Delete want: ${w.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Purchased */}
      {purchased.length > 0 && (
        <div className="card section">
          <div
            className="card-header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <CheckCircle2
                size={18}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ marginRight: 6, color: 'var(--as-status-success)' }}
              />{' '}
              Purchased
            </h3>
            <TableSearch
              searchQuery={purchasedTable.searchQuery}
              setSearchQuery={purchasedTable.setSearchQuery}
              isOpen={purchasedTable.searchOpen}
              setIsOpen={purchasedTable.setSearchOpen}
            />
          </div>
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
              </tr>
            </thead>
            <tbody>
              {purchasedTable.data.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td className="amount">{fmt(w.estimated_cost)}</td>
                  <td style={{ color: 'var(--as-text-muted)' }}>{w.purchased_at?.substring(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Want</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MacBook Pro, PS5"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.estimated_cost}
                    onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="dream">Dream</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>URL (optional)</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  aria-label="Cancel want creation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  aria-label="Add want to wishlist"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
