'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-black text-xl mb-3 shadow-sm">
            D
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">DOCORA</h1>
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mt-1">
            Receipt & PDF Studio
          </p>
        </div>

        <Card className="border border-[var(--border)] shadow-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Start issuing receipts, invoices, and professional PDFs</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
                {error}
              </div>
            )}

            <Input
              label="Full Name or Business Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc. / John Doe"
              required
              autoFocus
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              required
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="default" className="w-full font-semibold" isLoading={isLoading}>
              Register
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[var(--foreground)] hover:underline">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
