// Shared This Month operational workspace orchestrator for /dashboard/this-month and /dashboard/prototype.
'use client';

import { useRef } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Snowflake,
  Mountain,
  CheckCircle2,
  CheckSquare,
  TrendingUp,
  RefreshCw,
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

export function ThisMonthWorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading monthly workspace"
      className="fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 72 }}
    >
      <div className="page-header tm-workspace-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ width: 190, height: 32, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 'var(--as-radius-sm)' }} />
        </div>
        <div className="skeleton" style={{ width: 290, height: 34, borderRadius: 'var(--as-radius-md)' }} />
      </div>

      <div
        style={{
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          padding: '14px 18px',
        }}
      >
        <div className="tm-top-burn-grid">
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 56, borderRadius: 'var(--as-radius-sm)' }} />
        </div>
      </div>

      <div
        style={{
          background: 'var(--as-bg-surface)',
          border: '1px solid var(--as-border-subtle)',
          borderRadius: 'var(--as-radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div className="skeleton" style={{ width: 240, height: 22, borderRadius: 'var(--as-radius-sm)' }} />
        <div className="skeleton" style={{ height: 38, borderRadius: 'var(--as-radius-sm)' }} />
        <div className="skeleton" style={{ height: 38, borderRadius: 'var(--as-radius-sm)' }} />
        <div className="skeleton" style={{ height: 38, borderRadius: 'var(--as-radius-sm)' }} />
      </div>

      <div className="tm-ledger-split">
        <div
          style={{
            background: 'var(--as-bg-surface)',
            border: '1px solid var(--as-border-subtle)',
            borderRadius: 'var(--as-radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div className="skeleton" style={{ height: 28, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
        </div>
        <div
          style={{
            background: 'var(--as-bg-surface)',
            border: '1px solid var(--as-border-subtle)',
            borderRadius: 'var(--as-radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div className="skeleton" style={{ height: 28, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
          <div className="skeleton" style={{ height: 36, borderRadius: 'var(--as-radius-sm)' }} />
        </div>
      </div>
    </div>
  );
}

export default function ThisMonthWorkspace({ defaultMemoryOnly = false }: ThisMonthWorkspaceProps) {
  const state = useSandboxMonth(defaultMemoryOnly);
  const metrics = computeSandboxMetrics(state);
  const executeTabRef = useRef<HTMLButtonElement>(null);
  const forecastTabRef = useRef<HTMLButtonElement>(null);

  const {
    data,
    loading,
    error,
    reload,
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

  const handleLoadDemoSandbox = () => {
    setMemoryOnly(true);
    applyBenchmarkState();
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = activeWorkspaceTab === 'execute' ? 'forecast' : 'execute';
      setActiveWorkspaceTab(next);
      if (next === 'execute') {
        executeTabRef.current?.focus();
      } else {
        forecastTabRef.current?.focus();
      }
    }
  };

  if (loading && !data) {
    return <ThisMonthWorkspaceSkeleton />;
  }

  if (error && (!data || !metrics)) {
    return (
      <div className="fade-in" style={{ paddingBottom: 72 }}>
        <div className="page-header tm-workspace-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.025em', textWrap: 'balance' }}>
              <Calendar size={19} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 8, color: 'var(--as-accent-primary)' }} />
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </h1>
          </div>
        </div>

        <div
          className="error-state-banner"
          role="alert"
          style={{
            background: 'var(--as-bg-surface)',
            border: '1px solid var(--as-status-error)',
            borderRadius: 'var(--as-radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-error)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                Monthly ledger unavailable
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--as-text-secondary)', marginTop: 2 }}>
                {error}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-small" onClick={reload}>
              <RefreshCw size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Retry</span>
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLoadDemoSandbox}>
              Load Demo Sandbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !metrics) {
    return (
      <div className="fade-in" style={{ paddingBottom: 72 }}>
        <div
          className="error-state-banner"
          role="alert"
          style={{
            background: 'var(--as-bg-surface)',
            border: '1px solid var(--as-border-strong)',
            borderRadius: 'var(--as-radius-md)',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-warning)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--as-text-primary)' }}>
                Monthly workspace data unavailable
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--as-text-secondary)', marginTop: 2 }}>
                Verify your database connection and retry, or open the in-memory demo sandbox.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-small" onClick={reload}>
              <RefreshCw size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Retry</span>
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLoadDemoSandbox}>
              Load Demo Sandbox
            </button>
          </div>
        </div>
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
            type="button"
            className="btn btn-secondary btn-small tm-touch-btn"
            onClick={goToPrevMonth}
            aria-label="Navigate to previous month"
          >
            <ChevronLeft size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          <h1
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.35rem',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              textWrap: 'balance',
            }}
          >
            <Calendar size={19} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ marginRight: 8, color: 'var(--as-accent-primary)' }} />
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </h1>
          <button
            type="button"
            className="btn btn-secondary btn-small tm-touch-btn"
            onClick={goToNextMonth}
            aria-label="Navigate to next month"
          >
            <ChevronRight size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
          {!isCurrentMonth && (
            <button
              type="button"
              className="btn btn-secondary btn-small tm-touch-btn"
              onClick={goToCurrentMonth}
              aria-label="Return to current active month"
            >
              Today
            </button>
          )}

          {loading && (
            <span
              role="status"
              aria-live="polite"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--as-radius-pill)',
                background: 'var(--as-bg-elevated)',
                border: '1px solid var(--as-border-subtle)',
                fontSize: '0.72rem',
                fontFamily: 'var(--as-font-mono)',
                color: 'var(--as-text-secondary)',
              }}
            >
              <RefreshCw size={12} strokeWidth={2.0} className="animate-spin" aria-hidden="true" focusable="false" />
              <span>Syncing month...</span>
            </span>
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
                {committedPlan.extra_payment > 0 && (
                  <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                    (+{fmt(committedPlan.extra_payment)}/mo)
                  </span>
                )}
              </span>
            </span>
          )}
        </div>

        {/* Mode Switcher: Execute Bills vs Forecast & Flow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="tm-mode-switcher"
            role="tablist"
            aria-label="Monthly workspace views"
            onKeyDown={handleTabKeyDown}
          >
            <button
              ref={executeTabRef}
              id="tm-tab-execute"
              type="button"
              role="tab"
              aria-selected={activeWorkspaceTab === 'execute'}
              aria-controls="tm-panel-execute"
              tabIndex={activeWorkspaceTab === 'execute' ? 0 : -1}
              onClick={() => setActiveWorkspaceTab('execute')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--as-radius-sm)',
                border: 'none',
                background: activeWorkspaceTab === 'execute' ? 'var(--as-accent-muted)' : 'transparent',
                color: activeWorkspaceTab === 'execute' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CheckSquare size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Execute Bills</span>
              <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                ({metrics.paidObligationCount}/{metrics.totalObligationCount})
              </span>
            </button>
            <button
              ref={forecastTabRef}
              id="tm-tab-forecast"
              type="button"
              role="tab"
              aria-selected={activeWorkspaceTab === 'forecast'}
              aria-controls="tm-panel-forecast"
              tabIndex={activeWorkspaceTab === 'forecast' ? 0 : -1}
              onClick={() => setActiveWorkspaceTab('forecast')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--as-radius-sm)',
                border: 'none',
                background: activeWorkspaceTab === 'forecast' ? 'var(--as-accent-muted)' : 'transparent',
                color: activeWorkspaceTab === 'forecast' ? 'var(--as-accent-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <TrendingUp size={13} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <span>Forecast &amp; Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Error Banner if a subsequent month-switch fetch failed while keeping workspace mounted */}
      {error && (
        <div
          className="error-state-banner"
          role="alert"
          style={{
            marginBottom: 16,
            background: 'var(--as-bg-surface)',
            border: '1px solid var(--as-status-error)',
            borderRadius: 'var(--as-radius-md)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-error)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--as-text-primary)', fontWeight: 500 }}>
              {error}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="btn btn-primary btn-small" onClick={reload}>
              Retry
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={handleLoadDemoSandbox}>
              Load Demo Sandbox
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Execute Bills or Forecast & Flow */}
      {activeWorkspaceTab === 'forecast' ? (
        <div id="tm-panel-forecast" role="tabpanel" aria-labelledby="tm-tab-forecast">
          <ForecastAndFlowDeck state={state} metrics={metrics} />
        </div>
      ) : (
        <div id="tm-panel-execute" role="tabpanel" aria-labelledby="tm-tab-execute">
          <VariantALedger state={state} metrics={metrics} />
        </div>
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
        <div className="tm-toast" role="status" aria-live="polite">
          <CheckCircle2 size={15} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ color: 'var(--as-status-success)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--as-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {toastMsg}
          </span>
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
