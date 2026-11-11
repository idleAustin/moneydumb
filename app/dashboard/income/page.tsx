'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DeleteButton from '../components/DeleteButton';
import InlineEdit from '../components/InlineEdit';
import ExcelUpload from '../components/ExcelUpload';
import useTable from '../hooks/useTable';
import TableSearch from '../components/TableSearch';
import TableHeader from '../components/TableHeader';
import {
  Wallet,
  Shuffle,
  Calendar,
  Sparkles,
  Plus,
  AlertTriangle,
} from 'lucide-react';

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

type IncomeFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'irregular';
type AllocationType = 'percent' | 'fixed';

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  semimonthly: 'Twice Monthly',
  monthly: 'Monthly',
  irregular: 'Irregular',
};

const SPLIT_TYPE_LABELS: Record<string, string> = {
  percent: 'Percent',
  fixed: 'Fixed',
};

interface IncomeSource {
  id: string;
  name: string;
  gross_amount: number;
  net_amount: number;
  frequency: IncomeFrequency;
  next_pay_date: string | null;
  notes: string | null;
}

interface IncomeAllocation {
  id: string;
  income_source_id: string;
  account_id: string;
  allocation_type: AllocationType;
  allocation_value: number;
}

interface IncomeEvent {
  id: string;
  income_source_id: string | null;
  account_id: string | null;
  amount: number;
  received_date: string;
  is_bonus: boolean;
  notes: string | null;
}

interface Account {
  id: string;
  name: string;
}

