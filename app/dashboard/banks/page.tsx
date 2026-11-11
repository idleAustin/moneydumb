import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  ChevronRight,
  Trash2,
  ClipboardCheck,
} from 'lucide-react';
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

  async function deleteBankAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteBank(id);
    redirect('/dashboard/banks');
  }

  const totalActual = banks.reduce((sum, b) => sum + Number(b.current_balance), 0);
  const totalPending = banks.reduce((sum, b) => sum + Number(b.pending_total), 0);
  const totalSafe = totalActual - totalPending;

  return (
    <div className="fade-in">
      <div
        className="page-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center' }}>
            <Landmark
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 8, color: 'var(--as-accent-primary)' }}
            />
            <span>Bank Liquidity</span>
          </h2>
          <p>Inspect per-account balances, pending obligations, and post-bill safe cash.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link
            href="/dashboard/audit"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ClipboardCheck size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Daily Audit</span>
          </Link>
          <Link
            href="/dashboard/this-month"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>This Month</span>
          </Link>
        </div>
      </div>

      <div className="card-grid-3 section">
        <div className={`stat-card ${totalActual < 0 ? 'stat-red' : 'stat-blue'}`}>
          <div className="stat-label">Total Balance</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              ...(totalActual < 0 ? { color: 'var(--as-status-error)' } : {}),
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

        <div className={`stat-card ${totalPending > 0 ? 'stat-amber' : 'stat-green'}`}>
          <div className="stat-label">Pending Obligations</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              ...(totalPending > 0 ? { color: 'var(--as-status-error)' } : {}),
            }}
          >
            {totalPending > 0 ? fmtCurrency(-totalPending) : fmtCurrency(0)}
          </div>
        </div>

        <div className={`stat-card ${totalSafe < 0 ? 'stat-red' : 'stat-green'}`}>
          <div className="stat-label">Safe to Spend</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              color: totalSafe < 0 ? 'var(--as-status-error)' : 'var(--as-status-success)',
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
              <input
                id="bank-balance"
                name="balance"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="submit" className="btn btn-primary">
              + Add Account
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
          <div className="scroll-table-wrapper">
            <div className="scroll-table-inner">
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
                    <th scope="col" style={{ width: 150, textAlign: 'right' }}>
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
                              actual < 0 ? 'var(--as-status-error)' : 'var(--as-text-primary)',
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
                              pending > 0 ? 'var(--as-status-error)' : 'var(--as-text-secondary)',
                          }}
                        >
                          {pending > 0 ? fmtCurrency(-pending) : '—'}
                        </td>
                        <td
                          className="amount"
                          style={{
                            fontFamily: 'var(--as-font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                            color:
                              safe < 0 ? 'var(--as-status-error)' : 'var(--as-status-success)',
                          }}
                        >
                          {fmtCurrency(safe)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 6,
                            }}
                          >
                            <Link
                              href={`/dashboard/banks/${bank.id}`}
                              className="btn btn-secondary btn-small"
                            >
                              Details
                            </Link>
                            <form action={deleteBankAction} style={{ display: 'inline' }}>
                              <input type="hidden" name="id" value={bank.id} />
                              <button
                                type="submit"
                                className="btn btn-danger btn-small"
                                aria-label={`Delete bank account ${bank.name}`}
                              >
                                <Trash2
                                  size={14}
                                  strokeWidth={2.0}
                                  aria-hidden="true"
                                  focusable="false"
                                />
                              </button>
                            </form>
                          </div>
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
    </div>
  );
}
