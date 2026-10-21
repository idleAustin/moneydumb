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

// --- 1. STACKED BAR (Bank Breakdown) ---
export function BankStackedBar({ banks }: { banks: BankItem[] }) {
  return (
    <div className="space-y-3 mt-4 w-full">
      {banks.map((bank) => {
        const safe = bank.current_balance - bank.pending_total;
        const total = bank.current_balance;
        const safePct = total > 0 ? (safe / total) * 100 : 0;
        const pendingPct = total > 0 ? (bank.pending_total / total) * 100 : 0;

        return (
          <div key={bank.id} className="text-xs">
            <div className="flex justify-between mb-1" style={{ color: 'var(--as-text-muted)' }}>
              <span className="uppercase truncate max-w-[120px]">{bank.name}</span>
              <span className="whitespace-nowrap" style={{ fontFamily: 'var(--as-font-mono)', color: 'var(--as-accent-primary)' }}>
                ${safe.toFixed(0)} <span className="hidden sm:inline" style={{ color: 'var(--as-text-muted)' }}>/ ${total.toFixed(0)}</span>
              </span>
            </div>
            <div
              className="h-3 w-full flex"
              style={{
                backgroundColor: 'var(--as-border-subtle)',
                borderRadius: 'var(--as-radius-sm)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${safePct}%`,
                  backgroundColor: 'var(--as-accent-primary)',
                  boxShadow: '0 0 8px var(--as-accent-glow)',
                }}
                className="h-full transition-all duration-500"
              />
              <div
                style={{
                  width: `${pendingPct}%`,
                  backgroundColor: 'var(--as-status-error)',
                }}
                className="h-full opacity-80 transition-all duration-500"
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
  const [hovered, setHovered] = useState<CategoryItem | null>(null);

  if (data.length === 0) {
    return (
      <div className="text-center text-xs py-8" style={{ color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-body)' }}>
        No data for this month.
      </div>
    );
  }

  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  const tokenColors = [
    'var(--as-accent-primary)',
    'var(--as-status-warning)',
    'var(--as-status-error)',
    'var(--as-status-info)',
    'var(--as-accent-hover)',
  ];

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
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="relative flex flex-col items-center mt-2 w-full">
      <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {slices.map((slice, i) => (
            <circle
              key={i}
              r="40"
              cx="50"
              cy="50"
              fill="transparent"
              stroke={tokenColors[i % tokenColors.length]}
              strokeWidth="12"
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
              className="hover:opacity-80 cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHovered(slice.item)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(slice.item)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-bold" style={{ color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-mono)' }}>
            {hovered ? `${((hovered.value / total) * 100).toFixed(0)}%` : 'TOTAL'}
          </span>
        </div>
      </div>

      <div
        className="mt-4 w-full pt-2 min-h-[3rem]"
        style={{ borderTop: '1px solid var(--as-border-subtle)' }}
      >
        {hovered ? (
          <div className="text-center animate-pulse">
            <div
              className="text-sm font-bold uppercase truncate"
              style={{ color: 'var(--as-accent-primary)' }}
            >
              {hovered.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-mono)' }}>
              ${hovered.value.toFixed(2)}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]" style={{ color: 'var(--as-text-muted)' }}>
            {data.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center overflow-hidden">
                <span
                  className="w-2 h-2 rounded-full mr-1 shrink-0"
                  style={{ backgroundColor: tokenColors[i % tokenColors.length] }}
                />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. GAUGE (Completion %) ---
export function CompletionGauge({ completed, total }: { completed: number; total: number }) {
  const percent = total > 0 ? (completed / total) * 100 : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const strokeDashoffset = halfCircumference - (percent / 100) * halfCircumference;

  return (
    <div className="flex flex-col items-center mt-2 w-full">
      <div className="relative w-40 h-20 overflow-hidden shrink-0">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--as-border-strong)"
            strokeWidth="10"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--as-accent-primary)"
            strokeWidth="10"
            className="transition-all duration-1000 ease-out"
            strokeDasharray={halfCircumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute bottom-0 left-0 w-full text-center">
          <span
            className="text-3xl font-bold"
            style={{
              color: 'var(--as-accent-primary)',
              filter: 'drop-shadow(0 0 8px var(--as-accent-glow))',
              fontFamily: 'var(--as-font-mono)',
            }}
          >
            {percent.toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        className="text-xs mt-2 uppercase tracking-widest text-center"
        style={{ color: 'var(--as-text-muted)', fontFamily: 'var(--as-font-mono)' }}
      >
        {completed} / {total} completed
      </div>
    </div>
  );
}

// --- 4. CASH FLOW MONITOR (Resources vs Obligations) ---
export function CashFlowMonitor({ assets, inbound, expenses }: { assets: number; inbound: number; expenses: number }) {
  const totalResources = assets + inbound;
  const isCovered = totalResources >= expenses;
  const surplus = totalResources - expenses;

  // Bar Calculation
  const maxVal = Math.max(totalResources, expenses);
  const assetsPct = maxVal > 0 ? (assets / maxVal) * 100 : 0;
  const inboundPct = maxVal > 0 ? (inbound / maxVal) * 100 : 0;
  const expensesPct = maxVal > 0 ? (expenses / maxVal) * 100 : 0;

  return (
    <div className="flex flex-col h-full justify-between py-2 w-full">
      {/* The Big Number */}
      <div className="text-center mb-4">
        <div
          className="text-[10px] md:text-xs uppercase tracking-widest mb-1"
          style={{ color: 'var(--as-text-muted)' }}
        >
          PROJECTED MONTH END
        </div>
        <div
          className="text-2xl md:text-3xl font-bold"
          style={{
            fontFamily: 'var(--as-font-mono)',
            color: isCovered ? 'var(--as-accent-primary)' : 'var(--as-status-error)',
          }}
        >
          {isCovered ? '+' : ''}${surplus.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
        <div className="text-[10px] mt-1" style={{ color: 'var(--as-text-muted)' }}>
          {isCovered ? 'SAFE SURPLUS' : 'DEFICIT WARNING'}
        </div>
      </div>

      {/* The Comparison Bars */}
      <div className="space-y-5">
        {/* Resource Bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1 uppercase" style={{ color: 'var(--as-text-muted)' }}>
            <span>Funding</span>
            <span style={{ color: 'var(--as-accent-primary)', fontFamily: 'var(--as-font-mono)' }}>
              ${totalResources.toFixed(0)}
            </span>
          </div>
          <div
            className="h-4 w-full flex relative"
            style={{
              backgroundColor: 'var(--as-bg-surface)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${assetsPct}%`,
                backgroundColor: 'var(--as-accent-primary)',
              }}
              className="h-full"
            />
            <div
              style={{
                width: `${inboundPct}%`,
                border: '2px dashed var(--as-accent-primary)',
                backgroundColor: 'var(--as-accent-muted)',
              }}
              className="h-full opacity-60"
            />
          </div>
          <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--as-text-muted)' }}>
            <div className="flex items-center gap-2">
              <span className="flex items-center">
                <span
                  className="w-2 h-2 mr-1 inline-block"
                  style={{ backgroundColor: 'var(--as-accent-primary)', borderRadius: '2px' }}
                />{' '}
                CASH
              </span>
              <span className="flex items-center">
                <span
                  className="w-2 h-2 mr-1 inline-block"
                  style={{ border: '1px solid var(--as-accent-primary)', borderRadius: '2px' }}
                />{' '}
                IN
              </span>
            </div>
            <span style={{ fontFamily: 'var(--as-font-mono)' }}>+${inbound.toFixed(0)}</span>
          </div>
        </div>

        {/* Obligation Bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1 uppercase" style={{ color: 'var(--as-text-muted)' }}>
            <span>Bills</span>
            <span style={{ color: 'var(--as-status-error)', fontFamily: 'var(--as-font-mono)' }}>
              ${expenses.toFixed(0)}
            </span>
          </div>
          <div
            className="h-4 w-full"
            style={{
              backgroundColor: 'var(--as-bg-surface)',
              border: '1px solid var(--as-border-subtle)',
              borderRadius: 'var(--as-radius-sm)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${expensesPct}%`,
                backgroundColor: 'var(--as-status-error)',
              }}
              className="h-full opacity-80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}