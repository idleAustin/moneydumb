import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  ArrowLeft,
  Landmark,
  Plus,
} from 'lucide-react';
import { getAuthUserId } from '@/app/lib/auth';
import {
  getBanks,
  updateAllBalances,
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

export default async function DailyAudit() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect('/');
  }

  const banks = await getBanks();

  async function saveAllAction(formData: FormData) {
    'use server';
    await updateAllBalances(formData);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>
            <ClipboardCheck
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }}
            />
            <span>Daily Balance Audit</span>
          </h2>
          <p>Enter actual balances from your banking apps to reconcile safe-to-spend cash.</p>
        </div>

        <div className="page-header-actions">
          <Link href="/dashboard/this-month" className="btn btn-secondary">
            <ArrowLeft size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Back to This Month</span>
          </Link>
        </div>
      </div>

      <div className="card section" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <h3>Reconcile Account Actuals</h3>
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
            <h3>No accounts to reconcile</h3>
            <p>Add at least one checking or savings account before running a balance audit.</p>
            <Link href="/dashboard/accounts" className="btn btn-primary">
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Add Account</span>
            </Link>
          </div>
        ) : (
          <form action={saveAllAction}>
            <div>
              {banks.map((bank: BankAccount) => {
                const current = Number(bank.current_balance);
                return (
                  <div
                    key={bank.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 0',
                      borderBottom: '1px solid var(--as-border-subtle)',
                    }}
                  >
                    <div style={{ minWidth: 180, flex: '1 1 200px' }}>
                      <label
                        htmlFor={`balance_${bank.id}`}
                        style={{
                          display: 'block',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--as-text-primary)',
                          marginBottom: 4,
                          letterSpacing: '0',
                          textTransform: 'none',
                        }}
                      >
                        {bank.name}
                      </label>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--as-text-secondary)',
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        Recorded:{' '}
                        <span
                          style={{
                            color:
                              current < -0.005
                                ? 'var(--as-status-error)'
                                : 'var(--as-text-secondary)',
                          }}
                        >
                          {fmtCurrency(current)}
                        </span>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0, width: 220 }}>
                      <div className="input-unit-wrap">
                        <span className="input-unit-left" aria-hidden="true">
                          $
                        </span>
                        <input
                          id={`balance_${bank.id}`}
                          name={`balance_${bank.id}`}
                          type="number"
                          step="0.01"
                          required
                          className="has-unit-left"
                          defaultValue={current.toFixed(2)}
                          style={{
                            fontFamily: 'var(--as-font-mono)',
                            fontVariantNumeric: 'tabular-nums',
                            textAlign: 'right',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 20,
              }}
            >
              <Link href="/dashboard/this-month" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary">
                Save Reconciled Balances
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
