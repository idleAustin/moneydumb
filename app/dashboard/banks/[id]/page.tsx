import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  ArrowLeft,
  ArrowDownLeft,
  AlertCircle,
  Plus,
} from 'lucide-react';
import DeleteButton from '@/app/dashboard/components/DeleteButton';
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
              <span>Bank Account</span>
            </h2>
            <p>Reconcile current balance and schedule expected inbound deposits for this account.</p>
          </div>

          <div className="page-header-actions">
            <Link href="/dashboard/banks" className="btn btn-secondary">
              <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Back to Banks</span>
            </Link>
          </div>
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
            <span>{bank.name}</span>
          </h2>
          <p>Reconcile current balance and schedule expected inbound deposits for this account.</p>
        </div>

        <div className="page-header-actions">
          <Link href="/dashboard/banks" className="btn btn-secondary">
            <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Back to Banks</span>
          </Link>
        </div>
      </div>

      <div className="card-grid-3 section">
        <div
          className={`stat-card ${
            actual < -0.005
              ? 'stat-red'
              : Math.abs(actual) < 0.005
              ? 'stat-zero'
              : ''
          }`}
        >
          <div className="stat-label">Current Balance</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtCurrency(actual)}
          </div>
        </div>

        <div className={`stat-card ${pending > 0.005 ? 'stat-amber' : 'stat-zero'}`}>
          <div className="stat-label">Pending Obligations</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pending > 0.005 ? fmtCurrency(-pending) : fmtCurrency(0)}
          </div>
        </div>

        <div
          className={`stat-card ${
            safe < -0.005
              ? 'stat-red'
              : safe > 0.005
              ? 'stat-green'
              : 'stat-zero'
          }`}
        >
          <div className="stat-label">Safe Available</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtCurrency(safe)}
          </div>
        </div>
      </div>

      <div className="card-grid-2 section">
        {/* Update Current Balance */}
        <div className="card">
          <div className="card-header">
            <h3>Update Balance</h3>
          </div>
          <form action={updateBankBalance}>
            <input type="hidden" name="bankId" value={bank.id} />
            <div className="form-group">
              <label htmlFor="update-bank-balance">Actual Bank Balance</label>
              <div className="input-unit-wrap">
                <span className="input-unit-left" aria-hidden="true">
                  $
                </span>
                <input
                  id="update-bank-balance"
                  name="balance"
                  type="number"
                  step="0.01"
                  required
                  className="has-unit-left"
                  defaultValue={actual.toFixed(2)}
                  style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
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
                <div className="input-unit-wrap">
                  <span className="input-unit-left" aria-hidden="true">
                    $
                  </span>
                  <input
                    id="inbound-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    className="has-unit-left"
                    placeholder="0.00"
                  />
                </div>
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
                <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                <span>Log Inbound</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inbound Transactions Table */}
      <div className="card section">
        <div className="card-header">
          <h3>
            <ArrowDownLeft
              size={17}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-status-success)', flexShrink: 0 }}
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
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Note</th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Amount
                  </th>
                  <th scope="col" className="col-actions">
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
                      <td className="cell-date">{dateLabel}</td>
                      <td>{inbound.note || '—'}</td>
                      <td
                        className="amount"
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color:
                            amt < -0.005
                              ? 'var(--as-status-error)'
                              : amt > 0.005
                              ? 'var(--as-status-success)'
                              : 'var(--as-text-tertiary)',
                        }}
                      >
                        {amt > 0.005 ? `+${fmtCurrency(amt)}` : fmtCurrency(amt)}
                      </td>
                      <td className="col-actions">
                        <div className="row-actions-group">
                          <DeleteButton
                            onDelete={deleteInbound.bind(null, inbound.id, bank.id)}
                            ariaLabel={`Delete inbound deposit ${inbound.note || dateLabel}`}
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
