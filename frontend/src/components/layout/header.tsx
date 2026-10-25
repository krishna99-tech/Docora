'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Sun, Moon, Menu, ArrowLeft } from 'lucide-react';
import { useTheme, useNavigation } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { UserProfileMenu } from '@/components/layout/user-profile-menu';
import { WorkspaceSelector } from '@/components/layout/workspace-selector';

export interface HeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: any;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export interface HeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: HeaderAction;
  children?: React.ReactNode;
}

export function Header({ title, description, backHref, action, children }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { toggleMobile } = useNavigation();

  const ActionIcon = action?.icon || Plus;

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0 transition-colors z-10 sticky top-0">
      <div className="flex items-center gap-3 min-w-0 mr-2">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 -ml-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Optional Back Button */}
        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}

        <div className="truncate">
          <h1 className="text-base sm:text-lg font-bold text-[var(--foreground)] tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-[var(--muted-foreground)] truncate hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Extra actions / toolbar buttons */}
        {children}

        {action && action.href ? (
          <Link href={action.href}>
            <Button
              size="sm"
              variant={action.variant || 'default'}
              className="text-xs px-2.5 sm:px-3 font-semibold h-8"
            >
              <ActionIcon className="w-3.5 h-3.5 sm:mr-1 shrink-0" />
              <span className="hidden xs:inline sm:inline">{action.label}</span>
            </Button>
          </Link>
        ) : action && action.onClick ? (
          <Button
            size="sm"
            variant={action.variant || 'default'}
            onClick={action.onClick}
            className="text-xs px-2.5 sm:px-3 font-semibold h-8"
          >
            <ActionIcon className="w-3.5 h-3.5 sm:mr-1 shrink-0" />
            <span className="hidden xs:inline sm:inline">{action.label}</span>
          </Button>
        ) : null}

        {/* Workspace Selector */}
        <WorkspaceSelector />

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer h-8 w-8 flex items-center justify-center shrink-0"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Profile Menu */}
        <UserProfileMenu />
      </div>
    </header>
  );
}
