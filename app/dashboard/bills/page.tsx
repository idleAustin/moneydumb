import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Receipt,
  Landmark,
  ClipboardCheck,
  Tags,
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { getAuthUserId } from '@/app/lib/auth';
import { getDashboardStats, type UpcomingBillItem } from '@/app/lib/actions';

const fmtCurrency = (n: number) => {
  const val = Object.is(n, -0) || Math.abs(n) < 0.00001 ? 0 : n;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default async function BillsPage() {
  const userId = await getAuthUserId();
  if (!userId) {
    redirect('/');
  }

  const stats = await getDashboardStats();
  const upcomingCount = stats.upcomingBills.filter((b) => b.daysUntil >= 0).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>
            <Receipt
              size={20}
              strokeWidth={2.0}
              aria-hidden="true"
              focusable="false"
              style={{ color: 'var(--as-accent-primary)', flexShrink: 0 }}
            />
            <span>Bills &amp; Obligations</span>
          </h2>
          <p>Monitor recurring monthly bills, pending obligations, and post-bill safe liquidity.</p>
        </div>

        <div className="page-header-actions">
          <Link href="/dashboard/audit" className="btn btn-secondary">
            <ClipboardCheck size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Daily Audit</span>
          </Link>
          <Link href="/dashboard/banks" className="btn btn-secondary">
            <Landmark size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            <span>Bank Liquidity</span>
          </Link>
          {stats.upcomingBills.length > 0 && (
            <Link href="/dashboard/expenses" className="btn btn-primary">
              <span>Manage Expenses</span>
            </Link>
          )}
        </div>
      </div>

      <div className="card-grid-3 section">
        <div
          className={`stat-card ${
            stats.totalAssets < -0.005
              ? 'stat-red'
              : Math.abs(stats.totalAssets) < 0.005
              ? 'stat-zero'
              : ''
          }`}
        >
          <div className="stat-label">Total Assets</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtCurrency(stats.totalAssets)}
          </div>
          <div
            className="stat-sub"
            style={{
              color: 'var(--as-text-secondary)',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stats.bankCount} {stats.bankCount === 1 ? 'account' : 'accounts'}
          </div>
        </div>

        <div className={`stat-card ${stats.pendingOut > 0.005 ? 'stat-amber' : 'stat-zero'}`}>
          <div className="stat-label">Pending Bills</div>
          <div
            className="stat-value"
            style={{
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stats.pendingOut > 0.005 ? fmtCurrency(-stats.pendingOut) : fmtCurrency(0)}
          </div>
          <div
            className="stat-sub"
            style={{
              color: 'var(--as-text-secondary)',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {upcomingCount} remaining this month
          </div>
        </div>

        <div
          className={`stat-card ${
            stats.safeBalance < -0.005
              ? 'stat-red'
              : stats.safeBalance > 0.005
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
            {fmtCurrency(stats.safeBalance)}
          </div>
          <div className="stat-sub" style={{ color: 'var(--as-text-secondary)' }}>
            Assets minus pending bills
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header">
          <h3>Recurring Bill Schedule</h3>
          <div className="card-header-actions">
            <Link href="/dashboard/types" className="btn btn-secondary btn-small">
              <Tags size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Expense Categories</span>
            </Link>
          </div>
        </div>

        {stats.upcomingBills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2
                size={32}
                strokeWidth={2.0}
                aria-hidden="true"
                focusable="false"
                style={{ color: 'var(--as-status-success)' }}
              />
            </div>
            <h3>No recurring bills scheduled</h3>
            <p>
              Add recurring monthly obligations in Expenses to track upcoming due dates against your
              account balances.
            </p>
            <Link href="/dashboard/expenses" className="btn btn-primary">
              <Plus size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Add Recurring Bill</span>
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Bill</th>
                  <th scope="col">Due Timing</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ textAlign: 'right' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.upcomingBills.map((exp: UpcomingBillItem) => {
                  const isPast = exp.daysUntil < 0;
                  const isSoon = exp.daysUntil >= 0 && exp.daysUntil <= 7;
                  const timingLabel =
                    exp.daysUntil < 0
                      ? `${Math.abs(exp.daysUntil)}d past due day`
                      : exp.daysUntil === 0
                      ? 'Due today'
                      : `In ${exp.daysUntil} ${exp.daysUntil === 1 ? 'day' : 'days'}`;

                  return (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 600 }}>{exp.name}</td>
                      <td
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: '0.8125rem',
                          color: isPast
                            ? 'var(--as-status-error)'
                            : isSoon
                            ? 'var(--as-status-warning)'
                            : 'var(--as-text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {timingLabel}
                      </td>
                      <td>
                        {isPast ? (
                          <span
                            className="badge badge-red"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <AlertCircle
                              size={12}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                            />
                            <span>Past Due Day</span>
                          </span>
                        ) : isSoon ? (
                          <span
                            className="badge badge-amber"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Clock
                              size={12}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                            />
                            <span>Due Soon</span>
                          </span>
                        ) : (
                          <span
                            className="badge badge-blue"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Calendar
                              size={12}
                              strokeWidth={2.0}
                              aria-hidden="true"
                              focusable="false"
                            />
                            <span>Scheduled</span>
                          </span>
                        )}
                      </td>
                      <td
                        className="amount"
                        style={{
                          fontFamily: 'var(--as-font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtCurrency(Number(exp.amount))}
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
