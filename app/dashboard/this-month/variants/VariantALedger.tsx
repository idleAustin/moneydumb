// Execute Bills Workspace: Top Execution Bar + 8-Column Account Matrix + Symmetrical Panel-Integrated Bills Matrix & Debts.
'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  CreditCard,
  EyeOff,
  Receipt,
  Search,
  X,
} from 'lucide-react';
import { fmtFull } from '../hooks/useSandboxMonth';
import TreasuryAndAccountStrip from '../components/TreasuryAndAccountStrip';
import {
  DueDisplayMode,
  FixedBillRow,
  DebtObligationRow,
} from '../components/MasterLedgerExtraOptions';

interface VariantAProps {
  state: ReturnType<typeof import('../hooks/useSandboxMonth').useSandboxMonth>;
  metrics: NonNullable<ReturnType<typeof import('../hooks/sandboxMetrics').computeSandboxMetrics>>;
}

export default function VariantALedger({
  state,
  metrics,
}: VariantAProps) {
  const [dueDisplayMode, setDueDisplayMode] = useState<DueDisplayMode>('date');
  const [focusPastDue, setFocusPastDue] = useState(false);
  const [hidePaid, setHidePaid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [debtSortBy, setDebtSortBy] = useState<'due' | 'apr' | 'balance'>('due');

  const {
    viewMonth,
    monthOffset,
    todayDay,
    unifiedObligations,
    toggleObligation,
    toggleCategoryObligations,
    handleSetDebtTier,
    saveObligationAmount,
    assignObligationAccount,
    setInspectedObligationId,
    setSelectedAccountFilter,
  } = state;

  const { accountsWithMetrics, filteredObligations } = metrics;

  const totalRawExpenses = unifiedObligations.filter((o) => o.type === 'expense').length;
  const totalRawDebts = unifiedObligations.filter((o) => o.type === 'debt').length;

  const allFixedBills = filteredObligations.filter((o) => o.type === 'expense');
  const allFilteredDebts = filteredObligations.filter((o) => o.type === 'debt');

  const overdueBills = allFixedBills.filter((o) => !o.isPaid && o.urgency === 'overdue');
  const overdueDebts = allFilteredDebts.filter((o) => !o.isPaid && o.urgency === 'overdue');

  const query = searchQuery.trim().toLowerCase();
  const visibleObligations = filteredObligations.filter((o) => {
    if (focusPastDue && (o.isPaid || o.urgency !== 'overdue')) return false;
    if (hidePaid && o.isPaid) return false;
    if (query && !o.name.toLowerCase().includes(query) && !o.category.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const fixedBills = visibleObligations.filter((o) => o.type === 'expense');
  const debtObligations = visibleObligations
    .filter((o) => o.type === 'debt')
    .sort((a, b) => {
      if (debtSortBy === 'apr') return (b.interestRate || 0) - (a.interestRate || 0);
      if (debtSortBy === 'balance') return (b.debtBalance || 0) - (a.debtBalance || 0);
      return a.dueDay - b.dueDay;
    });

  const billCategories = Array.from(new Set(allFixedBills.map((b) => b.category)));

  const visibleCategoryGroups = billCategories
    .filter((cat) => selectedCategory === 'ALL' || cat === selectedCategory)
    .map((cat) => ({
      cat,
      items: fixedBills.filter((b) => b.category === cat).sort((a, b) => a.dueDay - b.dueDay),
    }))
    .filter((g) => g.items.length > 0);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const allCollapsed =
    visibleCategoryGroups.length > 0 &&
    visibleCategoryGroups.every((g) => !!collapsedCategories[g.cat]);

  const toggleAllCategories = () => {
    const target = !allCollapsed;
    const next: Record<string, boolean> = {};
    billCategories.forEach((c) => {
      next[c] = target;
    });
    setCollapsedCategories(next);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setHidePaid(false);
    setFocusPastDue(false);
    setSelectedCategory('ALL');
    setSelectedAccountFilter(null);
  };

  const dueHeaderLabel = dueDisplayMode === 'date' ? 'DUE DATE' : 'DAYS DUE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1 & 2. Top Burn Bar + 8-Column Account Safe Balances Matrix */}
      <TreasuryAndAccountStrip state={state} metrics={metrics} />

      {/* 3. Symmetrical 50/50 2-Column Split (Left: Stepped Bills Financial Matrix | Right: Sticky Debts) */}
      <div className="tm-ledger-split">
        {/* Left Panel: Fixed Recurring Bills Grouped by Category */}
        <div className="tm-bills-panel">
          <div className="tm-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                <Receipt size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
                <span>
                  Bills ({allFixedBills.filter((b) => b.isPaid).length}/{allFixedBills.length})
                </span>
              </div>

              {overdueBills.length > 0 && (
                <div className="tooltip-wrapper">
                  <button
                    type="button"
                    onClick={() => setFocusPastDue((f) => !f)}
                    aria-pressed={focusPastDue}
                    aria-label={`Filter past-due bills (${overdueBills.length})`}
                    className={`tm-touch-btn tm-pastdue-chip ${focusPastDue ? 'tm-pastdue-chip-active' : ''}`}
                  >
                    <AlertTriangle size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    <span style={{ fontFamily: 'var(--as-font-mono)' }}>
                      {overdueBills.length} late ({fmtFull(overdueBills.reduce((s, o) => s + o.amount, 0))})
                    </span>
                    {focusPastDue && <X size={11} strokeWidth={2.2} aria-hidden="true" focusable="false" />}
                  </button>
                  <div className="tooltip-bubble" role="tooltip">
                    <span>Click to {focusPastDue ? 'show all obligations' : 'isolate past-due items'}</span>
                  </div>
                </div>
              )}

              {billCategories.length > 0 && (
                <select
                  className="tm-acct-select"
                  style={{ width: 'auto', maxWidth: 160 }}
                  value={selectedCategory}
                  aria-label="Filter fixed bills by category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories ({allFixedBills.length})</option>
                  {billCategories.map((cat) => {
                    const count = allFixedBills.filter((b) => b.category === cat).length;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div className="tm-search-box">
                <Search size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ position: 'absolute', left: 8, color: 'var(--as-text-tertiary)' }} />
                <input
                  type="text"
                  className="tm-search-input"
                  style={{ width: 145 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  aria-label="Filter bills and debts by name or category"
                />
              </div>

              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={() => setHidePaid((p) => !p)}
                  aria-pressed={hidePaid}
                  aria-label="Toggle hiding paid obligations"
                  className={`tm-touch-btn tm-cmd-btn ${hidePaid ? 'tm-cmd-btn-accent' : ''}`}
                  style={{ padding: '0 8px' }}
                >
                  <EyeOff size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                </button>
                <div className="tooltip-bubble" role="tooltip">
                  <span>{hidePaid ? 'Showing unpaid only' : 'Hide paid items'}</span>
                </div>
              </div>

              <div className="tooltip-wrapper">
                <button
                  type="button"
                  onClick={toggleAllCategories}
                  aria-label={allCollapsed ? 'Expand all expense categories' : 'Collapse all expense categories'}
                  className="tm-touch-btn tm-cmd-btn"
                  style={{ padding: '0 8px' }}
                >
                  {allCollapsed ? (
                    <ChevronsUpDown size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  ) : (
                    <ChevronsDownUp size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  )}
                </button>
                <div className="tooltip-bubble" role="tooltip">
                  <span>{allCollapsed ? 'Expand all categories' : 'Collapse all categories'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tm-bill-grid-header">
            <div style={{ textAlign: 'center' }}>PAID</div>
            <div>CATEGORY / EXPENSE</div>
            <div>{dueHeaderLabel}</div>
            <div>ACCOUNT</div>
            <div style={{ textAlign: 'right' }}>AMOUNT</div>
          </div>

          {totalRawExpenses === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <Receipt size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                No recurring fixed bills scheduled
              </div>
              <p style={{ margin: '4px auto 0', fontSize: '0.78rem', color: 'var(--as-text-secondary)', maxWidth: '42ch' }}>
                Add recurring monthly bills on the Expenses route to track due dates, bank routing, and payday checkoffs here.
              </p>
            </div>
          ) : visibleCategoryGroups.length === 0 ? (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                No fixed bills match the active filters
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--as-text-secondary)', maxWidth: '42ch' }}>
                Clear your search query, past-due filter, paid filter, or bank account filter to view all scheduled bills.
              </p>
              <button type="button" className="btn btn-secondary btn-small" onClick={resetAllFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            visibleCategoryGroups.map(({ cat, items: catItems }) => {
              const totalCat = catItems.reduce((s, o) => s + o.amount, 0);
              const allCatPaid = catItems.every((i) => i.isPaid);
              const isCollapsed = !!collapsedCategories[cat];

              return (
                <div key={cat}>
                  <div className="tm-bill-cat-row">
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => toggleCategoryObligations(catItems, cat)}
                        aria-pressed={allCatPaid}
                        aria-label={`Mark all bills in ${cat} as ${allCatPaid ? 'unpaid' : 'paid'}`}
                        className={`tm-toggle ${allCatPaid ? 'tm-toggle-on' : ''}`}
                      >
                        {allCatPaid && <Check size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="tm-touch-btn tm-bill-cat-label"
                      onClick={() => toggleCategoryCollapse(cat)}
                      aria-expanded={!isCollapsed}
                      aria-label={`Toggle ${cat} category group`}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, textAlign: 'left' }}
                    >
                      <ChevronDown size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', color: 'var(--as-text-tertiary)' }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>{cat}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        {catItems.filter((i) => i.isPaid).length}/{catItems.length}
                      </span>
                    </button>
                    <div
                      className="tm-bill-cat-amt"
                      style={{
                        fontFamily: 'var(--as-font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'right',
                        color: allCatPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)',
                        textDecoration: allCatPaid ? 'line-through' : 'none',
                      }}
                    >
                      {fmtFull(totalCat)}
                    </div>
                  </div>

                  {!isCollapsed &&
                    catItems.map((ob) => (
                      <FixedBillRow
                        key={`b-exp-${ob.id}`}
                        ob={ob}
                        dueDisplayMode={dueDisplayMode}
                        viewMonth={viewMonth}
                        monthOffset={monthOffset}
                        todayDay={todayDay}
                        accountsWithMetrics={accountsWithMetrics}
                        toggleObligation={toggleObligation}
                        saveObligationAmount={saveObligationAmount}
                        assignObligationAccount={assignObligationAccount}
                        setInspectedObligationId={setInspectedObligationId}
                      />
                    ))}
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel: Sticky Credit Cards & Debts */}
        <div className="tm-debts-panel">
          <div className="tm-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                <CreditCard size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-warning)' }} />
                <span>
                  Debts ({allFilteredDebts.filter((d) => d.isPaid).length}/{allFilteredDebts.length})
                </span>
              </div>

              {overdueDebts.length > 0 && (
                <div className="tooltip-wrapper">
                  <button
                    type="button"
                    onClick={() => setFocusPastDue((f) => !f)}
                    aria-pressed={focusPastDue}
                    aria-label={`Filter past-due debts (${overdueDebts.length})`}
                    className={`tm-touch-btn tm-pastdue-chip ${focusPastDue ? 'tm-pastdue-chip-active' : ''}`}
                  >
                    <AlertTriangle size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                    <span style={{ fontFamily: 'var(--as-font-mono)' }}>
                      {overdueDebts.length} late ({fmtFull(overdueDebts.reduce((s, o) => s + o.amount, 0))})
                    </span>
                    {focusPastDue && <X size={11} strokeWidth={2.2} aria-hidden="true" focusable="false" />}
                  </button>
                  <div className="tooltip-bubble" role="tooltip">
                    <span>Click to {focusPastDue ? 'show all obligations' : 'isolate past-due items'}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div
                role="group"
                aria-label="Toggle schedule column between calendar due date and days due"
                className="tm-seg"
              >
                <button
                  type="button"
                  className={`tm-touch-btn tm-seg-btn ${dueDisplayMode === 'date' ? 'tm-seg-btn-active' : ''}`}
                  onClick={() => setDueDisplayMode('date')}
                  aria-pressed={dueDisplayMode === 'date'}
                >
                  <Calendar size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span>Dates</span>
                </button>
                <button
                  type="button"
                  className={`tm-touch-btn tm-seg-btn ${dueDisplayMode === 'days' ? 'tm-seg-btn-active' : ''}`}
                  onClick={() => setDueDisplayMode('days')}
                  aria-pressed={dueDisplayMode === 'days'}
                >
                  <Clock size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                  <span>Days</span>
                </button>
              </div>

              <div role="group" aria-label="Sort debts" className="tm-seg">
                {([
                  { key: 'due', label: 'Due' },
                  { key: 'apr', label: 'APR' },
                  { key: 'balance', label: 'Bal' },
                ] as const).map((st) => {
                  const isActive = debtSortBy === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      className={`tm-touch-btn tm-seg-btn ${isActive ? 'tm-seg-btn-active' : ''}`}
                      onClick={() => setDebtSortBy(st.key)}
                      aria-pressed={isActive}
                      aria-label={`Sort debts by ${st.label}`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="tm-debt-grid-header">
            <div style={{ textAlign: 'center' }}>PAID</div>
            <div>CREDITOR / APR</div>
            <div>{dueHeaderLabel}</div>
            <div>ACCOUNT</div>
            <div style={{ textAlign: 'right' }}>AMOUNT / TIER</div>
          </div>

          {totalRawDebts === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center' }}>
              <CreditCard size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-text-tertiary)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                No active credit cards or debt obligations
              </div>
              <p style={{ margin: '4px auto 0', fontSize: '0.78rem', color: 'var(--as-text-secondary)', maxWidth: '38ch' }}>
                Add credit cards or installment loans on the Debts route to manage Snowball and Avalanche payment tiers here.
              </p>
            </div>
          ) : debtObligations.length === 0 ? (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                No debts match the active filters
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--as-text-secondary)', maxWidth: '38ch' }}>
                Clear your search query, past-due filter, paid filter, or bank account filter to view all debt obligations.
              </p>
              <button type="button" className="btn btn-secondary btn-small" onClick={resetAllFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            debtObligations.map((ob) => (
              <DebtObligationRow
                key={`debt-${ob.id}`}
                ob={ob}
                dueDisplayMode={dueDisplayMode}
                viewMonth={viewMonth}
                monthOffset={monthOffset}
                todayDay={todayDay}
                accountsWithMetrics={accountsWithMetrics}
                toggleObligation={toggleObligation}
                handleSetDebtTier={handleSetDebtTier}
                saveObligationAmount={saveObligationAmount}
                assignObligationAccount={assignObligationAccount}
                setInspectedObligationId={setInspectedObligationId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
