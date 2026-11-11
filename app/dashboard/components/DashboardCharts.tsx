'use client';

import { useState } from 'react';

interface BankItem {
  id: string | number;
  name: string;
  current_balance: number;
  pending_total: number;
}

interface CategoryItem {
  name: string;
  value: number;
}

function formatWholeCurrency(val: number, withPlus = false): string {
  const absFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(val));
  if (val < 0) return `-${absFormatted}`;
  if (withPlus && val > 0) return `+${absFormatted}`;
  return absFormatted;
}

function formatExactCurrency(val: number): string {
  const absFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));
  return val < 0 ? `-${absFormatted}` : absFormatted;
}

// --- 1. STACKED BAR (Bank Breakdown) ---
export function BankStackedBar({ banks }: { banks: BankItem[] }) {
  if (banks.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          padding: '24px 12px',
          color: 'var(--as-text-secondary)',
          fontFamily: 'var(--as-font-body)',
        }}
      >
        No bank accounts configured yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, width: '100%' }}>
      {banks.map((bank) => {
        const safe = bank.current_balance - bank.pending_total;
        const total = bank.current_balance;
        const rawSafePct = total > 0 ? (safe / total) * 100 : 0;
        const safePct = Math.max(0, Math.min(100, rawSafePct));
        const rawPendingPct = total > 0 ? (bank.pending_total / total) * 100 : bank.pending_total > 0 ? 100 : 0;
        const pendingPct = Math.max(0, Math.min(100 - safePct, rawPendingPct));
        const isOverdrawn = safe < 0;

        return (
          <div key={bank.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 5,
                fontSize: '0.75rem',
                color: 'var(--as-text-secondary)',
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {bank.name}
              </span>
              <span
                style={{
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  color: isOverdrawn ? 'var(--as-status-error)' : 'var(--as-status-success)',
                  fontWeight: 600,
                }}
              >
                {formatWholeCurrency(safe)}{' '}
                <span style={{ color: 'var(--as-text-tertiary)', fontWeight: 400 }}>
                  / {formatWholeCurrency(total)}
                </span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${bank.name} safe balance`}
              aria-valuenow={Math.round(safePct)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                height: 10,
                width: '100%',
                display: 'flex',
                backgroundColor: 'var(--as-bg-base)',
                border: '1px solid var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${safePct}%`,
                  height: '100%',
                  backgroundColor: 'var(--as-status-success)',
                  transition: 'width var(--as-duration-normal) var(--as-ease-snap)',
                }}
              />
              <div
                style={{
                  width: `${pendingPct}%`,
                  height: '100%',
                  backgroundColor: 'var(--as-status-error)',
                  transition: 'width var(--as-duration-normal) var(--as-ease-snap)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- 2. DONUT CHART (Category Breakdown) ---
export function CategoryDonut({ data }: { data: CategoryItem[] }) {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.82rem',
          padding: '28px 12px',
          color: 'var(--as-text-secondary)',
          fontFamily: 'var(--as-font-body)',
        }}
      >
        No category activity recorded for this month.
      </div>
    );
  }

  const tokenColors = [
    'var(--as-accent-primary)',
    'var(--as-status-info)',
    'var(--as-status-success)',
    'var(--as-status-warning)',
    'var(--as-status-error)',
  ];

  const activeItem = data.find((d) => d.name === selectedName) ?? null;

  const slices = data.map((item, index) => {
    const percent = total > 0 ? (item.value / total) * 100 : 0;
    const dashArray = `${percent} 100`;
    const previousOffset = data.slice(0, index).reduce((acc, curr) => {
      const p = total > 0 ? (curr.value / total) * 100 : 0;
      return acc + p;
    }, 0);
    const dashOffset = 100 - previousOffset;
    return {
      item,
      percent,
      dashArray,
      dashOffset,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8, width: '100%' }}>
      <div style={{ position: 'relative', width: 144, height: 144, flexShrink: 0 }}>
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Category spending breakdown totaling ${formatExactCurrency(total)}`}
          style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}
        >
          {slices.map((slice, i) => {
            const isSelected = activeItem?.name === slice.item.name;
            return (
              <circle
                key={slice.item.name}
                r="40"
                cx="50"
                cy="50"
                fill="transparent"
                stroke={tokenColors[i % tokenColors.length]}
                strokeWidth={isSelected ? '14' : '11'}
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                style={{
                  cursor: 'pointer',
                  opacity: activeItem && !isSelected ? 0.45 : 1,
                  transition: 'opacity var(--as-duration-normal) var(--as-ease-snap), stroke-width var(--as-duration-fast) var(--as-ease-snap)',
                }}
                onMouseEnter={() => setSelectedName(slice.item.name)}
                onMouseLeave={() => setSelectedName(null)}
                onClick={() => setSelectedName((prev) => (prev === slice.item.name ? null : slice.item.name))}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            padding: 12,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--as-text-primary)',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {activeItem ? `${((activeItem.value / total) * 100).toFixed(0)}%` : formatWholeCurrency(total)}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--as-text-tertiary)', marginTop: 2 }}>
            {activeItem ? 'Share' : 'Total'}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          width: '100%',
          paddingTop: 10,
          borderTop: '1px solid var(--as-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {slices.map((slice, i) => {
          const isSelected = activeItem?.name === slice.item.name;
          return (
            <button
              key={slice.item.name}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedName((prev) => (prev === slice.item.name ? null : slice.item.name))}
              onMouseEnter={() => setSelectedName(slice.item.name)}
              onMouseLeave={() => setSelectedName(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                width: '100%',
                padding: '5px 8px',
                borderRadius: 'var(--as-radius-sm)',
                border: isSelected ? '1px solid var(--as-border-strong)' : '1px solid transparent',
                background: isSelected ? 'var(--as-bg-elevated)' : 'transparent',
                color: isSelected ? 'var(--as-text-primary)' : 'var(--as-text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color var(--as-duration-fast) var(--as-ease-snap), border-color var(--as-duration-fast) var(--as-ease-snap), color var(--as-duration-fast) var(--as-ease-snap)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: tokenColors[i % tokenColors.length],
                  }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slice.item.name}
                </span>
              </span>
              <span
                style={{
                  fontFamily: 'var(--as-font-mono)',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--as-text-primary)',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {formatExactCurrency(slice.item.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- 3. GAUGE (Completion %) ---
export function CompletionGauge({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? Math.max(0, Math.min(100, (completed / total) * 100)) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const strokeDashoffset = halfCircumference - (percent / 100) * halfCircumference;

  return (
    <div
      role="progressbar"
      aria-label="Monthly bill completion"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8, width: '100%' }}
    >
      <div style={{ position: 'relative', width: 160, height: 82, overflow: 'hidden', flexShrink: 0 }}>
        <svg viewBox="0 0 100 50" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--as-bg-base)"
            strokeWidth="10"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--as-accent-primary)"
            strokeWidth="10"
            style={{
              transition: 'stroke-dashoffset 250ms var(--as-ease-snap)',
            }}
            strokeDasharray={halfCircumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--as-text-primary)',
              fontFamily: 'var(--as-font-mono)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
            }}
          >
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          marginTop: 8,
          textAlign: 'center',
          color: 'var(--as-text-secondary)',
          fontFamily: 'var(--as-font-mono)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {completed} of {total} settled
      </div>
    </div>
  );
}

// --- 4. CASH FLOW MONITOR (Resources vs Obligations) ---
export function CashFlowMonitor({ assets, inbound, expenses }: { assets: number; inbound: number; expenses: number }) {
  const totalResources = assets + inbound;
  const isCovered = totalResources >= expenses;
  const surplus = totalResources - expenses;

  const maxVal = Math.max(totalResources, expenses);
  const assetsPct = maxVal > 0 ? Math.max(0, Math.min(100, (assets / maxVal) * 100)) : 0;
  const inboundPct = maxVal > 0 ? Math.max(0, Math.min(100 - assetsPct, (inbound / maxVal) * 100)) : 0;
  const expensesPct = maxVal > 0 ? Math.max(0, Math.min(100, (expenses / maxVal) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '8px 0', width: '100%' }}>
      {/* Hero Surplus / Deficit Metric */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            fontFamily: 'var(--as-font-mono)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
            color: isCovered ? 'var(--as-status-success)' : 'var(--as-status-error)',
          }}
        >
          {formatWholeCurrency(surplus, true)}
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--as-text-secondary)', fontWeight: 500 }}>
          {isCovered ? 'Projected Month-End Surplus' : 'Projected Month-End Deficit'}
        </div>
      </div>

      {/* Comparison Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Resource Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: 5,
              color: 'var(--as-text-secondary)',
              fontWeight: 600,
            }}
          >
            <span>Total Funding</span>
            <span
              style={{
                color: 'var(--as-status-success)',
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatWholeCurrency(totalResources)}
            </span>
          </div>
          <div
            style={{
              height: 12,
              width: '100%',
              display: 'flex',
              backgroundColor: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${assetsPct}%`,
                height: '100%',
                backgroundColor: 'var(--as-status-success)',
              }}
            />
            <div
              style={{
                width: `${inboundPct}%`,
                height: '100%',
                borderLeft: inboundPct > 0 && assetsPct > 0 ? '1px solid var(--as-bg-base)' : 'none',
                backgroundColor: 'var(--as-status-info)',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.6875rem',
              marginTop: 5,
              color: 'var(--as-text-tertiary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  aria-hidden="true"
                  style={{ width: 8, height: 8, backgroundColor: 'var(--as-status-success)', borderRadius: 2, display: 'inline-block' }}
                />
                Cash on Hand
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  aria-hidden="true"
                  style={{ width: 8, height: 8, backgroundColor: 'var(--as-status-info)', borderRadius: 2, display: 'inline-block' }}
                />
                Inbound Pay
              </span>
            </div>
            <span style={{ fontFamily: 'var(--as-font-mono)', fontVariantNumeric: 'tabular-nums' }}>
              {formatWholeCurrency(inbound, true)}
            </span>
          </div>
        </div>

        {/* Obligation Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              marginBottom: 5,
              color: 'var(--as-text-secondary)',
              fontWeight: 600,
            }}
          >
            <span>Pending Bills</span>
            <span
              style={{
                color: 'var(--as-status-error)',
                fontFamily: 'var(--as-font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatWholeCurrency(expenses)}
            </span>
          </div>
          <div
            style={{
              height: 12,
              width: '100%',
              backgroundColor: 'var(--as-bg-base)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${expensesPct}%`,
                height: '100%',
                backgroundColor: 'var(--as-status-error)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
