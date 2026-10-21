// Renders the dashboard navigation chrome (mobile top bar, drawer backdrop, collapsible sidebar) and application shutdown dialogs/screens.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  ChevronDown,
  CalendarDays,
  Landmark,
  Coins,
  Receipt,
  CreditCard,
  PiggyBank,
  Star,
  Power,
  LogOut,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavGroup {
  label: string;
  isCollapsible?: boolean;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { to: '/dashboard/this-month', icon: CalendarDays, label: 'This Month' },
    ],
  },
  {
    label: 'Manage',
    isCollapsible: true,
    items: [
      { to: '/dashboard/accounts', icon: Landmark, label: 'Accounts' },
      { to: '/dashboard/income', icon: Coins, label: 'Income' },
      { to: '/dashboard/expenses', icon: Receipt, label: 'Expenses' },
      { to: '/dashboard/debts', icon: CreditCard, label: 'Debts' },
      { to: '/dashboard/envelopes', icon: PiggyBank, label: 'Envelopes' },
      { to: '/dashboard/wants', icon: Star, label: 'Wants' },
    ],
  },
];

interface DashboardShutdownScreenProps {
  isShutDown: boolean;
  isShuttingDown: boolean;
}

export function DashboardShutdownScreen({
  isShutDown,
  isShuttingDown,
}: DashboardShutdownScreenProps) {
  if (isShutDown) {
    return (
      <div className="shutdown-screen">
        <div className="shutdown-card">
          <div className="shutdown-icon" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center' }}>
            <Power size={52} strokeWidth={2.0} focusable="false" />
          </div>
          <h2>MONEY_DUMB Offline</h2>
          <p>The backend and frontend servers have been cleanly stopped.</p>
          <p>All database transactions are committed and your files are saved.</p>
          <p className="subtext">You can safely close this browser window now.</p>
          <button
            type="button"
            className="close-window-btn"
            onClick={() => {
              window.location.href = 'about:blank';
            }}
            aria-label="Close session"
          >
            Close Session
          </button>
        </div>
      </div>
    );
  }

  if (isShuttingDown) {
    return (
      <div className="shutdown-screen">
        <div className="shutdown-card">
          <div className="spinner" />
          <h2>Stopping Servers</h2>
          <p>Preserving state and stopping background engines...</p>
        </div>
      </div>
    );
  }

  return null;
}

interface DashboardSidebarProps {
  pathname: string;
  username: string;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  showShutdownModal: boolean;
  onToggleSidebar: () => void;
  onSetMobileMenuOpen: (open: boolean) => void;
  onSetShowShutdownModal: (open: boolean) => void;
  onLogout: () => void;
  onConfirmShutdown: () => void;
  onOpenCommandPalette: () => void;
}

