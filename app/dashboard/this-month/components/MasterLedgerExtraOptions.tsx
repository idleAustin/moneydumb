// Locked-in high-density FixedBillRow and DebtObligationRow for the Execute Bills workspace.
'use client';

import { useState } from 'react';
import {
  Check,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { UnifiedObligation, fmtFull } from '../hooks/useSandboxMonth';
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

  return (
    <div
      className="tm-bill-row"
      style={{
        opacity: ob.isPaid ? 0.55 : 1,
      }}
    >
      <div className="tm-bill-cell-check" style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => toggleObligation(ob)}
          aria-label={ob.isPaid ? `Mark ${ob.name} as unpaid` : `Mark ${ob.name} as paid`}
          className={`tm-toggle ${ob.isPaid ? 'tm-toggle-on' : ''}`}
        >
          {ob.isPaid && <Check size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
        </button>
      </div>

      <div className="tm-bill-cell-name" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          className={ob.isPaid ? 'tm-strikethrough' : ''}
          style={{
            fontSize: '0.79rem',
            fontWeight: 600,
            color: ob.isPaid ? 'var(--as-text-muted)' : 'var(--as-text-primary)',
            textDecoration: ob.isPaid ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {ob.name}
        </span>
        {ob.url && (
          <a
            href={ob.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open payment portal for ${ob.name}`}
            style={{ color: 'var(--as-status-warning)', display: 'inline-flex', flexShrink: 0 }}
          >
            <ExternalLink size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </a>
        )}
        {!ob.isPaid && ob.urgency === 'overdue' && (
          <span
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '1px 5px',
              borderRadius: 'var(--as-radius-sm)',
              background: 'var(--as-status-error-bg)',
              color: 'var(--as-status-error)',
              flexShrink: 0,
            }}
          >
            OVERDUE
          </span>
        )}
        <button
          onClick={() => setInspectedObligationId(ob.id)}
          aria-label={`Inspect ${ob.name} in command drawer`}
          style={{ background: 'none', border: 'none', color: 'var(--as-text-muted)', cursor: 'pointer', display: 'inline-flex', padding: 2, flexShrink: 0 }}
        >
          <Sliders size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </button>
      </div>

      <div
        className="tm-bill-cell-due"
        style={{
          fontFamily: 'var(--as-font-mono)',
          fontSize: '0.72rem',
          fontWeight: 600,
          color:
            ob.isPaid
              ? 'var(--as-text-muted)'
              : ob.urgency === 'overdue'
              ? 'var(--as-status-error)'
              : ob.urgency === 'due_soon'
              ? 'var(--as-status-warning)'
              : 'var(--as-text-secondary)',
        }}
      >
        {ob.dueLabel}
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
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={() => {
              saveObligationAmount(ob, parseFloat(editVal), 'month');
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveObligationAmount(ob, parseFloat(editVal), 'month');
                setEditing(false);
              } else if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditVal(String(ob.amount));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              color: ob.isPaid
                ? 'var(--as-text-muted)'
                : ob.urgency === 'overdue'
                ? 'var(--as-status-error)'
                : 'var(--as-text-primary)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              fontFamily: 'var(--as-font-mono)',
              fontSize: '0.79rem',
              fontWeight: 700,
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

  return (
    <div
      className="tm-debt-row"
      style={{
        opacity: ob.isPaid ? 0.55 : 1,
      }}
    >
      <div className="tm-debt-cell-check" style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => toggleObligation(ob)}
          aria-label={ob.isPaid ? `Mark ${ob.name} as unpaid` : `Mark ${ob.name} as paid`}
          className={`tm-toggle ${ob.isPaid ? 'tm-toggle-on' : ''}`}
        >
          {ob.isPaid && <Check size={12} strokeWidth={2.0} aria-hidden="true" focusable="false" />}
        </button>
      </div>

      <div className="tm-debt-cell-name" style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            className={ob.isPaid ? 'tm-strikethrough' : ''}
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: ob.isPaid ? 'var(--as-text-muted)' : 'var(--as-text-primary)',
              textDecoration: ob.isPaid ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ob.name}
          </span>
          {ob.url && (
            <a href={ob.url} target="_blank" rel="noopener noreferrer" aria-label={`Open payment portal for ${ob.name}`} style={{ color: 'var(--as-status-warning)', display: 'inline-flex', flexShrink: 0 }}>
              <ExternalLink size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </a>
          )}
          <button
            onClick={() => setInspectedObligationId(ob.id)}
            aria-label={`Inspect ${ob.name} in command drawer`}
            style={{ background: 'none', border: 'none', color: 'var(--as-text-muted)', cursor: 'pointer', display: 'inline-flex', padding: 2, flexShrink: 0 }}
          >
            <Sliders size={11} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          </button>
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-mono)' }}>
          Bal {fmtFull(ob.debtBalance || 0)} • {ob.interestRate}% APR
        </div>
      </div>

      <div className="tm-debt-cell-due" style={{ fontFamily: 'var(--as-font-mono)', fontSize: '0.72rem', fontWeight: 600, color: ob.isPaid ? 'var(--as-text-muted)' : ob.urgency === 'overdue' ? 'var(--as-status-error)' : ob.urgency === 'due_soon' ? 'var(--as-status-warning)' : 'var(--as-text-secondary)' }}>
        {ob.dueLabel}
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
        <div className="tm-pay-tier">
          {(['min', 'due', 'payoff_plan', 'full'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => handleSetDebtTier(ob, tier)}
              aria-label={`Set ${tier} payment tier for ${ob.name}`}
              className={`tm-tier-btn ${ob.activeTier === tier ? 'tm-tier-active' : ''}`}
            >
              {tier === 'payoff_plan' ? 'Plan' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        {editing ? (
          <input
            className="tm-edit-input"
            type="number"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={() => {
              saveObligationAmount(ob, parseFloat(editVal), 'month');
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                saveObligationAmount(ob, parseFloat(editVal), 'month');
                setEditing(false);
              } else if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditVal(String(ob.amount));
              setEditing(true);
            }}
            aria-label={`Edit amount for ${ob.name}`}
            className={`tm-editable ${ob.isPaid ? 'tm-strikethrough' : ''}`}
            style={{ background: 'none', border: 'none', color: ob.isPaid ? 'var(--as-text-muted)' : 'var(--as-status-warning)', textDecoration: ob.isPaid ? 'line-through' : 'none', fontFamily: 'var(--as-font-mono)', fontSize: '0.79rem', fontWeight: 700, minWidth: 68, textAlign: 'right' }}
          >
            {fmtFull(ob.amount)}
          </button>
        )}
      </div>
    </div>
  );
}
