'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Laptop,
  Clock,
  Shield,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';

export default function SecuritySettingsPage() {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.changePassword({ currentPassword, newPassword });
      setSuccessMsg(res.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Security & Password"
        description="Manage your account password, active sessions, and cryptographic credential settings"
        backHref="/settings"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Link
            href="/settings/profile"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
          >
            Security & Password
          </Link>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[var(--muted-foreground)]" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your account password. Must contain at least 8 characters.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="h-10 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                className="h-10 text-xs"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="default" isLoading={isSubmitting} className="text-xs h-9">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Update Password
              </Button>
            </div>
          </form>
        </Card>

        {/* Active Session & Authentication Security Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
              <CardTitle>Session Security & Cryptography</CardTitle>
            </div>
            <CardDescription>
              Status of your active cryptographic JWT tokens and session rotation
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface)] text-[var(--foreground)] shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[var(--foreground)]">Current Active Session</div>
                  <div className="text-[11px] font-mono text-[var(--muted-foreground)]">
                    Identity: {user?.email} &bull; Token: Bearer JWT
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Authenticated &amp; Protected
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-xs text-red-500 hover:text-red-600 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-[var(--border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                  Token Algorithm
                </span>
                <span className="font-mono font-bold text-xs mt-1 block">HMAC-SHA256</span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                  Token Rotation
                </span>
                <span className="font-semibold text-xs mt-1 block">Automatic on Refresh</span>
              </div>
              <div className="p-3 rounded-xl border border-[var(--border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                  Brute-Force Guard
                </span>
                <span className="font-semibold text-xs mt-1 block">Rate-Limited (Bcrypt Cost 10)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
