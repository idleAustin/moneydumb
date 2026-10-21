import React from 'react';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

interface TableHeaderProps {
  label: string;
  sortKey: string;
  activeKey: string | null;
  activeDirection: 'asc' | 'desc' | null;
  onClick: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function TableHeader({
  label,
  sortKey,
  activeKey,
  activeDirection,
  onClick,
  className = '',
  style = {},
}: TableHeaderProps) {
  const isSorted = activeKey === sortKey;

  const renderSortIcon = () => {
    if (!isSorted) {
      return (
        <ChevronsUpDown
          size={14}
          strokeWidth={2.0}
          className="sort-indicator-icon"
          aria-hidden="true"
          focusable="false"
          style={{ opacity: 0.35 }}
        />
      );
    }
    if (activeDirection === 'asc') {
      return (
        <ArrowUp
          size={14}
          strokeWidth={2.0}
          className="sort-indicator-icon"
          aria-hidden="true"
          focusable="false"
          style={{ color: 'var(--as-accent-primary)' }}
        />
      );
    }
    return (
      <ArrowDown
        size={14}
        strokeWidth={2.0}
        className="sort-indicator-icon"
        aria-hidden="true"
        focusable="false"
        style={{ color: 'var(--as-accent-primary)' }}
      />
    );
  };

  return (
    <th
      scope="col"
      onClick={() => onClick(sortKey)}
      className={`sortable ${isSorted ? 'active-sort' : ''} ${className}`}
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      aria-sort={isSorted ? (activeDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span>{label}</span>
        {renderSortIcon()}
      </span>
    </th>
  );
}
