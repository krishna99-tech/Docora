'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Shield,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Key,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

export default function UserProfilePage() {
  const { user, updateUserProfile, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync user data when loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Display name cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      await updateUserProfile({ name: name.trim() });
      setSuccessMessage('Profile name updated successfully');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (displayName?: string, email?: string) => {
    if (displayName && displayName.trim()) {
      const parts = displayName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return displayName.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="My Profile" description="Loading profile information..." backHref="/settings" />
        <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">
          Loading user profile...
        </div>
      </div>
    );
  }

  const initials = getInitials(user?.name, user?.email);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="My Profile"
        description="Manage your user identity, verified credentials, and workspace information"
        backHref="/settings"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Link
            href="/settings/profile"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Business Workspace
          </Link>
          <Link
            href="/settings/workspaces"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Team & Members
          </Link>
          <Link
            href="/settings/security"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Security & Password
          </Link>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Identity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Public Profile Identity</CardTitle>
            <CardDescription>
              Your avatar, display name, and verified system identifiers
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-[var(--border)]">
            <div className="w-20 h-20 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-black text-2xl tracking-tighter shrink-0 shadow-md">
              {initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {user?.name || 'Docora User'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Active
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--muted-foreground)]">{user?.email}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--muted-foreground)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Member since {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}</span>
              </div>
            </div>
          </div>

          {/* Editable Display Name Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-4">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                Display Name (Editable)
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="h-10 text-xs max-w-md"
              />
              <span className="text-[11px] text-[var(--muted-foreground)] block mt-1">
                This name is displayed across invoices, receipts, and workflow activity logs.
              </span>
            </div>

            {/* Protected Email Field */}
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                Email Address (Protected Primary Identifier)
              </label>
              <div className="relative max-w-md">
                <Input
                  value={user?.email || ''}
                  disabled
                  className="h-10 text-xs bg-[var(--surface-secondary)] text-[var(--muted-foreground)] cursor-not-allowed pr-24"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified
                </span>
              </div>
              <span className="text-[11px] text-[var(--muted-foreground)] block mt-1">
                Your email is used for cryptographic JWT authorization and cannot be changed without re-verifying credentials.
              </span>
            </div>

            <div className="flex items-center justify-start gap-3 pt-2">
              <Button type="submit" variant="default" isLoading={isSaving} className="text-xs h-9">
                <Save className="w-3.5 h-3.5 mr-1" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Workspace & Security Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[var(--foreground)]">Workspace Organization</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Personal Workspace &bull; Role: <strong>Owner / Administrator</strong>
                </p>
                <div className="pt-2">
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Configure Business Info
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-[var(--foreground)]">Security & Credentials</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Password protected &bull; JWT HMAC-SHA256 Token Session
                </p>
                <div className="pt-2">
                  <Link href="/settings/security">
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Manage Password
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
