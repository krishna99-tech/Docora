'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email') || 'your email';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulated dummy validation
    setTimeout(() => {
      setIsVerifying(false);
      // For demo, accept any 6 digits (e.g. 123456)
      router.push('/reset-password');
    }, 700);
  };

  const handleResend = () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResendCooldown(45);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Verify email code
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Enter the 6-digit verification code sent to{' '}
          <strong className="text-[var(--foreground)] font-mono">{emailParam}</strong>.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        {/* 6 Digit Input Group */}
        <div className="flex justify-between items-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              autoFocus={index === 0}
              className="w-11 h-13 sm:w-13 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all shadow-sm"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-10 font-semibold text-xs"
          isLoading={isVerifying}
        >
          {isVerifying ? 'Verifying code...' : 'Verify & Continue'} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      {/* Resend Action */}
      <div className="text-center text-xs text-[var(--muted-foreground)]">
        Didn&apos;t receive the code?{' '}
        {resendCooldown > 0 ? (
          <span className="font-mono text-neutral-500">Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-[var(--foreground)] hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} /> Resend code
          </button>
        )}
      </div>

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

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="text-xs text-[var(--muted-foreground)] text-center py-8">Loading verification...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
