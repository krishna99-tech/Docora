'use client';

import React from 'react';
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
} from 'lucide-react';
import { useAuth, useTheme } from '@/app/providers';
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

  return (
    <aside className="w-64 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-background)] text-[var(--sidebar-foreground)] flex flex-col justify-between shrink-0 min-h-screen transition-colors">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--sidebar-border)] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-black text-sm tracking-tighter">
            D
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-[var(--foreground)]">DOCORA</div>
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
              Receipt & PDF Studio
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 py-3">
          <Link href="/receipts/new">
            <Button variant="default" size="sm" className="w-full justify-start font-semibold">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Receipt
            </Button>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-md transition-colors',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Theme Switcher */}
      <div className="p-4 border-t border-[var(--sidebar-border)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[var(--secondary)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold truncate text-[var(--foreground)]">{user?.name || 'User'}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] truncate">{user?.email || ''}</div>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-red-500 rounded transition-colors w-full cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
