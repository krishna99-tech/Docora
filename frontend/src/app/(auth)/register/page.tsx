'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Create an account
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Start generating verified receipts, invoices, and automated document workflows.
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
            Full name or Business name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc. / Jane Doe"
            required
            autoFocus
            className="h-10 text-xs"
          />
        </div>

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
            className="h-10 text-xs"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
            Password (min. 8 characters)
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="h-10 text-xs"
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full h-10 font-semibold text-xs mt-2"
          isLoading={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--foreground)] underline underline-offset-4 hover:opacity-80">
          Sign in
        </Link>
      </div>
    </div>
  );
}
