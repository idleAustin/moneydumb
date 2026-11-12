import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Plus,
} from 'lucide-react';
import DeleteButton from '@/app/dashboard/components/DeleteButton';
import { getAuthUserId } from '@/app/lib/auth';
import {
  getBanks,
  createBank,
  deleteBank,
  type BankAccount,
} from '@/app/lib/actions';

const fmtCurrency = (n: number) => {
  const val = Object.is(n, -0) || Math.abs(n) < 0.00001 ? 0 : n;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default async function ManageBanks() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect('/');
  }

  const banks = await getBanks();

  async function addBankAction(formData: FormData) {
    'use server';
    await createBank(formData);
    redirect('/dashboard/banks');
  }

  const totalActual = banks.reduce((sum, b) => sum + Number(b.current_balance), 0);
  const totalPending = banks.reduce((sum, b) => sum + Number(b.pending_total), 0);
  const totalSafe = totalActual - totalPending;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>
            <Landmark
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }}
            />
            <span>Bank Liquidity</span>
          </h2>
          <p>Inspect per-account balances, pending obligations, and post-bill safe cash.</p>
        </div>

        <div className="page-header-actions">
          <Link href="/dashboard/audit" className="btn btn-secondary">
            <ClipboardCheck size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Daily Audit</span>
          </Link>
          <Link href="/dashboard/this-month" className="btn btn-secondary">
            <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>This Month</span>
          </Link>
        </div>
      </div>

      <div className="card-grid-3 section">
        <div
          className={`stat-card ${
            totalActual < -0.005
              ? 'stat-red'
              : Math.abs(totalActual) < 0.005
              ? 'stat-zero'
              : ''
          }`}
        >
          <div className="stat-label">Total Balance</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtCurrency(totalActual)}
          </div>
          <div
            className="stat-sub"
            style={{
              color: 'var(--as-text-secondary)',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {banks.length} {banks.length === 1 ? 'account' : 'accounts'}
          </div>
        </div>

        <div className={`stat-card ${totalPending > 0.005 ? 'stat-amber' : 'stat-zero'}`}>
          <div className="stat-label">Pending Obligations</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalPending > 0.005 ? fmtCurrency(-totalPending) : fmtCurrency(0)}
          </div>
        </div>

        <div
          className={`stat-card ${
            totalSafe < -0.005
              ? 'stat-red'
              : totalSafe > 0.005
              ? 'stat-green'
              : 'stat-zero'
          }`}
        >
          <div className="stat-label">Safe to Spend</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtCurrency(totalSafe)}
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>Add Bank Account</h3>
        </div>
        <form action={addBankAction}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bank-name">Account Name</label>
              <input
                id="bank-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Chase Checking"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bank-balance">Initial Balance</label>
              <div className="input-unit-wrap">
                <span className="input-unit-left" aria-hidden="true">
                  $
                </span>
                <input
                  id="bank-balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  required
                  className="has-unit-left"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary">
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Add Account</span>
            </button>
          </div>
        </form>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>Accounts</h3>
          <span
            className="badge badge-blue"
            style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {banks.length} {banks.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        {banks.length === 0 ? (
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
            <h3>No bank accounts recorded</h3>
            <p>Use the form above to add a checking or savings account and monitor safe cash.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Account</th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Current Balance
                  </th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Pending
                  </th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Safe to Spend
                  </th>
                  <th scope="col" className="col-actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank: BankAccount) => {
                  const actual = Number(bank.current_balance);
                  const pending = Number(bank.pending_total);
                  const safe = actual - pending;

                  return (
                    <tr key={bank.id}>
                      <td>
                        <Link
                          href={`/dashboard/banks/${bank.id}`}
                          style={{
                            color: 'var(--as-text-primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            textDecoration: 'none',
                          }}
                        >
                          <Landmark
                            size={15}
                            strokeWidth={2.0}
                            aria-hidden="true"
                            focusable="false"
                            style={{ color: 'var(--as-text-secondary)', flexShrink: 0 }}
                          />
                          <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            {bank.name}
                          </span>
                          <ChevronRight
                            size={14}
                            strokeWidth={2.0}
                            aria-hidden="true"
                            focusable="false"
                            style={{ color: 'var(--as-text-secondary)', flexShrink: 0 }}
                          />
                        </Link>
                      </td>
                      <td
                        className="amount"
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          color:
                            actual < -0.005
                              ? 'var(--as-status-error)'
                              : Math.abs(actual) < 0.005
                              ? 'var(--as-text-tertiary)'
                              : 'var(--as-text-primary)',
                        }}
                      >
                        {fmtCurrency(actual)}
                      </td>
                      <td
                        className="amount"
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          color:
                            pending > 0.005
                              ? 'var(--as-status-warning)'
                              : 'var(--as-text-tertiary)',
                        }}
                      >
                        {pending > 0.005 ? fmtCurrency(-pending) : '—'}
                      </td>
                      <td
                        className="amount"
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color:
                            safe < -0.005
                              ? 'var(--as-status-error)'
                              : safe > 0.005
                              ? 'var(--as-status-success)'
                              : 'var(--as-text-tertiary)',
                        }}
                      >
                        {fmtCurrency(safe)}
                      </td>
                      <td className="col-actions">
                        <div className="row-actions-group">
                          <Link
                            href={`/dashboard/banks/${bank.id}`}
                            className="btn btn-secondary btn-small"
                          >
                            Details
                          </Link>
                          <DeleteButton
                            onDelete={deleteBank.bind(null, bank.id)}
                            ariaLabel={`Delete bank account ${bank.name}`}
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
    </div>
  );
}