export default function DashboardSidebar({
  pathname,
  username,
  sidebarCollapsed,
  mobileMenuOpen,
  showShutdownModal,
  onToggleSidebar,
  onSetMobileMenuOpen,
  onSetShowShutdownModal,
  onLogout,
  onConfirmShutdown,
  onOpenCommandPalette,
}: DashboardSidebarProps) {
  const [manageExpanded, setManageExpanded] = useState(true);
  const isCollapsed = sidebarCollapsed && !mobileMenuOpen;

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => onSetMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? (
            <X size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          ) : (
            <Menu size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" />
          )}
        </button>
        <h2 className="mobile-logo">MONEY_DUMB</h2>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
        >
          <Search size={20} strokeWidth={2.0} aria-hidden="true" focusable="false" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => onSetMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}
      >
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            ) : (
              <PanelLeftClose size={18} strokeWidth={2.0} aria-hidden="true" focusable="false" />
            )}
          </button>
          {!isCollapsed && (
            <div className="sidebar-logo">
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                MONEY_DUMB
              </h1>
              <span>Financial Command Center</span>
            </div>
          )}
        </div>

        {/* User Profile Info Card */}
        <div
          className="user-profile-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '12px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--as-border-subtle)',
            marginBottom: '8px',
            marginTop: '4px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            overflow: 'hidden',
          }}
          title={isCollapsed ? `Active User: ${username || 'Loading...'}` : undefined}
        >
          <span
            style={{
              color: 'var(--as-accent-primary)',
              background: 'var(--as-accent-muted)',
              padding: '6px',
              borderRadius: 'var(--as-radius-pill)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <User size={16} strokeWidth={2.0} focusable="false" />
          </span>
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--as-text-primary)',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {username || 'Loading...'}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--as-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Active Identity
              </span>
            </div>
          )}
        </div>

        <nav>
          {navGroups.map((group) => {
            const isManager = group.isCollapsible;
            const expanded = isManager ? manageExpanded : true;
            return (
              <div key={group.label} className="nav-group">
                <div
                  className={`nav-group-label ${isManager ? 'collapsible' : ''}`}
                  onClick={() => isManager && setManageExpanded(!manageExpanded)}
                >
                  <span style={{ flex: 1 }}>{group.label}</span>
                  {isManager && (
                    <span
                      className="chevron"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: manageExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--as-duration-normal) var(--as-ease-snap)',
                      }}
                      aria-hidden="true"
                    >
                      <ChevronDown size={14} strokeWidth={2.0} focusable="false" />
                    </span>
                  )}
                </div>
                <div className={`nav-group-content ${expanded ? 'expanded' : ''}`}>
                  <div className="nav-group-inner">
                    {group.items.map((item) => {
                      const isActive = pathname === item.to;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          href={item.to}
                          className={isActive ? 'active' : ''}
                          title={isCollapsed ? item.label : undefined}
                          aria-label={isCollapsed ? item.label : undefined}
                        >
                          <span className="nav-icon" aria-hidden="true">
                            <Icon size={18} strokeWidth={2.0} focusable="false" />
                          </span>
                          {!isCollapsed && <span className="nav-label">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout & Shutdown */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <button
              type="button"
              className="shutdown-btn"
              onClick={onLogout}
              aria-label="Log out"
              style={{
                color: 'var(--as-text-muted)',
                background: 'transparent',
                border: '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '10px 16px',
                borderRadius: 'var(--as-radius-md)',
              }}
            >
              <span className="nav-icon" style={{ color: 'var(--as-text-muted)' }} aria-hidden="true">
                <LogOut size={18} strokeWidth={2.0} focusable="false" />
              </span>
              <span className="nav-label">Log Out</span>
            </button>
          )}
          <button
            type="button"
            className="shutdown-btn"
            onClick={() => onSetShowShutdownModal(true)}
            aria-label="Shut down application"
            title={isCollapsed ? 'Shut down application' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">
              <Power size={18} strokeWidth={2.0} focusable="false" />
            </span>
            {!isCollapsed && <span className="nav-label">Shut Down</span>}
          </button>
        </div>
      </aside>

      {/* Shutdown Confirmation Modal */}
      {showShutdownModal && (
        <div className="modal-overlay" onClick={() => onSetShowShutdownModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle
                size={22}
                strokeWidth={2.0}
                style={{ color: 'var(--as-status-warning)', marginRight: 8 }}
                aria-hidden="true"
                focusable="false"
              />
              <h3>Shutdown Application?</h3>
            </div>
            <p
              style={{
                marginTop: 8,
                color: 'var(--as-text-secondary)',
                fontSize: '0.85rem',
                lineHeight: '1.5',
              }}
            >
              This will safely shut down the database engine and cleanly terminate your local session parameters.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onSetShowShutdownModal(false)}
                aria-label="Cancel shutdown"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirmShutdown}
                aria-label="Confirm application shutdown"
                style={{
                  background: 'var(--as-status-error)',
                  borderColor: 'var(--as-status-error)',
                  color: '#fff',
                }}
              >
                Shut Down
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