export default function Income() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [allocations, setAllocations] = useState<IncomeAllocation[]>([]);
  const [events, setEvents] = useState<IncomeEvent[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Paycheck Sources Table Hook
  const sourcesTable = useTable<IncomeSource>(sources, {
    searchKeys: [
      'name',
      'frequency',
      (item) => FREQUENCY_LABELS[item.frequency] || item.frequency,
      'next_pay_date',
      'notes',
    ],
    sortExtractors: {
      gross_amount: (item) => Number(item.gross_amount),
      net_amount: (item) => Number(item.net_amount),
      frequency: (item) => FREQUENCY_LABELS[item.frequency] || item.frequency,
      next_pay_date: (item) => item.next_pay_date || '',
    },
    defaultSort: { key: 'name', direction: 'asc' },
  });

  // Paycheck Allocations Table Hook
  const allocationsTable = useTable<IncomeAllocation>(allocations, {
    searchKeys: [
      (item) => sources.find((s) => s.id === item.income_source_id)?.name || '',
      (item) => accounts.find((ac) => ac.id === item.account_id)?.name || '',
      'allocation_type',
      (item) => SPLIT_TYPE_LABELS[item.allocation_type] || item.allocation_type,
    ],
    sortExtractors: {
      source: (item) => sources.find((s) => s.id === item.income_source_id)?.name || '',
      account: (item) => accounts.find((ac) => ac.id === item.account_id)?.name || '',
      allocation_type: (item) => SPLIT_TYPE_LABELS[item.allocation_type] || item.allocation_type,
      allocation_value: (item) => Number(item.allocation_value),
    },
    defaultSort: { key: 'source', direction: 'asc' },
  });

  // Income Events Table Hook
  const eventsTable = useTable<IncomeEvent>(events, {
    searchKeys: [
      'received_date',
      (item) => sources.find((s) => s.id === item.income_source_id)?.name || 'One-time',
      (item) => accounts.find((ac) => ac.id === item.account_id)?.name || '',
      'notes',
    ],
    sortExtractors: {
      source: (item) => sources.find((s) => s.id === item.income_source_id)?.name || 'One-time',
      account: (item) => accounts.find((ac) => ac.id === item.account_id)?.name || '',
      amount: (item) => Number(item.amount),
      received_date: (item) => item.received_date,
      is_bonus: (item) => (item.is_bonus ? 1 : 0),
      notes: (item) => item.notes || '',
    },
    defaultSort: { key: 'received_date', direction: 'desc' },
  });

  const [showSourceModal, setShowSourceModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [sourceForm, setSourceForm] = useState<{
    name: string;
    gross_amount: string;
    net_amount: string;
    frequency: IncomeFrequency;
    next_pay_date: string;
    notes: string;
  }>({
    name: '',
    gross_amount: '',
    net_amount: '',
    frequency: 'biweekly',
    next_pay_date: '',
    notes: '',
  });
  const [allocForm, setAllocForm] = useState<{
    income_source_id: string;
    account_id: string;
    allocation_type: AllocationType;
    allocation_value: string;
  }>({
    income_source_id: '',
    account_id: '',
    allocation_type: 'percent',
    allocation_value: '',
  });
  const [eventForm, setEventForm] = useState({
    income_source_id: '',
    account_id: '',
    amount: '',
    received_date: '',
    is_bonus: false,
    notes: '',
  });

  const load = useCallback(() => {
    return Promise.all([
      axios.get('/api/income/sources').then((r) => r.data),
      axios.get('/api/income/allocations').then((r) => r.data),
      axios.get('/api/income/events').then((r) => r.data),
      axios.get('/api/accounts').then((r) => r.data),
    ])
      .then(([s, a, e, acc]) => {
        setSources(s);
        setAllocations(a);
        setEvents(e);
        setAccounts(acc);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load income data. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showSourceModal && !showAllocModal && !showEventModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEventModal) setShowEventModal(false);
        else if (showAllocModal) setShowAllocModal(false);
        else if (showSourceModal) setShowSourceModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSourceModal, showAllocModal, showEventModal]);

  const handleSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/income/sources', {
        ...sourceForm,
        gross_amount: parseFloat(sourceForm.gross_amount) || 0,
        net_amount: parseFloat(sourceForm.net_amount) || 0,
        next_pay_date: sourceForm.next_pay_date || null,
        notes: sourceForm.notes || null,
      });
      setSourceForm({
        name: '',
        gross_amount: '',
        net_amount: '',
        frequency: 'biweekly',
        next_pay_date: '',
        notes: '',
      });
      setShowSourceModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to add income source. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateSourceItem = async (id: string, payload: Partial<IncomeSource>) => {
    setError(null);
    try {
      await axios.put(`/api/income/sources/${id}`, payload);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to update income source. Please try again.');
    }
  };

  const deleteSourceItem = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`/api/income/sources/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to delete income source. Please try again.');
    }
  };

  const handleAllocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const rawVal = parseFloat(allocForm.allocation_value) || 0;
    const clampedVal =
      allocForm.allocation_type === 'percent' ? Math.min(100, Math.max(0, rawVal)) : Math.max(0, rawVal);
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/income/allocations', {
        ...allocForm,
        allocation_value: clampedVal,
      });
      setAllocForm({
        income_source_id: '',
        account_id: '',
        allocation_type: 'percent',
        allocation_value: '',
      });
      setShowAllocModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to add allocation split. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAllocItem = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`/api/income/allocations/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to delete allocation split. Please try again.');
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/income/events', {
        ...eventForm,
        income_source_id: eventForm.income_source_id || null,
        account_id: eventForm.account_id || null,
        amount: Math.max(0, parseFloat(eventForm.amount) || 0),
        notes: eventForm.notes || null,
      });
      setEventForm({
        income_source_id: '',
        account_id: '',
        amount: '',
        received_date: '',
        is_bonus: false,
        notes: '',
      });
      setShowEventModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to log income event. Check the fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateEventItem = async (id: string, payload: Partial<IncomeEvent>) => {
    setError(null);
    try {
      await axios.put(`/api/income/events/${id}`, payload);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to update income event. Please try again.');
    }
  };

  const deleteEventItem = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`/api/income/events/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Unable to delete income event. Please try again.');
    }
  };

  const monthlyIncome = sources.reduce((s, src) => {
    const mult: Record<string, number> = {
      weekly: 4.33,
      biweekly: 2.167,
      semimonthly: 2,
      monthly: 1,
      irregular: 0,
    };
    return s + Number(src.net_amount) * (mult[src.frequency] ?? 1);
  }, 0);

  const canAddSplit = sources.length > 0 && accounts.length > 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Income</h2>
        <p>Configure recurring paychecks, account splits, and deposit history.</p>
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

      {/* Stats */}
      <div className="card-grid-3 section">
        <div className="stat-card">
          <div className="stat-label">Monthly Net Income</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 120, marginTop: 6 }} />
          ) : (
            <div className="stat-value tabular-nums">{fmt(monthlyIncome)}</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Income Sources</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 64, marginTop: 6 }} />
          ) : (
            <div className="stat-value tabular-nums">{sources.length}</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label">Bonus Events</div>
          {loading ? (
            <div className="skeleton" style={{ height: 28, width: 64, marginTop: 6 }} />
          ) : (
            <div className="stat-value tabular-nums">
              {events.filter((e) => e.is_bonus).length}
            </div>
          )}
        </div>
      </div>

      {/* Income Sources */}
      <div className="card section">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wallet
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-text-secondary)' }}
            />
            Paycheck Sources
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <ExcelUpload
              templateName="income_sources_template.xlsx"
              templateColumns={[
                { header: 'Name', example: 'Primary Job' },
                { header: 'Gross Pay', example: 3500.0 },
                { header: 'Net Pay', example: 2800.0 },
                { header: 'Frequency', example: 'biweekly' },
                { header: 'Next Pay Date', example: '2026-03-28' },
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
                  const gross = parseFloat(r['Gross Pay']);
                  const net = parseFloat(r['Net Pay']);
                  if (isNaN(gross) || isNaN(net)) {
                    errors.push(`Row ${i + 2}: Invalid Gross/Net Pay`);
                    continue;
                  }
                  const freq = String(r['Frequency'] || 'biweekly')
                    .trim()
                    .toLowerCase();
                  if (!['weekly', 'biweekly', 'semimonthly', 'monthly', 'irregular'].includes(freq)) {
                    errors.push(`Row ${i + 2}: Invalid Frequency "${freq}"`);
                    continue;
                  }
                  try {
                    await axios.post('/api/income/sources', {
                      name,
                      gross_amount: gross,
                      net_amount: net,
                      frequency: freq,
                      next_pay_date: r['Next Pay Date']
                        ? String(r['Next Pay Date']).trim()
                        : null,
                      notes: r['Notes'] || null,
                    });
                    created++;
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Import error';
                    errors.push(`Row ${i + 2}: ${msg}`);
                  }
                }
                return { created, errors };
              }}
              onComplete={load}
            />
            <TableSearch
              searchQuery={sourcesTable.searchQuery}
              setSearchQuery={sourcesTable.setSearchQuery}
              isOpen={sourcesTable.searchOpen}
              setIsOpen={sourcesTable.setSearchOpen}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSourceModal(true)}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Source
            </button>
          </div>
        </div>
        {loading ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
            aria-busy="true"
            aria-label="Loading paycheck sources"
          >
            <div className="skeleton" style={{ height: 38, width: '100%' }} />
            <div className="skeleton" style={{ height: 46, width: '100%' }} />
            <div className="skeleton" style={{ height: 46, width: '100%' }} />
          </div>
        ) : sources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Wallet size={32} strokeWidth={1.5} aria-hidden="true" focusable="false" />
            </div>
            <h3>No income sources configured</h3>
            <p>Register recurring paychecks to establish incoming cash-flow projections.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowSourceModal(true)}
              style={{ marginTop: 12 }}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Source
            </button>
          </div>
        ) : sourcesTable.data.length === 0 ? (
          <div className="empty-state">
            <h3>No matching income sources</h3>
            <p>No sources match &ldquo;{sourcesTable.searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => sourcesTable.setSearchQuery('')}
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
                      activeKey={sourcesTable.sortKey}
                      activeDirection={sourcesTable.sortDirection}
                      onClick={sourcesTable.requestSort}
                    />
                    <TableHeader
                      label="Gross"
                      sortKey="gross_amount"
                      activeKey={sourcesTable.sortKey}
                      activeDirection={sourcesTable.sortDirection}
                      onClick={sourcesTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Net"
                      sortKey="net_amount"
                      activeKey={sourcesTable.sortKey}
                      activeDirection={sourcesTable.sortDirection}
                      onClick={sourcesTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Frequency"
                      sortKey="frequency"
                      activeKey={sourcesTable.sortKey}
                      activeDirection={sourcesTable.sortDirection}
                      onClick={sourcesTable.requestSort}
                    />
                    <TableHeader
                      label="Next Pay Date"
                      sortKey="next_pay_date"
                      activeKey={sourcesTable.sortKey}
                      activeDirection={sourcesTable.sortDirection}
                      onClick={sourcesTable.requestSort}
                    />
                    <th scope="col" style={{ width: 100 }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sourcesTable.data.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>
                        <InlineEdit
                          value={s.name}
                          type="text"
                          format="raw"
                          onSave={async (v) => {
                            await updateSourceItem(s.id, { name: String(v) });
                          }}
                        />
                      </td>
                      <td className="amount">
                        <InlineEdit
                          value={s.gross_amount}
                          onSave={async (v) => {
                            await updateSourceItem(s.id, { gross_amount: Number(v) });
                          }}
                        />
                      </td>
                      <td className="amount">
                        <InlineEdit
                          value={s.net_amount}
                          onSave={async (v) => {
                            await updateSourceItem(s.id, { net_amount: Number(v) });
                          }}
                        />
                      </td>
                      <td>
                        <span className="badge badge-blue">
                          {FREQUENCY_LABELS[s.frequency] || s.frequency}
                        </span>
                      </td>
                      <td
                        className="tabular-nums"
                        style={{
                          color: 'var(--as-text-secondary)',
                          fontFamily: 'var(--as-font-mono)',
                        }}
                      >
                        {s.next_pay_date || '—'}
                      </td>
                      <td>
                        <DeleteButton
                          onDelete={() => deleteSourceItem(s.id)}
                          ariaLabel={`Delete income source ${s.name}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Allocations */}
      <div className="card section">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shuffle
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-text-secondary)' }}
            />
            Paycheck Allocations
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <TableSearch
              searchQuery={allocationsTable.searchQuery}
              setSearchQuery={allocationsTable.setSearchQuery}
              isOpen={allocationsTable.searchOpen}
              setIsOpen={allocationsTable.setSearchOpen}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setShowAllocModal(true)}
              disabled={!canAddSplit}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Add Split
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--as-text-secondary)', marginBottom: 16 }}>
          Define how each paycheck is split across your bank accounts.
        </p>
        {!loading && !canAddSplit && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--as-text-secondary)',
              background: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-sm)',
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            {sources.length === 0 && accounts.length === 0
              ? 'Add at least one paycheck source above and one bank account in Accounts before creating an allocation split.'
              : sources.length === 0
              ? 'Add at least one paycheck source above to enable allocation splits.'
              : 'Add at least one bank account in Accounts to enable allocation splits.'}
          </p>
        )}
        {loading ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
            aria-busy="true"
            aria-label="Loading paycheck allocations"
          >
            <div className="skeleton" style={{ height: 38, width: '100%' }} />
            <div className="skeleton" style={{ height: 44, width: '100%' }} />
          </div>
        ) : allocations.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <h3>No paycheck splits configured</h3>
            <p>Specify automated percentage or fixed-dollar splits across destination accounts.</p>
            {canAddSplit && (
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => setShowAllocModal(true)}
                style={{ marginTop: 12 }}
              >
                <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                Add Split
              </button>
            )}
          </div>
        ) : allocationsTable.data.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <h3>No matching allocations</h3>
            <p>No allocation splits match &ldquo;{allocationsTable.searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => allocationsTable.setSearchQuery('')}
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
                      label="Source"
                      sortKey="source"
                      activeKey={allocationsTable.sortKey}
                      activeDirection={allocationsTable.sortDirection}
                      onClick={allocationsTable.requestSort}
                    />
                    <TableHeader
                      label="Account"
                      sortKey="account"
                      activeKey={allocationsTable.sortKey}
                      activeDirection={allocationsTable.sortDirection}
                      onClick={allocationsTable.requestSort}
                    />
                    <TableHeader
                      label="Type"
                      sortKey="allocation_type"
                      activeKey={allocationsTable.sortKey}
                      activeDirection={allocationsTable.sortDirection}
                      onClick={allocationsTable.requestSort}
                    />
                    <TableHeader
                      label="Value"
                      sortKey="allocation_value"
                      activeKey={allocationsTable.sortKey}
                      activeDirection={allocationsTable.sortDirection}
                      onClick={allocationsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <th scope="col" style={{ width: 100 }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allocationsTable.data.map((a) => {
                    const sourceName =
                      sources.find((s) => s.id === a.income_source_id)?.name || 'Unknown source';
                    const accountName =
                      accounts.find((ac) => ac.id === a.account_id)?.name || 'Unknown account';
                    return (
                      <tr key={a.id}>
                        <td>{sourceName}</td>
                        <td>{accountName}</td>
                        <td>
                          <span className="badge badge-purple">
                            {SPLIT_TYPE_LABELS[a.allocation_type] || a.allocation_type}
                          </span>
                        </td>
                        <td className="amount">
                          {a.allocation_type === 'percent'
                            ? `${Number(a.allocation_value).toFixed(2)}%`
                            : fmt(a.allocation_value)}
                        </td>
                        <td>
                          <DeleteButton
                            onDelete={() => deleteAllocItem(a.id)}
                            ariaLabel={`Delete allocation split from ${sourceName} to ${accountName}`}
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

      {/* Income Events */}
      <div className="card section">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar
              size={16}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-text-secondary)' }}
            />
            Income Events
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <TableSearch
              searchQuery={eventsTable.searchQuery}
              setSearchQuery={eventsTable.setSearchQuery}
              isOpen={eventsTable.searchOpen}
              setIsOpen={eventsTable.setSearchOpen}
            />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setShowEventModal(true)}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Log Income
            </button>
          </div>
        </div>
        {loading ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}
            aria-busy="true"
            aria-label="Loading income events"
          >
            <div className="skeleton" style={{ height: 38, width: '100%' }} />
            <div className="skeleton" style={{ height: 46, width: '100%' }} />
            <div className="skeleton" style={{ height: 46, width: '100%' }} />
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <h3>No income events logged</h3>
            <p>Record received paychecks, bonuses, or one-time deposits in the ledger.</p>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => setShowEventModal(true)}
              style={{ marginTop: 12 }}
            >
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Log Income
            </button>
          </div>
        ) : eventsTable.data.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <h3>No matching income events</h3>
            <p>No logged events match &ldquo;{eventsTable.searchQuery}&rdquo;.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => eventsTable.setSearchQuery('')}
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
                      label="Date"
                      sortKey="received_date"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                    />
                    <TableHeader
                      label="Source"
                      sortKey="source"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                    />
                    <TableHeader
                      label="Amount"
                      sortKey="amount"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                      style={{ textAlign: 'right' }}
                    />
                    <TableHeader
                      label="Bank Account"
                      sortKey="account"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                    />
                    <TableHeader
                      label="Type"
                      sortKey="is_bonus"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                    />
                    <TableHeader
                      label="Notes"
                      sortKey="notes"
                      activeKey={eventsTable.sortKey}
                      activeDirection={eventsTable.sortDirection}
                      onClick={eventsTable.requestSort}
                    />
                    <th scope="col" style={{ width: 100 }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eventsTable.data.map((e) => {
                    const sourceLabel =
                      sources.find((s) => s.id === e.income_source_id)?.name || 'One-time';
                    return (
                      <tr key={e.id}>
                        <td
                          className="tabular-nums"
                          style={{
                            color: 'var(--as-text-secondary)',
                            fontFamily: 'var(--as-font-mono)',
                          }}
                        >
                          {e.received_date}
                        </td>
                        <td>{sourceLabel}</td>
                        <td className="amount" style={{ color: 'var(--as-status-success)' }}>
                          <InlineEdit
                            value={e.amount}
                            onSave={async (v) => {
                              await updateEventItem(e.id, { amount: Number(v) });
                            }}
                          />
                        </td>
                        <td>
                          <select
                            value={e.account_id || ''}
                            className="inline-table-select"
                            onChange={async (ev) => {
                              await updateEventItem(e.id, {
                                account_id: ev.target.value || null,
                              });
                            }}
                            aria-label={`Bank account for ${sourceLabel} income on ${e.received_date}`}
                          >
                            <option value="">Unassigned</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {e.is_bonus ? (
                            <span
                              className="badge badge-amber"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Sparkles
                                size={13}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                              Bonus
                            </span>
                          ) : (
                            <span className="badge badge-blue">Regular</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--as-text-secondary)', fontSize: '0.85rem' }}>
                          <InlineEdit
                            value={e.notes || ''}
                            type="text"
                            format="raw"
                            onSave={async (v) => {
                              await updateEventItem(e.id, { notes: String(v) || null });
                            }}
                          />
                        </td>
                        <td>
                          <DeleteButton
                            onDelete={() => deleteEventItem(e.id)}
                            ariaLabel={`Delete ${sourceLabel} income event on ${e.received_date}`}
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

      {/* Source Modal */}
      {showSourceModal && (
        <div className="modal-overlay" onClick={() => setShowSourceModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="source-modal-title">Add Income Source</h3>
            <form onSubmit={handleSourceSubmit}>
              <div className="form-group">
                <label htmlFor="source-name">Name</label>
                <input
                  id="source-name"
                  required
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  placeholder="e.g. Primary Job"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source-gross">Gross Pay</label>
                  <input
                    id="source-gross"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sourceForm.gross_amount}
                    onChange={(e) =>
                      setSourceForm({ ...sourceForm, gross_amount: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="source-net">Net Pay (Take Home)</label>
                  <input
                    id="source-net"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sourceForm.net_amount}
                    onChange={(e) => setSourceForm({ ...sourceForm, net_amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="source-frequency">Frequency</label>
                  <select
                    id="source-frequency"
                    value={sourceForm.frequency}
                    onChange={(e) =>
                      setSourceForm({
                        ...sourceForm,
                        frequency: e.target.value as IncomeFrequency,
                      })
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="semimonthly">Twice Monthly</option>
                    <option value="monthly">Monthly</option>
                    <option value="irregular">Irregular</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="source-next-pay-date">Next Pay Date</label>
                  <input
                    id="source-next-pay-date"
                    type="date"
                    value={sourceForm.next_pay_date}
                    onChange={(e) =>
                      setSourceForm({ ...sourceForm, next_pay_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="source-notes">Notes</label>
                <input
                  id="source-notes"
                  value={sourceForm.notes}
                  onChange={(e) => setSourceForm({ ...sourceForm, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSourceModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocModal && (
        <div className="modal-overlay" onClick={() => setShowAllocModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="alloc-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="alloc-modal-title">Add Allocation Split</h3>
            <form onSubmit={handleAllocSubmit}>
              <div className="form-group">
                <label htmlFor="alloc-source">Income Source</label>
                <select
                  id="alloc-source"
                  required
                  value={allocForm.income_source_id}
                  onChange={(e) =>
                    setAllocForm({ ...allocForm, income_source_id: e.target.value })
                  }
                >
                  <option value="">Select source...</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="alloc-account">Bank Account</label>
                <select
                  id="alloc-account"
                  required
                  value={allocForm.account_id}
                  onChange={(e) => setAllocForm({ ...allocForm, account_id: e.target.value })}
                >
                  <option value="">Select account...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="alloc-type">Type</label>
                  <select
                    id="alloc-type"
                    value={allocForm.allocation_type}
                    onChange={(e) =>
                      setAllocForm({
                        ...allocForm,
                        allocation_type: e.target.value as AllocationType,
                      })
                    }
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="alloc-value">
                    {allocForm.allocation_type === 'percent' ? 'Percent (0–100)' : 'Fixed Amount'}
                  </label>
                  <input
                    id="alloc-value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={allocForm.allocation_type === 'percent' ? '100' : undefined}
                    required
                    value={allocForm.allocation_value}
                    onChange={(e) =>
                      setAllocForm({ ...allocForm, allocation_value: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAllocModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="event-modal-title">Log Income Event</h3>
            <form onSubmit={handleEventSubmit}>
              <div className="form-group">
                <label htmlFor="event-source">Source (optional)</label>
                <select
                  id="event-source"
                  value={eventForm.income_source_id}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, income_source_id: e.target.value })
                  }
                >
                  <option value="">None (one-time)</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-amount">Amount</label>
                  <input
                    id="event-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={eventForm.amount}
                    onChange={(e) => setEventForm({ ...eventForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="event-date">Date Received</label>
                  <input
                    id="event-date"
                    type="date"
                    required
                    value={eventForm.received_date}
                    onChange={(e) => setEventForm({ ...eventForm, received_date: e.target.value })}
                  />
                </div>
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
                  id="isBonus"
                  checked={eventForm.is_bonus}
                  onChange={(e) => setEventForm({ ...eventForm, is_bonus: e.target.checked })}
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
                  htmlFor="isBonus"
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
                  Bonus or irregular income
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="event-account">Bank Account (optional)</label>
                <select
                  id="event-account"
                  value={eventForm.account_id}
                  onChange={(e) => setEventForm({ ...eventForm, account_id: e.target.value })}
                >
                  <option value="">None</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="event-notes">Notes</label>
                <input
                  id="event-notes"
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Log Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
