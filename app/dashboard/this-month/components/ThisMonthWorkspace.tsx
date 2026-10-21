// Shared This Month operational workspace orchestrator for /dashboard/this-month and /dashboard/prototype.
'use client';

import {
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Snowflake,
  Mountain,
  CheckCircle2,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { useSandboxMonth, MONTH_NAMES, fmt } from '../hooks/useSandboxMonth';
import { computeSandboxMetrics } from '../hooks/sandboxMetrics';
import VariantALedger from '../variants/VariantALedger';
import ForecastAndFlowDeck from './ForecastAndFlowDeck';
import ObligationDrawer from './ObligationDrawer';
import PrototypeSwitcher from '../../components/PrototypeSwitcher';

interface ThisMonthWorkspaceProps {
  defaultMemoryOnly?: boolean;
}

export default function ThisMonthWorkspace({ defaultMemoryOnly = false }: ThisMonthWorkspaceProps) {
  const state = useSandboxMonth(defaultMemoryOnly);
  const metrics = computeSandboxMetrics(state);

  const {
    data,
    loading,
    viewMonth,
    viewYear,
    setViewMonth,
    setViewYear,
    isCurrentMonth,
    memoryOnly,
    setMemoryOnly,
    applyBenchmarkState,
    committedPlan,
    unifiedObligations,
    toggleObligation,
    saveObligationAmount,
    assignObligationAccount,
    handleSetDebtTier,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    inspectedObligationId,
    setInspectedObligationId,
    toastMsg,
  } = state;

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setViewMonth(now.getMonth() + 1);
    setViewYear(now.getFullYear());
  };

  if (loading) {
    return (
      <div className="empty-state fade-in">
        <div className="empty-icon">
          <Loader2 className="animate-spin" size={24} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </div>
        <h3>Loading sandbox workspace.</h3>
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <AlertTriangle size={24} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </div>
        <h3>Sandbox data unavailable.</h3>
        <p>Verify the local database connection or load demo data.</p>
      </div>
    );
  }

  const inspectedObligation =
    unifiedObligations.find((o) => o.id === inspectedObligationId) || null;

  return (
    <div className="fade-in" style={{ paddingBottom: 72 }}>
      {/* Top Operational Header */}
      <div className="page-header tm-workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-small"
            onClick={goToPrevMonth}
            aria-label="Navigate to previous month"
          >
            <ChevronLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: '1.35rem' }}>
            <Calendar size={19} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 8, color: 'var(--as-accent-primary)' }} />
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h2>
          <button
            className="btn btn-secondary btn-small"
            onClick={goToNextMonth}
            aria-label="Navigate to next month"
          >
            <ChevronRight size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          {!isCurrentMonth && (
            <button
              className="btn btn-secondary btn-small"
              onClick={goToCurrentMonth}
              aria-label="Return to current active month"
            >
              Today
            </button>
          )}

          {committedPlan && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-pill)',
                background: 'var(--as-bg-elevated)',
                border: '1px solid var(--as-border-subtle)',
                fontSize: '0.72rem',
                color: 'var(--as-text-secondary)',
              }}
            >
              {committedPlan.strategy === 'snowball' ? (
                <Snowflake size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-info)' }} />
              ) : (
                <Mountain size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-accent-primary)' }} />
              )}
              <span>
                {committedPlan.strategy === 'snowball' ? 'Snowball' : 'Avalanche'} Plan
                {committedPlan.extra_payment > 0 ? ` (+${fmt(committedPlan.extra_payment)}/mo)` : ''}
              </span>
            </span>
          )}
        </div>

        {/* Mode Switcher: Execute Bills vs Forecast & Flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="tm-mode-switcher">
            <button
              onClick={() => setActiveWorkspaceTab('execute')}
              aria-label="Switch to Execute Bills working view"
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--as-radius-sm)',
                border: 'none',
                background: activeWorkspaceTab === 'execute' ? 'var(--as-accent-muted)' : 'transparent',
                color: activeWorkspaceTab === 'execute' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckSquare size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Execute Bills ({metrics.paidObligationCount}/{metrics.totalObligationCount})
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('forecast')}
              aria-label="Switch to Forecast and Cash Flow analytics view"
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--as-radius-sm)',
                border: 'none',
                background: activeWorkspaceTab === 'forecast' ? 'var(--as-accent-muted)' : 'transparent',
                color: activeWorkspaceTab === 'forecast' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TrendingUp size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              Forecast & Flow
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Execute Bills (Locked) or Forecast & Flow (Locked) */}
      {activeWorkspaceTab === 'forecast' ? (
        <ForecastAndFlowDeck
          state={state}
          metrics={metrics}
        />
      ) : (
        <VariantALedger state={state} metrics={metrics} />
      )}

      {/* Slide-Over Command Drawer */}
      <ObligationDrawer
        obligation={inspectedObligation}
        accounts={metrics.accountsWithMetrics}
        onClose={() => setInspectedObligationId(null)}
        onTogglePaid={toggleObligation}
        onSaveAmount={saveObligationAmount}
        onSelectAccount={assignObligationAccount}
        onSelectDebtTier={handleSetDebtTier}
      />

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="tm-toast">
          <CheckCircle2 size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-success)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--as-text-primary)' }}>{toastMsg}</span>
        </div>
      )}

      {/* Floating Bottom Sandbox Telemetry & Demo Data Controls (Prototype Route Only) */}
      {defaultMemoryOnly && (
        <PrototypeSwitcher
          paidCount={metrics.paidObligationCount}
          totalCount={metrics.totalObligationCount}
          safeCash={metrics.currentLiquidSafe}
          memoryOnly={memoryOnly}
          onToggleMemoryOnly={() => setMemoryOnly((m) => !m)}
          onResetBenchmark={applyBenchmarkState}
        />
      )}
    </div>
  );
}
