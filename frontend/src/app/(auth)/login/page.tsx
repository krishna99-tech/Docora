'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Enter your credentials to access your workspaces and documents.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
            Email address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            autoFocus
            className="h-10 text-xs"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-10 text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-10 font-semibold text-xs mt-2"
          isLoading={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[var(--foreground)] underline underline-offset-4 hover:opacity-80">
          Create an account
        </Link>
      </div>
    </div>
  );
}
