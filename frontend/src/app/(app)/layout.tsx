'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3 text-[var(--muted-foreground)]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
