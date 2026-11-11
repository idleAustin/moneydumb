import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  ArrowDownLeft,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { getAuthUserId } from '@/app/lib/auth';
import {
  getBankById,
  getInbounds,
  updateBankBalance,
  createInbound,
  deleteInbound,
  type InboundTransaction,
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

const fmtIsoDate = (raw: unknown): string => {
  if (!raw) return '—';
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return '—';
    return raw.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return str;
};

export default async function BankDetail({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect('/');
  }

  const { id } = await params;
  const [bank, inbounds] = await Promise.all([getBankById(id), getInbounds(id)]);

  if (!bank) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/dashboard/banks"
            className="btn btn-secondary btn-small"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Back to Banks</span>
          </Link>
        </div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              <AlertCircle
                size={32}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-status-error)' }}
              />
            </div>
            <h3>Account not found</h3>
            <p>This bank account does not exist or has been removed from your profile.</p>
            <Link href="/dashboard/banks" className="btn btn-primary">
              Return to Bank Liquidity
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const actual = Number(bank.current_balance);
  const pending = Number(bank.pending_total);
  const safe = actual - pending;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 12 }}>
        <Link
          href="/dashboard/banks"
          className="btn btn-secondary btn-small"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          <span>Back to Banks</span>
        </Link>
      </div>

      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center' }}>
          <Landmark
            size={20}
            strokeWidth={2.0}
            aria-hidden="true"
            focusable="false"
            style={{ marginRight: 8, color: 'var(--as-accent-primary)' }}
          />
          <span>{bank.name}</span>
        </h2>
        <p>Reconcile current balance and schedule expected inbound deposits for this account.</p>
      </div>

      <div className="card-grid-3 section">
        <div className={`stat-card ${actual < 0 ? 'stat-red' : 'stat-blue'}`}>
          <div className="stat-label">Current Balance</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              ...(actual < 0 ? { color: 'var(--as-status-error)' } : {}),
            }}
          >
            {fmtCurrency(actual)}
          </div>
        </div>

        <div className={`stat-card ${pending > 0 ? 'stat-amber' : 'stat-green'}`}>
          <div className="stat-label">Pending Obligations</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              ...(pending > 0 ? { color: 'var(--as-status-error)' } : {}),
            }}
          >
            {pending > 0 ? fmtCurrency(-pending) : fmtCurrency(0)}
          </div>
        </div>

        <div className={`stat-card ${safe < 0 ? 'stat-red' : 'stat-green'}`}>
          <div className="stat-label">Safe Available</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              color: safe < 0 ? 'var(--as-status-error)' : 'var(--as-status-success)',
            }}
          >
            {fmtCurrency(safe)}
          </div>
        </div>
      </div>

      <div
        className="section"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 16,
        }}
      >
        {/* Update Current Balance */}
        <div className="card">
          <div className="card-header">
            <h3>Update Balance</h3>
          </div>
          <form action={updateBankBalance}>
            <input type="hidden" name="bankId" value={bank.id} />
            <div className="form-group">
              <label htmlFor="update-bank-balance">Actual Bank Balance</label>
              <input
                id="update-bank-balance"
                name="balance"
                type="number"
                step="0.01"
                required
                defaultValue={actual.toFixed(2)}
                style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-secondary">
                Update Balance
              </button>
            </div>
          </form>
        </div>

        {/* Add Inbound Deposit */}
        <div className="card">
          <div className="card-header">
            <h3>Log Inbound Deposit</h3>
          </div>
          <form action={createInbound}>
            <input type="hidden" name="bankId" value={bank.id} />
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inbound-date">Expected Date</label>
                <input id="inbound-date" name="date" type="date" required />
              </div>
              <div className="form-group">
                <label htmlFor="inbound-amount">Amount</label>
                <input
                  id="inbound-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="inbound-note">Note (max 20 characters)</label>
              <input
                id="inbound-note"
                name="note"
                type="text"
                maxLength={20}
                placeholder="e.g. Paycheck, Transfer"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" className="btn btn-primary">
                + Log Inbound
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inbound Transactions Table */}
      <div className="card section">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center' }}>
            <ArrowDownLeft
              size={17}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 6, color: 'var(--as-status-success)' }}
            />
            <span>Scheduled Inbound Deposits</span>
          </h3>
          <span
            className="badge badge-blue"
            style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
          >
            {inbounds.length}
          </span>
        </div>

        {inbounds.length === 0 ? (
          <div className="empty-state">
            <h3>No inbound deposits scheduled</h3>
            <p>Log expected paychecks or transfers above to track incoming funds for {bank.name}.</p>
          </div>
        ) : (
          <div className="scroll-table-wrapper">
            <div className="scroll-table-inner">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Note</th>
                    <th scope="col" style={{ textAlign: 'right' }}>
                      Amount
                    </th>
                    <th scope="col" style={{ width: 84, textAlign: 'right' }}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inbounds.map((inbound: InboundTransaction) => {
                    const amt = Number(inbound.amount);
                    const dateLabel = fmtIsoDate(inbound.date);
                    return (
                      <tr key={inbound.id}>
                        <td
                          style={{
                            fontFamily: 'var(--as-font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            color: 'var(--as-text-secondary)',
                            fontSize: '0.8125rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {dateLabel}
                        </td>
                        <td>{inbound.note || '—'}</td>
                        <td
                          className="amount"
                          style={{
                            fontFamily: 'var(--as-font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            fontWeight: 600,
                            color:
                              amt < 0 ? 'var(--as-status-error)' : 'var(--as-status-success)',
                          }}
                        >
                          {amt > 0 ? `+${fmtCurrency(amt)}` : fmtCurrency(amt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <form action={deleteInbound} style={{ display: 'inline' }}>
                            <input type="hidden" name="id" value={inbound.id} />
                            <input type="hidden" name="bankId" value={bank.id} />
                            <button
                              type="submit"
                              className="btn btn-danger btn-small"
                              aria-label={`Delete inbound deposit ${inbound.note || dateLabel}`}
                            >
                              <Trash2
                                size={14}
                                strokeWidth={2.0}
                                aria-hidden="true"
                                focusable="false"
                              />
                            </button>
                          </form>
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
