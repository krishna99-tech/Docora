'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/providers';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-8 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0 transition-colors">
      <div>
        <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">{title}</h1>
        {description && <p className="text-xs text-[var(--muted-foreground)]">{description}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action && action.href ? (
          <Link href={action.href}>
            <Button size="sm" variant="default">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {action.label}
            </Button>
          </Link>
        ) : action && action.onClick ? (
          <Button size="sm" variant="default" onClick={action.onClick}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            {action.label}
          </Button>
        ) : null}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
