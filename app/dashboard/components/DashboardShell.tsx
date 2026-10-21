// Orchestrates the dashboard application shell, user session hydration, top telemetry bar, and interactive ⌘K command palette.
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PanelLeft,
  CalendarDays,
  Landmark,
  Coins,
  Receipt,
  CreditCard,
  PiggyBank,
  Star,
  Power,
  LogOut,
  Search,
  type LucideIcon,
} from 'lucide-react';
import '../index.css';
import DashboardSidebar, { DashboardShutdownScreen } from './DashboardSidebar';

function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved === 'true') {
        queueMicrotask(() => {
          setSidebarCollapsed(true);
        });
      }
    }
  }, []);
  const [username, setUsername] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Command palette state
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const cmdListRef = useRef<HTMLDivElement>(null);

  // Shutdown state
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isShutDown, setIsShutDown] = useState(false);

  // Close menus on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setCmdOpen(false);
  }

  useEffect(() => {
    axios
      .get('/api/auth/me')
      .then((res) => {
        if (res.data && res.data.username) {
          setUsername(res.data.username);
        }
      })
      .catch((err) => console.error('Failed to load user session info:', err));
  }, []);

  // Keyboard shortcut listener for Command Palette (Cmd/Ctrl + K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => {
          if (!prev) {
            setCmdSearch('');
            setSelectedIndex(0);
          }
          return !prev;
        });
      } else if (e.key === 'Escape' && cmdOpen) {
        e.preventDefault();
        setCmdOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cmdOpen]);

  // Autofocus input and manage scroll lock when Command Palette opens
  useEffect(() => {
    if (cmdOpen) {
      const timer = setTimeout(() => {
        cmdInputRef.current?.focus();
      }, 20);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [cmdOpen]);

  // Scroll active command item into view
  useEffect(() => {
    if (cmdOpen && cmdListRef.current) {
      const activeEl = cmdListRef.current.querySelector('.cmd-item.selected') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, cmdOpen]);

  const toggleSidebar = () => {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const handleShutdown = async () => {
    setIsShuttingDown(true);
    setShowShutdownModal(false);
    try {
      await axios.post('/api/shutdown');
    } catch {
      console.log('Shutdown request paused (offline mode simulated).');
    }
    setTimeout(() => {
      setIsShuttingDown(false);
      setIsShutDown(true);
    }, 1200);
  };

  const handleLogout = async () => {
    try {
      clearSessionCookie();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Command palette items
  interface CommandItem {
    id: string;
    label: string;
    category: 'Navigation' | 'Quick Commands';
    icon: LucideIcon;
    perform: () => void;
    keywords?: string[];
    shortcut?: string;
  }

  const commandItems: CommandItem[] = [
    { id: 'nav-this-month', label: 'This Month', category: 'Navigation', icon: CalendarDays, perform: () => { router.push('/dashboard/this-month'); setCmdOpen(false); }, keywords: ['matrix', 'calendar', 'monthly', 'cashflow'], shortcut: '↵' },
    { id: 'nav-accounts', label: 'Accounts', category: 'Navigation', icon: Landmark, perform: () => { router.push('/dashboard/accounts'); setCmdOpen(false); }, keywords: ['banks', 'balances', 'institutions'], shortcut: '↵' },
    { id: 'nav-income', label: 'Income', category: 'Navigation', icon: Coins, perform: () => { router.push('/dashboard/income'); setCmdOpen(false); }, keywords: ['paycheck', 'salary', 'allocations'], shortcut: '↵' },
    { id: 'nav-expenses', label: 'Expenses', category: 'Navigation', icon: Receipt, perform: () => { router.push('/dashboard/expenses'); setCmdOpen(false); }, keywords: ['spending', 'bills', 'outflow'], shortcut: '↵' },
    { id: 'nav-debts', label: 'Debts', category: 'Navigation', icon: CreditCard, perform: () => { router.push('/dashboard/debts'); setCmdOpen(false); }, keywords: ['snowball', 'avalanche', 'credit', 'loans'], shortcut: '↵' },
    { id: 'nav-envelopes', label: 'Envelopes', category: 'Navigation', icon: PiggyBank, perform: () => { router.push('/dashboard/envelopes'); setCmdOpen(false); }, keywords: ['budget', 'categories', 'sinking'], shortcut: '↵' },
    { id: 'nav-wants', label: 'Wants', category: 'Navigation', icon: Star, perform: () => { router.push('/dashboard/wants'); setCmdOpen(false); }, keywords: ['wishlist', 'discretionary', 'ai'], shortcut: '↵' },
    { id: 'action-toggle-sidebar', label: 'Toggle Sidebar', category: 'Quick Commands', icon: PanelLeft, perform: () => { toggleSidebar(); setCmdOpen(false); }, keywords: ['collapse', 'expand', 'navigation'], shortcut: '↵' },
    { id: 'action-logout', label: 'Log Out', category: 'Quick Commands', icon: LogOut, perform: () => { setCmdOpen(false); handleLogout(); }, keywords: ['exit', 'sign out', 'session'], shortcut: '↵' },
    { id: 'action-shutdown', label: 'Shut Down Application', category: 'Quick Commands', icon: Power, perform: () => { setCmdOpen(false); setShowShutdownModal(true); }, keywords: ['stop', 'server', 'power off', 'kill'], shortcut: '↵' },
  ];

  const query = cmdSearch.trim().toLowerCase();
  const filteredItems = commandItems.filter((item) => {
    if (!query) return true;
    return (
      item.label.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.keywords && item.keywords.some((kw) => kw.toLowerCase().includes(query)))
    );
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].perform();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCmdOpen(false);
    }
  };

  if (isShutDown || isShuttingDown) {
    return <DashboardShutdownScreen isShutDown={isShutDown} isShuttingDown={isShuttingDown} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <DashboardSidebar
        pathname={pathname}
        username={username}
        sidebarCollapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        showShutdownModal={showShutdownModal}
        onToggleSidebar={toggleSidebar}
        onSetMobileMenuOpen={setMobileMenuOpen}
        onSetShowShutdownModal={setShowShutdownModal}
        onLogout={handleLogout}
        onConfirmShutdown={handleShutdown}
        onOpenCommandPalette={() => {
          setCmdSearch('');
          setSelectedIndex(0);
          setCmdOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className={`main-content ${sidebarCollapsed ? 'main-content-expanded' : ''}`}>
        {/* Top Telemetry Header Bar */}
        <div className="top-telemetry-bar">
          <div
            className="status-badge"
            role="status"
            aria-label="Engine status: idle, but operational"
          >
            <span className="status-dot" aria-hidden="true" />
            <span>idleAustin (idle, but operational)</span>
          </div>

          <button
            type="button"
            className="cmd-trigger-btn"
            onClick={() => {
              setCmdSearch('');
              setSelectedIndex(0);
              setCmdOpen(true);
            }}
            aria-label="Quick Find or Jump (Press Cmd+K)"
            title="Quick Find / Jump (⌘K)"
          >
            <Search size={14} className="cmd-trigger-icon" aria-hidden="true" focusable="false" />
            <span className="cmd-trigger-label">Quick Find / Jump</span>
            <kbd className="kbd" aria-hidden="true">⌘K</kbd>
          </button>
        </div>

        {children}
      </main>

      {/* Interactive ⌘K Command Palette Modal */}
      {cmdOpen && (
        <>
          <div
            className="cmd-palette-backdrop"
            onClick={() => setCmdOpen(false)}
            aria-hidden="true"
          />
          <div
            className="cmd-palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cmd-search-bar">
              <Search size={16} strokeWidth={2.0} aria-hidden="true" focusable="false" />
              <input
                ref={cmdInputRef}
                type="text"
                className="cmd-search-input"
                placeholder="Type a command or jump to route..."
                value={cmdSearch}
                onChange={(e) => {
                  setCmdSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                autoFocus
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-autocomplete="list"
                aria-activedescendant={filteredItems[selectedIndex] ? `cmd-item-${filteredItems[selectedIndex].id}` : undefined}
                aria-label="Search commands or routes"
              />
              <span className="kbd">ESC</span>
            </div>

            <div
              id="cmd-list"
              className="cmd-list"
              role="listbox"
              ref={cmdListRef}
              aria-label="Command suggestions"
            >
              {filteredItems.length === 0 ? (
                <div className="cmd-empty-state">Nothing here yet.</div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === index;
                  return (
                    <div
                      key={item.id}
                      id={`cmd-item-${item.id}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`cmd-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => item.perform()}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="cmd-item-left">
                        <Icon size={14} strokeWidth={2.0} aria-hidden="true" focusable="false" />
                        <span className="cmd-item-label">{item.label}</span>
                        <span className="cmd-item-category">{item.category}</span>
                      </div>
                      <span className="kbd">{item.shortcut || '↵'}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="cmd-footer">
              <div className="cmd-footer-shortcuts">
                <span><span className="kbd">↑</span> <span className="kbd">↓</span> Navigate</span>
                <span><span className="kbd">↵</span> Select</span>
                <span><span className="kbd">ESC</span> Close</span>
              </div>
              <span>idleAustin</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
