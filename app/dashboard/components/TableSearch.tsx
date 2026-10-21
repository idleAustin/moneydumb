'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function TableSearch({
  searchQuery,
  setSearchQuery,
  isOpen,
  setIsOpen,
}: TableSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="table-search-container" ref={containerRef}>
      <div className="tooltip-wrapper">
        <button
          type="button"
          className={`table-search-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Search table"
        >
          <Search size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </button>
        {!isOpen && (
          <div className="tooltip-bubble" role="tooltip">
            <span>Search table</span>
            <span className="tooltip-kbd">Filter</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="table-search-popup fade-in">
          <Search
            size={14}
            strokeWidth={2.0}
            className="search-popup-icon"
            aria-hidden="true"
            focusable="false"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            placeholder="Search..."
            aria-label="Search table query"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
