// Locked-in high-density FixedBillRow and DebtObligationRow for the Execute Bills workspace.
'use client';

import { useState, useRef } from 'react';
import {
  Check,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { UnifiedObligation, fmtFull, formatDebtTierLabel } from '../hooks/useSandboxMonth';
import { AccountWithMetrics } from '../hooks/sandboxMetrics';

interface BillRowProps {
  ob: UnifiedObligation;
  accountsWithMetrics: AccountWithMetrics[];
  toggleObligation: (ob: UnifiedObligation) => void;
  saveObligationAmount: (ob: UnifiedObligation, val: number, scope?: 'month' | 'master') => void;
  assignObligationAccount: (ob: UnifiedObligation, acctId: string) => void;
  setInspectedObligationId: (id: string | null) => void;
}

export function FixedBillRow({
  ob,
  accountsWithMetrics,
  toggleObligation,
  saveObligationAmount,
  assignObligationAccount,
  setInspectedObligationId,
}: BillRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(ob.amount));
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
          justifyContent: 'space-between',
          gap: 8,
          minWidth: 0,
        }}
      >
        <span
          className={ob.isPaid ? 'tm-strikethrough' : ''}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: ob.isPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)',
            textDecoration: ob.isPaid ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {ob.name}
        </span>
        <div className="tm-row-actions">
          {ob.url && (
            <a
              href={ob.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open payment portal for ${ob.name}`}
              title={`Open payment portal for ${ob.name}`}
              className="tm-row-icon-btn"
              style={{ color: 'var(--as-status-warning)' }}
            >
              <ExternalLink size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setInspectedObligationId(ob.id)}
            aria-label={`Inspect ${ob.name} in command drawer`}
            title={`Configure ${ob.name}`}
            className="tm-row-icon-btn"
          >
            <Sliders size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
        </div>
      </div>

      <div
        className="tm-bill-cell-due"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--as-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
            color:
              ob.isPaid
                ? 'var(--as-text-tertiary)'
                : ob.urgency === 'overdue'
                ? 'var(--as-status-error)'
                : ob.urgency === 'due_soon'
                ? 'var(--as-status-warning)'
                : 'var(--as-text-secondary)',
          }}
        >
          {ob.dueLabel}
        </span>
        {!ob.isPaid && ob.urgency === 'overdue' && (
          <span className="tm-due-badge-overdue">OVERDUE</span>
        )}
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
              setEditVal(String(ob.amount));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable tm-touch-btn ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              color: ob.isPaid
                ? 'var(--as-text-tertiary)'
                : ob.urgency === 'overdue'
                ? 'var(--as-status-error)'
                : 'var(--as-text-primary)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.8rem',
              fontWeight: 700,
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
  accountsWithMetrics: AccountWithMetrics[];
  toggleObligation: (ob: UnifiedObligation) => void;
  handleSetDebtTier: (ob: UnifiedObligation, tier: 'min' | 'due' | 'payoff_plan' | 'full') => void;
  saveObligationAmount: (ob: UnifiedObligation, val: number, scope?: 'month' | 'master') => void;
  assignObligationAccount: (ob: UnifiedObligation, acctId: string) => void;
  setInspectedObligationId: (id: string | null) => void;
}

export function DebtObligationRow({
  ob,
  accountsWithMetrics,
  toggleObligation,
  handleSetDebtTier,
  saveObligationAmount,
  assignObligationAccount,
  setInspectedObligationId,
}: DebtRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(ob.amount));
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

      <div
        className="tm-debt-cell-name"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className={ob.isPaid ? 'tm-strikethrough' : ''}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: ob.isPaid ? 'var(--as-text-tertiary)' : 'var(--as-text-primary)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {ob.name}
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
              marginTop: 2,
              lineHeight: 1.25,
            }}
          >
            Bal {fmtFull(ob.debtBalance || 0)} • {Number(ob.interestRate || 0).toFixed(2)}% APR
          </div>
        </div>

        <div className="tm-row-actions">
          {ob.url && (
            <a
              href={ob.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open payment portal for ${ob.name}`}
              title={`Open payment portal for ${ob.name}`}
              className="tm-row-icon-btn"
              style={{ color: 'var(--as-status-warning)' }}
            >
              <ExternalLink size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setInspectedObligationId(ob.id)}
            aria-label={`Inspect ${ob.name} in command drawer`}
            title={`Configure ${ob.name}`}
            className="tm-row-icon-btn"
          >
            <Sliders size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
        </div>
      </div>

      <div className="tm-debt-cell-due">
        <span
          style={{
            fontFamily: 'var(--as-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1.3,
            color: ob.isPaid
              ? 'var(--as-text-tertiary)'
              : ob.urgency === 'overdue'
              ? 'var(--as-status-error)'
              : ob.urgency === 'due_soon'
              ? 'var(--as-status-warning)'
              : 'var(--as-text-secondary)',
          }}
        >
          {ob.dueLabel}
        </span>
        {!ob.isPaid && ob.urgency === 'overdue' ? (
          <span className="tm-due-badge-overdue">OVERDUE</span>
        ) : (
          <span className="tm-due-subtext">
            {ob.isPaid ? 'Cleared' : ob.urgency === 'due_soon' ? 'Due soon' : 'Scheduled'}
          </span>
        )}
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

      <div className="tm-debt-cell-tier" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
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
              setEditVal(String(ob.amount));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable tm-touch-btn ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              color: ob.isPaid
                ? 'var(--as-text-tertiary)'
                : ob.urgency === 'overdue'
                ? 'var(--as-status-error)'
                : 'var(--as-status-warning)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.8rem',
              fontWeight: 700,
              minWidth: 68,
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
