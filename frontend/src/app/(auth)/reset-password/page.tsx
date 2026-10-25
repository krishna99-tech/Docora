'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Lock, AlertCircle, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulated dummy reset
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Set new password
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Choose a secure, strong password for your Docora workspace.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-300">Password successfully updated</p>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                Your credentials have been securely updated. You can now sign in with your new password.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full h-10 font-semibold text-xs"
          >
            Sign In with New Password <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              className="h-10 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-10 text-xs"
            />
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1.5 text-[11px]">
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
              <Check className="w-3.5 h-3.5" />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
              <Check className="w-3.5 h-3.5" />
              <span>Contains at least one number</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}`}>
              <Check className="w-3.5 h-3.5" />
              <span>Passwords match</span>
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-10 font-semibold text-xs mt-2"
            isLoading={isLoading}
          >
            {isLoading ? 'Updating password...' : 'Update Password'} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        <Link
          href="/login"
          className="font-semibold text-[var(--foreground)] underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Cancel and return to Sign In
        </Link>
      </div>
    </div>
  );
}
