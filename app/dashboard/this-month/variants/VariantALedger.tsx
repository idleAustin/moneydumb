// Locked-in Execute Bills Workspace: Top Execution Bar + 8-Column Account Matrix + Side-by-Side Category Bills & Sticky Debts.
'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Receipt,
  CreditCard,
  Search,
  EyeOff,
  Check,
} from 'lucide-react';
import { fmtFull } from '../hooks/useSandboxMonth';
import TreasuryAndAccountStrip from '../components/TreasuryAndAccountStrip';
import {
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
  const [hidePaid, setHidePaid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string>('ALL');
  const [debtSortBy, setDebtSortBy] = useState<'due' | 'apr' | 'balance'>('due');

  const {
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

  const query = searchQuery.trim().toLowerCase();
  const visibleObligations = filteredObligations.filter((o) => {
    if (hidePaid && o.isPaid) return false;
    if (query && !o.name.toLowerCase().includes(query) && !o.category.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const totalRawExpenses = unifiedObligations.filter((o) => o.type === 'expense').length;
  const totalRawDebts = unifiedObligations.filter((o) => o.type === 'debt').length;

  const allFixedBills = filteredObligations.filter((o) => o.type === 'expense');
  const allFilteredDebts = filteredObligations.filter((o) => o.type === 'debt');
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
    .filter((cat) => selectedCategoryChip === 'ALL' || cat === selectedCategoryChip)
    .map((cat) => ({
      cat,
      items: fixedBills.filter((b) => b.category === cat).sort((a, b) => a.dueDay - b.dueDay),
    }))
    .filter((g) => g.items.length > 0);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const setAllCategoriesCollapsed = (collapsed: boolean) => {
    const next: Record<string, boolean> = {};
    billCategories.forEach((c) => {
      next[c] = collapsed;
    });
    setCollapsedCategories(next);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setHidePaid(false);
    setSelectedCategoryChip('ALL');
    setSelectedAccountFilter(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1 & 2. Locked-in Top Bar (Option A) + Locked-in Account Matrix (Option C) */}
      <TreasuryAndAccountStrip state={state} metrics={metrics} />

      {/* 3. Master High-Density Command Bar (Search, Hide Paid, Expand/Collapse, Category Filter Pills) */}
      <div
        style={{
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, fontVariantNumeric: 'tabular-nums' }}>
            <Receipt size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
            <span>
              Fixed Bills ({allFixedBills.filter((b) => b.isPaid).length}/{allFixedBills.length} paid) &amp; Credit Cards / Debts ({allFilteredDebts.filter((o) => o.isPaid).length}/{allFilteredDebts.length} paid)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div className="tm-search-box">
              <Search size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ position: 'absolute', left: 8, color: 'var(--as-text-tertiary)' }} />
              <input
                type="text"
                className="tm-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter bills & debts..."
                aria-label="Filter bills and debts by name or category"
              />
            </div>

            <button
              type="button"
              className="tm-touch-btn"
              onClick={() => setHidePaid((p) => !p)}
              aria-pressed={hidePaid}
              aria-label="Toggle hiding paid obligations"
              style={{
                background: hidePaid ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                border: hidePaid ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                color: hidePaid ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                minHeight: 30,
                padding: '0 10px',
                borderRadius: 'var(--as-radius-sm)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <EyeOff size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>{hidePaid ? 'Showing Unpaid Only' : 'Hide Paid'}</span>
            </button>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className="tm-touch-btn"
                onClick={() => setAllCategoriesCollapsed(false)}
                aria-label="Expand all expense categories"
                style={{
                  background: 'var(--as-bg-elevated)',
                  border: '1px solid var(--as-border-subtle)',
                  color: 'var(--as-text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  minHeight: 30,
                  padding: '0 10px',
                  borderRadius: 'var(--as-radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Expand All
              </button>
              <button
                type="button"
                className="tm-touch-btn"
                onClick={() => setAllCategoriesCollapsed(true)}
                aria-label="Collapse all expense categories"
                style={{
                  background: 'var(--as-bg-elevated)',
                  border: '1px solid var(--as-border-subtle)',
                  color: 'var(--as-text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  minHeight: 30,
                  padding: '0 10px',
                  borderRadius: 'var(--as-radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="tm-category-pills" role="group" aria-label="Filter fixed bills by category">
          <button
            type="button"
            onClick={() => setSelectedCategoryChip('ALL')}
            aria-pressed={selectedCategoryChip === 'ALL'}
            aria-label="Show all expense categories"
            style={{
              minHeight: 28,
              padding: '0 10px',
              borderRadius: 'var(--as-radius-pill)',
              border: selectedCategoryChip === 'ALL' ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
              background: selectedCategoryChip === 'ALL' ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
              color: selectedCategoryChip === 'ALL' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            All Bills ({fixedBills.length} • {fmtFull(fixedBills.reduce((s, b) => s + b.amount, 0))})
          </button>
          {billCategories.map((cat) => {
            const catItems = allFixedBills.filter((b) => b.category === cat);
            const catSum = catItems.reduce((s, b) => s + b.amount, 0);
            const paidInCat = catItems.filter((b) => b.isPaid).length;
            const isActive = selectedCategoryChip === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategoryChip(isActive ? 'ALL' : cat)}
                aria-pressed={isActive}
                aria-label={`Filter fixed bills by ${cat}`}
                style={{
                  minHeight: 28,
                  padding: '0 10px',
                  borderRadius: 'var(--as-radius-pill)',
                  border: isActive ? '1px solid var(--as-accent-primary)' : '1px solid var(--as-border-subtle)',
                  background: isActive ? 'var(--as-accent-muted)' : 'var(--as-bg-elevated)',
                  color: isActive ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 600,
                  fontVariantNumeric: 'tabular-nums',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {cat} {paidInCat}/{catItems.length} ({fmtFull(catSum)})
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Locked-In Side-by-Side 2-Column Split (Left: Category-Grouped Fixed Bills | Right: Sticky Credit Cards & Debts) */}
      <div className="tm-ledger-split">
        {/* Left Column: Fixed Recurring Bills Grouped by Category */}
        <div style={{ background: 'var(--as-bg-surface)', border: '1px solid var(--as-border-subtle)', borderRadius: 'var(--as-radius-lg)', overflow: 'hidden' }}>
          <div className="tm-bill-grid-header">
            <div style={{ textAlign: 'center' }}>PAID</div>
            <div>CATEGORY / EXPENSE</div>
            <div>DUE</div>
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
                Clear your search query, paid filter, or bank account filter to view all scheduled bills.
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
                      className="tm-touch-btn"
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
                    <div className="tm-bill-cat-spacer" />
                    <div className="tm-bill-cat-spacer" />
                    <div style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem', fontWeight: 700, textAlign: 'right', color: allCatPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)', textDecoration: allCatPaid ? 'line-through' : 'none' }}>
                      {fmtFull(totalCat)}
                    </div>
                  </div>

                  {!isCollapsed &&
                    catItems.map((ob) => (
                      <FixedBillRow
                        key={`b-exp-${ob.id}`}
                        ob={ob}
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

        {/* Right Column: Sticky Credit Cards & Debts */}
        <div className="tm-debts-panel">
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--as-bg-elevated)',
              borderBottom: '1px solid var(--as-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              <CreditCard size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-warning)' }} />
              <span>
                Debts ({debtObligations.filter((d) => d.isPaid).length}/{debtObligations.length} paid)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                role="group"
                aria-label="Sort debts"
                style={{ display: 'flex', background: 'var(--as-bg-base)', border: '1px solid var(--as-border-subtle)', borderRadius: 'var(--as-radius-sm)', padding: 2, gap: 2 }}
              >
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
                      className="tm-touch-btn"
                      onClick={() => setDebtSortBy(st.key)}
                      aria-pressed={isActive}
                      aria-label={`Sort debts by ${st.label}`}
                      style={{
                        background: isActive ? 'var(--as-bg-overlay)' : 'transparent',
                        color: isActive ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
                        border: 'none',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--as-radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
              <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: '0.78rem', fontWeight: 700, color: debtObligations.reduce((s, d) => s + d.amount, 0) > 0.005 ? 'var(--as-status-warning)' : 'var(--as-text-tertiary)' }}>
                {fmtFull(debtObligations.reduce((s, d) => s + d.amount, 0))}
              </span>
            </div>
          </div>

          <div className="tm-debt-grid-header">
            <div style={{ textAlign: 'center' }}>PAID</div>
            <div>CREDITOR / APR</div>
            <div>DUE</div>
            <div>ACCOUNT</div>
            <div style={{ textAlign: 'right' }}>STRATEGY TIER &amp; AMOUNT</div>
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
                Clear your search query, paid filter, or bank account filter to view all debt obligations.
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
