'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User as UserIcon,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  ChevronDown,
  Building2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useAuth, useTheme } from '@/app/providers';
import { Button } from '@/components/ui/button';

export function UserProfileMenu() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Compute initials from name or email
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[var(--surface-secondary)] animate-pulse border border-[var(--border)]" />
        <div className="hidden lg:block w-20 h-3 rounded bg-[var(--surface-secondary)] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="text-xs h-8">
          Sign In
        </Button>
      </Link>
    );
  }

  const initials = getInitials(user.name, user.email);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs tracking-tighter shrink-0 shadow-xs">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left max-w-[120px]">
          <span className="text-xs font-semibold text-[var(--foreground)] truncate leading-tight">
            {user.name || 'User Profile'}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)] truncate leading-none">
            Workspace
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Dropdown Panel */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-64 sm:w-72 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right focus:outline-none"
        >
          {/* User Header Details */}
          <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-start gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-[var(--foreground)] truncate">
                {user.name || 'Docora User'}
              </div>
              <div className="text-[11px] font-mono text-[var(--muted-foreground)] truncate mt-0.5">
                {user.email}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]">
                  <Building2 className="w-2.5 h-2.5 text-[var(--muted-foreground)]" />
                  Personal Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1 space-y-0.5">
            <Link
              href="/settings/profile"
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <UserIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/settings"
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Settings className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>Account Settings</span>
            </Link>

            <Link
              href="/settings/security"
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>Security Settings</span>
            </Link>

            {/* Appearance Toggle Item */}
            <button
              type="button"
              role="menuitem"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-[var(--muted-foreground)]" />
                ) : (
                  <Sun className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                {theme === 'light' ? 'Light' : 'Dark'}
              </span>
            </button>

            {/* Help & Support */}
            <button
              type="button"
              role="menuitem"
              onClick={() => setIsHelpOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
            >
              <HelpCircle className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>Help & Support</span>
            </button>
          </div>

          <div className="pt-1 border-t border-[var(--border)]">
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--foreground)]">Help & Support</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Docora Document & Workflow Automation Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[var(--foreground)]">
              <div className="p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-1">
                <div className="font-semibold">Quick Support & Documentation</div>
                <p className="text-[var(--muted-foreground)] text-[11px]">
                  Need assistance with document layout rendering, Brave browser previewing, or workflow automation?
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)]">
                  <span className="font-medium text-xs">Platform Version</span>
                  <span className="font-mono text-[11px] text-[var(--muted-foreground)]">v2.4.0 (2026 Production)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)]">
                  <span className="font-medium text-xs">PDF Engine</span>
                  <span className="font-mono text-[11px] text-[var(--muted-foreground)]">Chromedp Headless + Dual Preview</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)]">
                  <span className="font-medium text-xs">Support Email</span>
                  <span className="font-mono text-[11px] text-[var(--muted-foreground)]">support@docora.internal</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="default" onClick={() => setIsHelpOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
