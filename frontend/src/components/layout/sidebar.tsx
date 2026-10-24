'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Palette,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  PlusCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth, useTheme, useNavigation } from '@/app/providers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Receipts', href: '/receipts', icon: Receipt },
  { label: 'Invoices', href: '/invoices', icon: FileSpreadsheet },
  { label: 'PDF Generator', href: '/pdf-generator', icon: FileText },
  { label: 'Documents', href: '/documents', icon: FolderArchive },
  { label: 'Templates', href: '/templates', icon: Palette },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    isMobileOpen,
    closeMobile,
    isTabletCollapsed,
    toggleTabletCollapse,
  } = useNavigation();

  // Close mobile drawer on route change or Escape
  useEffect(() => {
    closeMobile();
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // Sidebar content markup
  const renderNav = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 border-b border-[var(--sidebar-border)]">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-black text-sm tracking-tighter shrink-0">
              D
            </div>
            {(!isTabletCollapsed || isMobile) && (
              <div className="truncate">
                <div className="font-extrabold text-sm tracking-tight text-[var(--foreground)]">DOCORA</div>
                <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                  Receipt & PDF Studio
                </div>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              onClick={closeMobile}
              className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={toggleTabletCollapse}
              className="hidden md:flex lg:hidden p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              title={isTabletCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label="Toggle compact sidebar"
            >
              {isTabletCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <Link href="/receipts/new" onClick={() => { if (isMobile) closeMobile(); }}>
            <Button
              variant="default"
              size="sm"
              className={cn(
                'w-full font-semibold transition-all min-h-[40px]',
                isTabletCollapsed && !isMobile ? 'px-0 justify-center' : 'justify-start'
              )}
              title="Create New Receipt"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              {(!isTabletCollapsed || isMobile) && <span className="ml-2 truncate">New Receipt</span>}
            </Button>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="px-2 sm:px-3 py-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => { if (isMobile) closeMobile(); }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 sm:py-2 text-xs font-semibold rounded-md transition-colors min-h-[40px] sm:min-h-0',
                  isTabletCollapsed && !isMobile ? 'justify-center px-2' : '',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!isTabletCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Theme Switcher */}
      <div className="p-3 sm:p-4 border-t border-[var(--sidebar-border)] flex flex-col gap-2">
        <div className={cn('flex items-center', isTabletCollapsed && !isMobile ? 'justify-center' : 'justify-between')}>
          {(!isTabletCollapsed || isMobile) && (
            <div className="flex items-center gap-2 overflow-hidden mr-2">
              <div className="w-8 h-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)] shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold truncate text-[var(--foreground)]">{user?.name || 'User'}</div>
                <div className="text-[11px] text-[var(--muted-foreground)] truncate">{user?.email || ''}</div>
              </div>
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 sm:p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-2 px-2 py-2 sm:py-1.5 text-xs text-[var(--muted-foreground)] hover:text-red-500 rounded transition-colors w-full cursor-pointer min-h-[38px] sm:min-h-0',
            isTabletCollapsed && !isMobile ? 'justify-center px-0' : ''
          )}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {(!isTabletCollapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Persistent Sidebar */}
      <aside
        className={cn(
          'hidden md:flex border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] flex-col justify-between shrink-0 min-h-screen transition-all duration-200 z-20',
          isTabletCollapsed ? 'w-16' : 'w-60 lg:w-64'
        )}
      >
        {renderNav(false)}
      </aside>

      {/* 2. Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Off-Canvas Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--sidebar-background)] border-r border-[var(--sidebar-border)] text-[var(--sidebar-foreground)] md:hidden shadow-2xl transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderNav(true)}
      </aside>
    </>
  );
}
