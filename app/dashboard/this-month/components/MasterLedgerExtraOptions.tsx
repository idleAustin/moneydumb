// Symmetrical FixedBillRow and DebtObligationRow for Execute Bills: stepped matrix Bills alignment, Dates/Days clock due cell, and clickable name drawer trigger.
'use client';

import { useState, useRef } from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import {
  UnifiedObligation,
  MONTH_NAMES,
  fmtFull,
  formatDebtTierLabel,
} from '../hooks/useSandboxMonth';
import { AccountWithMetrics } from '../hooks/sandboxMetrics';

export type DueDisplayMode = 'date' | 'days';

interface ScheduleTelemetry {
  daysLabel: string;
  agePhrase: string;
  tone: 'overdue' | 'due_soon' | 'upcoming' | 'cleared';
}

function computeScheduleTelemetry(
  ob: UnifiedObligation,
  viewMonth: number,
  monthOffset: number,
  todayDay: number
): ScheduleTelemetry {
  void viewMonth;
  if (ob.isPaid) {
    return { daysLabel: 'Cleared', agePhrase: 'Cleared', tone: 'cleared' };
  }
  if (monthOffset < 0) {
    return { daysLabel: 'Past due', agePhrase: 'Past due', tone: 'overdue' };
  }
  if (monthOffset > 0) {
    return { daysLabel: 'Scheduled', agePhrase: 'Scheduled', tone: 'upcoming' };
  }

  const diff = (ob.dueDay || 1) - todayDay;
  if (diff < 0) {
    const daysLate = Math.abs(diff);
    return {
      daysLabel: `${daysLate}d late`,
      agePhrase: `${daysLate}d overdue`,
      tone: 'overdue',
    };
  }
  if (diff === 0) {
    return { daysLabel: 'Today', agePhrase: 'Due today', tone: 'due_soon' };
  }
  if (diff <= 7) {
    return {
      daysLabel: `In ${diff}d`,
      agePhrase: `Due in ${diff}d`,
      tone: 'due_soon',
    };
  }
  return {
    daysLabel: `In ${diff}d`,
    agePhrase: `In ${diff}d`,
    tone: 'upcoming',
  };
}

function ScheduleDueCell({
  ob,
  displayMode,
  viewMonth,
  monthOffset,
  todayDay,
}: {
  ob: UnifiedObligation;
  displayMode: DueDisplayMode;
  viewMonth: number;
  monthOffset: number;
  todayDay: number;
}) {
  const sched = computeScheduleTelemetry(ob, viewMonth, monthOffset, todayDay);
  const showUrgencyClock = sched.tone === 'overdue' || sched.tone === 'due_soon';

  const color =
    sched.tone === 'overdue'
      ? 'var(--as-status-error)'
      : sched.tone === 'due_soon'
      ? 'var(--as-status-warning)'
      : sched.tone === 'cleared'
      ? 'var(--as-text-tertiary)'
      : 'var(--as-text-secondary)';

  const monthShort = MONTH_NAMES[viewMonth - 1]?.slice(0, 3) || '';
  const fallbackDate = monthShort ? `${monthShort} ${ob.dueDay}` : ob.dueLabel;
  const dateText = ob.dueLabel || fallbackDate;
  const primaryText = displayMode === 'date' ? dateText : sched.daysLabel;
  const tooltipPrimary = displayMode === 'days' ? `Due ${dateText}` : dateText;

  return (
    <div className="tooltip-wrapper">
      <span
        tabIndex={0}
        aria-label={`${ob.name}: Due ${dateText}, ${sched.agePhrase}`}
        className="tm-due-slot"
        style={{
          color,
          textDecoration: ob.isPaid && displayMode === 'date' ? 'line-through' : 'none',
        }}
      >
        <span>{primaryText}</span>
        {showUrgencyClock ? (
          <Clock size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" style={{ flexShrink: 0 }} />
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} aria-hidden="true" />
        )}
      </span>
      <div className="tooltip-bubble" role="tooltip">
        <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {tooltipPrimary}
        </span>
        <span
          className="tooltip-kbd"
          style={{
            color:
              sched.tone === 'overdue'
                ? 'var(--as-status-error)'
                : sched.tone === 'due_soon'
                ? 'var(--as-status-warning)'
                : sched.tone === 'cleared'
                ? 'var(--as-status-success)'
                : 'var(--as-text-secondary)',
          }}
        >
          {sched.agePhrase}
        </span>
      </div>
    </div>
  );
}

