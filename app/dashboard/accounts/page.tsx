'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Landmark,
  PiggyBank,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import DeleteButton from '../components/DeleteButton';
import InlineEdit from '../components/InlineEdit';
import ExcelUpload from '../components/ExcelUpload';
import useTable from '../hooks/useTable';
import TableSearch from '../components/TableSearch';
import TableHeader from '../components/TableHeader';

const fmt = (n: number) => {
  const val = Object.is(n, -0) || Math.abs(n) < 0.00001 ? 0 : n;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const fmtDate = (d: string | null) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(d) ? d : `${d.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface Account {
  id: string;
  name: string;
  account_type: 'checking' | 'savings' | 'investment';
  balance: number;
  notes: string | null;
  balance_updated_at: string | null;
}

const ACCOUNT_TYPE_LABELS: Record<Account['account_type'], string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
};

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    account_type: Account['account_type'];
    balance: string;
    notes: string;
  }>({
    name: '',
    account_type: 'checking',
    balance: '',
    notes: '',
  });

  const load = useCallback(() => {
    return axios
      .get('/api/accounts')
      .then((r) => {
        setAccounts(Array.isArray(r.data) ? r.data : []);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load bank accounts. Check your connection and try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleRetry = () => {
    if (accounts.length === 0) setLoading(true);
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

  const {
    data: filteredAndSortedAccounts,
    sortKey,
    sortDirection,
    requestSort,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
  } = useTable<Account>(accounts, {
    searchKeys: ['name', 'account_type', 'notes'],
    defaultSort: { key: 'name', direction: 'asc' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await axios.post('/api/accounts', {
        ...form,
        balance: parseFloat(form.balance) || 0,
      });
      setForm({ name: '', account_type: 'checking', balance: '', notes: '' });
      setShowModal(false);
      await load();
    } catch (err) {
      console.error(err);
      setFormError('Could not create account. Please verify your entries and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateAccountItem = async (acct: Account, payload: Partial<Account>) => {
    setUpdatingId(acct.id);
    try {
      await axios.put(`/api/accounts/${acct.id}`, {
        name: acct.name,
        account_type: acct.account_type,
        balance: acct.balance,
        notes: acct.notes,
        ...payload,
      });
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not save account update. Please retry.');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAccountItem = async (id: string) => {
    try {
      await axios.delete(`/api/accounts/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError('Could not delete account. Please retry.');
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const checkingTotal = accounts
    .filter((a) => a.account_type === 'checking')
    .reduce((s, a) => s + Number(a.balance), 0);
  const savingsTotal = accounts
    .filter((a) => a.account_type !== 'checking')
    .reduce((s, a) => s + Number(a.balance), 0);

  const typeIcons: Record<string, React.ReactNode> = {
    checking: <Landmark size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />,
    savings: <PiggyBank size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />,
    investment: <TrendingUp size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />,
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Bank Accounts</h2>
        <p>Track checking, savings, and investment balances across your institutions.</p>
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
        <div aria-busy="true" aria-label="Loading bank accounts">
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
                  style={{ height: 28, width: '68%', marginBottom: 8 }}
                  aria-hidden="true"
                />
                <div
                  className="skeleton"
                  style={{ height: 12, width: '32%' }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header">
              <div className="skeleton" style={{ height: 18, width: 140 }} aria-hidden="true" />
              <div className="skeleton" style={{ height: 36, width: 130 }} aria-hidden="true" />
            </div>
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="skeleton"
                style={{ height: 44, width: '100%', marginBottom: 8 }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="card-grid-3 section">
            <div className={`stat-card ${totalBalance < 0 ? 'stat-red' : 'stat-green'}`}>
              <div className="stat-label">Total Balance</div>
              <div
                className="stat-value"
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  ...(totalBalance < 0 ? { color: 'var(--as-status-error)' } : {}),
                }}
              >
                {fmt(totalBalance)}
              </div>
              <div
                className="stat-sub"
                style={{
                  color: 'var(--as-text-secondary)',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>
            <div className="stat-card stat-blue">
              <div className="stat-label">Checking</div>
              <div
                className="stat-value"
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  ...(checkingTotal < 0 ? { color: 'var(--as-status-error)' } : {}),
                }}
              >
                {fmt(checkingTotal)}
              </div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-label">Savings &amp; Investments</div>
              <div
                className="stat-value"
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  ...(savingsTotal < 0 ? { color: 'var(--as-status-error)' } : {}),
                }}
              >
                {fmt(savingsTotal)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>All Accounts</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <ExcelUpload
                  templateName="accounts_template.xlsx"
                  templateColumns={[
                    { header: 'Name', example: 'Chase Checking' },
                    { header: 'Type', example: 'checking' },
                    { header: 'Balance', example: 1500.0 },
                    { header: 'Notes', example: 'Primary account' },
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
                      const acctType = String(r['Type'] || 'checking').trim().toLowerCase();
                      if (!['checking', 'savings', 'investment'].includes(acctType)) {
                        errors.push(`Row ${i + 2}: Invalid Type "${acctType}"`);
                        continue;
                      }
                      try {
                        await axios.post('/api/accounts', {
                          name,
                          account_type: acctType,
                          balance: parseFloat(String(r['Balance'])) || 0,
                          notes: r['Notes'] || null,
                        });
                        created++;
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message.replace(/\u0021/g, '.') : 'Import error';
                        errors.push(`Row ${i + 2}: ${msg}`);
                      }
                    }
                    return { created, errors };
                  }}
                  onComplete={() => {
                    void load();
                  }}
                />
                {accounts.length > 0 && (
                  <>
                    <TableSearch
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      isOpen={searchOpen}
                      setIsOpen={setSearchOpen}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setFormError(null);
                        setShowModal(true);
                      }}
                    >
                      + Add Account
                    </button>
                  </>
                )}
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Landmark
                    size={32}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    focusable="false"
                    style={{ color: 'var(--as-accent-primary)' }}
                  />
                </div>
                <h3>No accounts recorded yet</h3>
                <p>Add bank and investment accounts to monitor balances and post-bill liquidity.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setFormError(null);
                    setShowModal(true);
                  }}
                >
                  + Add Account
                </button>
              </div>
            ) : filteredAndSortedAccounts.length === 0 ? (
              <div className="empty-state">
                <h3>No matching accounts</h3>
                <p>
                  No accounts match &ldquo;{searchQuery}&rdquo;. Clear the search filter to view all
                  accounts.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSearchQuery('')}
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
                          label="Account"
                          sortKey="name"
                          activeKey={sortKey}
                          activeDirection={sortDirection}
                          onClick={requestSort}
                        />
                        <TableHeader
                          label="Type"
                          sortKey="account_type"
                          activeKey={sortKey}
                          activeDirection={sortDirection}
                          onClick={requestSort}
                        />
                        <TableHeader
                          label="Balance"
                          sortKey="balance"
                          activeKey={sortKey}
                          activeDirection={sortDirection}
                          onClick={requestSort}
                          style={{ textAlign: 'right' }}
                        />
                        <TableHeader
                          label="Last Updated"
                          sortKey="balance_updated_at"
                          activeKey={sortKey}
                          activeDirection={sortDirection}
                          onClick={requestSort}
                        />
                        <TableHeader
                          label="Notes"
                          sortKey="notes"
                          activeKey={sortKey}
                          activeDirection={sortDirection}
                          onClick={requestSort}
                        />
                        <th scope="col" style={{ width: 96, textAlign: 'right' }}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedAccounts.map((a) => {
                        const bal = Number(a.balance);
                        const badgeVariant =
                          a.account_type === 'checking'
                            ? 'blue'
                            : a.account_type === 'savings'
                            ? 'green'
                            : 'purple';
                        return (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 600 }}>
                              <span
                                style={{
                                  marginRight: 6,
                                  verticalAlign: 'middle',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: 'var(--as-text-secondary)',
                                }}
                              >
                                {typeIcons[a.account_type] || (
                                  <Landmark
                                    size={16}
                                    strokeWidth={2.0}
                                    aria-hidden="true"
                                    focusable="false"
                                  />
                                )}
                              </span>{' '}
                              <InlineEdit
                                value={a.name}
                                type="text"
                                format="raw"
                                ariaLabel={`Edit name for ${a.name}`}
                                onSave={async (val) => {
                                  await updateAccountItem(a, { name: String(val) });
                                }}
                              />
                            </td>
                            <td>
                              <select
                                aria-label={`Edit account type for ${a.name}`}
                                value={a.account_type}
                                disabled={updatingId === a.id}
                                onChange={(e) =>
                                  updateAccountItem(a, {
                                    account_type: e.target.value as Account['account_type'],
                                  })
                                }
                                className={`badge badge-${badgeVariant}`}
                                style={{
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '4px 10px',
                                  borderRadius: 'var(--as-radius-pill)',
                                  backgroundColor: 'var(--as-bg-elevated)',
                                  color:
                                    a.account_type === 'checking'
                                      ? 'var(--as-status-info)'
                                      : a.account_type === 'savings'
                                      ? 'var(--as-status-success)'
                                      : 'var(--as-text-primary)',
                                  border: '1px solid var(--as-border-subtle)',
                                  width: 'auto',
                                  height: 'auto',
                                  minHeight: 30,
                                }}
                              >
                                <option value="checking">{ACCOUNT_TYPE_LABELS.checking}</option>
                                <option value="savings">{ACCOUNT_TYPE_LABELS.savings}</option>
                                <option value="investment">{ACCOUNT_TYPE_LABELS.investment}</option>
                              </select>
                            </td>
                            <td
                              className="amount"
                              style={{
                                fontFamily: 'var(--as-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                ...(bal < 0 ? { color: 'var(--as-status-error)' } : {}),
                              }}
                            >
                              <InlineEdit
                                value={a.balance}
                                ariaLabel={`Edit balance for ${a.name}`}
                                onSave={async (val) => {
                                  await updateAccountItem(a, { balance: Number(val) });
                                }}
                              />
                            </td>
                            <td
                              style={{
                                color: 'var(--as-text-secondary)',
                                fontFamily: 'var(--as-font-mono)',
                                fontVariantNumeric: 'tabular-nums',
                                fontSize: '0.8125rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {fmtDate(a.balance_updated_at) || '—'}
                            </td>
                            <td style={{ color: 'var(--as-text-secondary)', fontSize: '0.85rem' }}>
                              <InlineEdit
                                value={a.notes || ''}
                                type="text"
                                format="raw"
                                ariaLabel={`Edit notes for ${a.name}`}
                                onSave={async (val) => {
                                  await updateAccountItem(a, { notes: String(val) || null });
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <DeleteButton
                                onDelete={() => deleteAccountItem(a.id)}
                                ariaLabel={`Delete account ${a.name}`}
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
        </>
      )}

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
            aria-labelledby="add-account-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-account-modal-title">Add Account</h3>
            {formError && (
              <p
                role="alert"
                style={{
                  color: 'var(--as-status-error)',
                  fontSize: '0.85rem',
                  marginBottom: 12,
                }}
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="account-name">Account Name</label>
                <input
                  id="account-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chase Checking"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="account-type">Type</label>
                  <select
                    id="account-type"
                    value={form.account_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        account_type: e.target.value as Account['account_type'],
                      })
                    }
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="account-balance">Current Balance</label>
                  <input
                    id="account-balance"
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="account-notes">Notes (optional)</label>
                <input
                  id="account-notes"
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this account"
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
                  {submitting ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
