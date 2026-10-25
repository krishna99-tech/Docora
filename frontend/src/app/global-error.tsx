'use client';

import React from 'react';
import './globals.css';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration500 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ErrorLayout
          statusCode="500"
          badgeLabel="Global Failure"
          title="Critical Application Error"
          description="A critical failure interrupted the application shell. Please retry reloading the document platform."
          illustration={<Illustration500 className="w-44 h-44 sm:w-52 sm:h-52" />}
          primaryAction={{
            label: 'Reload Application',
            onClick: () => reset(),
            icon: RotateCcw,
          }}
          diagnosticDetails={error.digest ? `Crash Digest: ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
