'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulated delay for dummy flow
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Reset password
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Enter your email address and we&apos;ll send you a 6-digit verification code.
        </p>
      </div>

      {isSubmitted ? (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-emerald-300">Verification code sent</p>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                We sent a 6-digit one-time code to <strong className="font-mono text-white">{email}</strong>.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(email)}`)}
            className="w-full h-10 font-semibold text-xs"
          >
            Enter Verification Code <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline underline-offset-4"
            >
              Use a different email address
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                autoFocus
                className="h-10 text-xs pr-9"
              />
              <Mail className="w-4 h-4 text-[var(--muted-foreground)] absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-10 font-semibold text-xs mt-2"
            isLoading={isLoading}
          >
            {isLoading ? 'Sending code...' : 'Send Verification Code'} <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-[var(--foreground)] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