function InlinePortalLink({ ob }: { ob: UnifiedObligation }) {
  if (!ob.url) return null;
  return (
    <div className="tooltip-wrapper" style={{ flexShrink: 0 }}>
      <a
        href={ob.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open payment portal for ${ob.name}`}
        className="tm-inline-portal tm-touch-btn"
      >
        <ExternalLink size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
      </a>
      <div className="tooltip-bubble" role="tooltip">
        <span>Open payment portal</span>
      </div>
    </div>
  );
}

interface BillRowProps {
  ob: UnifiedObligation;
  dueDisplayMode: DueDisplayMode;
  viewMonth: number;
  monthOffset: number;
  todayDay: number;
  accountsWithMetrics: AccountWithMetrics[];
  toggleObligation: (ob: UnifiedObligation) => void;
  saveObligationAmount: (ob: UnifiedObligation, val: number, scope?: 'month' | 'master') => void;
  assignObligationAccount: (ob: UnifiedObligation, acctId: string) => void;
  setInspectedObligationId: (id: string | null) => void;
}

export function FixedBillRow({
  ob,
  dueDisplayMode,
  viewMonth,
  monthOffset,
  todayDay,
  accountsWithMetrics,
  toggleObligation,
  saveObligationAmount,
  assignObligationAccount,
  setInspectedObligationId,
}: BillRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(Number(ob.amount || 0).toFixed(2));
  const escapingRef = useRef(false);
  const committedRef = useRef(false);

  const commitEdit = () => {
    const parsed = parseFloat(editVal);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      saveObligationAmount(ob, parsed, 'month');
    }
    setEditing(false);
  };

  return (
    <div className="tm-bill-row">
      <div className="tm-bill-cell-check" style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => toggleObligation(ob)}
          aria-pressed={ob.isPaid}
          aria-label={ob.isPaid ? `Mark ${ob.name} as unpaid` : `Mark ${ob.name} as paid`}
          className={`tm-toggle ${ob.isPaid ? 'tm-toggle-on' : ''}`}
        >
          {ob.isPaid && <Check size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
        </button>
      </div>

      <div
        className="tm-bill-cell-name"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setInspectedObligationId(ob.id)}
          aria-label={`Configure ${ob.name}`}
          className="tm-name-trigger tm-touch-btn"
        >
          <span
            className={ob.isPaid ? 'tm-strikethrough' : ''}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: ob.isPaid ? 'var(--as-text-tertiary)' : 'inherit',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {ob.name}
          </span>
          <Sliders size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" className="tm-name-cue" />
        </button>
        <InlinePortalLink ob={ob} />
      </div>

      <div className="tm-bill-cell-due">
        <ScheduleDueCell
          ob={ob}
          displayMode={dueDisplayMode}
          viewMonth={viewMonth}
          monthOffset={monthOffset}
          todayDay={todayDay}
        />
      </div>

      <div className="tm-bill-cell-acct">
        <select
          className="tm-acct-select"
          value={ob.accountId || ''}
          aria-label={`Select bank account for ${ob.name}`}
          onChange={(e) => assignObligationAccount(ob, e.target.value)}
        >
          <option value="">No account</option>
          {accountsWithMetrics.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tm-bill-cell-amt" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {editing ? (
          <input
            className="tm-edit-input"
            type="number"
            step="0.01"
            value={editVal}
            aria-label={`Payment amount for ${ob.name}`}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={() => {
              if (escapingRef.current || committedRef.current) {
                escapingRef.current = false;
                committedRef.current = false;
                return;
              }
              commitEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                committedRef.current = true;
                commitEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                escapingRef.current = true;
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              escapingRef.current = false;
              committedRef.current = false;
              setEditVal(Number(ob.amount || 0).toFixed(2));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable tm-touch-btn ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              color: ob.isPaid
                ? 'var(--as-text-tertiary)'
                : 'color-mix(in srgb, var(--as-text-primary) 86%, var(--as-text-secondary))',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.78rem',
              fontWeight: 600,
              textAlign: 'right',
              marginRight: -6,
            }}
          >
            {fmtFull(ob.amount)}
          </button>
        )}
      </div>
    </div>
  );
}

interface DebtRowProps {
  ob: UnifiedObligation;
  dueDisplayMode: DueDisplayMode;
  viewMonth: number;
  monthOffset: number;
  todayDay: number;
  accountsWithMetrics: AccountWithMetrics[];
  toggleObligation: (ob: UnifiedObligation) => void;
  handleSetDebtTier: (ob: UnifiedObligation, tier: 'min' | 'due' | 'payoff_plan' | 'full') => void;
  saveObligationAmount: (ob: UnifiedObligation, val: number, scope?: 'month' | 'master') => void;
  assignObligationAccount: (ob: UnifiedObligation, acctId: string) => void;
  setInspectedObligationId: (id: string | null) => void;
}

export function DebtObligationRow({
  ob,
  dueDisplayMode,
  viewMonth,
  monthOffset,
  todayDay,
  accountsWithMetrics,
  toggleObligation,
  handleSetDebtTier,
  saveObligationAmount,
  assignObligationAccount,
  setInspectedObligationId,
}: DebtRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(Number(ob.amount || 0).toFixed(2));
  const escapingRef = useRef(false);
  const committedRef = useRef(false);

  const commitEdit = () => {
    const parsed = parseFloat(editVal);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      saveObligationAmount(ob, parsed, 'month');
    }
    setEditing(false);
  };

  return (
    <div className="tm-debt-row">
      <div className="tm-debt-cell-check" style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => toggleObligation(ob)}
          aria-pressed={ob.isPaid}
          aria-label={ob.isPaid ? `Mark ${ob.name} as unpaid` : `Mark ${ob.name} as paid`}
          className={`tm-toggle ${ob.isPaid ? 'tm-toggle-on' : ''}`}
        >
          {ob.isPaid && <Check size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
        </button>
      </div>

      <div className="tm-debt-cell-name" style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => setInspectedObligationId(ob.id)}
            aria-label={`Configure ${ob.name}`}
            className="tm-name-trigger tm-touch-btn"
          >
            <span
              className={ob.isPaid ? 'tm-strikethrough' : ''}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: ob.isPaid ? 'var(--as-text-tertiary)' : 'inherit',
                textDecoration: ob.isPaid ? 'line-through' : 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3,
              }}
            >
              {ob.name}
            </span>
            <Sliders size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" className="tm-name-cue" />
          </button>
          <InlinePortalLink ob={ob} />
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--as-text-tertiary)',
            fontFamily: 'var(--as-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 3,
            lineHeight: 1.25,
          }}
        >
          Bal {fmtFull(ob.debtBalance || 0)} • {Number(ob.interestRate || 0).toFixed(2)}% APR
        </div>
      </div>

      <div className="tm-debt-cell-due">
        <ScheduleDueCell
          ob={ob}
          displayMode={dueDisplayMode}
          viewMonth={viewMonth}
          monthOffset={monthOffset}
          todayDay={todayDay}
        />
      </div>

      <div className="tm-debt-cell-acct">
        <select
          className="tm-acct-select"
          value={ob.accountId || ''}
          aria-label={`Select bank account for ${ob.name}`}
          onChange={(e) => assignObligationAccount(ob, e.target.value)}
        >
          <option value="">No account</option>
          {accountsWithMetrics.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tm-debt-cell-tier">
        {editing ? (
          <input
            className="tm-edit-input"
            type="number"
            step="0.01"
            value={editVal}
            aria-label={`Payment amount for ${ob.name}`}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={() => {
              if (escapingRef.current || committedRef.current) {
                escapingRef.current = false;
                committedRef.current = false;
                return;
              }
              commitEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                committedRef.current = true;
                commitEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                escapingRef.current = true;
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              escapingRef.current = false;
              committedRef.current = false;
              setEditVal(Number(ob.amount || 0).toFixed(2));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable tm-touch-btn ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              color: ob.isPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.8rem',
              fontWeight: 700,
              textAlign: 'right',
              marginRight: -6,
            }}
          >
            {fmtFull(ob.amount)}
          </button>
        )}

        <div className="tm-pay-tier" role="group" aria-label={`Payment tier for ${ob.name}`}>
          {(['min', 'due', 'payoff_plan', 'full'] as const).map((tier) => {
            const isActive = ob.activeTier === tier;
            const humanLabel = formatDebtTierLabel(tier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleSetDebtTier(ob, tier)}
                aria-pressed={isActive}
                aria-label={`Set ${humanLabel} payment tier for ${ob.name}`}
                className={`tm-tier-btn ${isActive ? 'tm-tier-active' : ''}`}
              >
                {tier === 'payoff_plan' ? 'Plan' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
