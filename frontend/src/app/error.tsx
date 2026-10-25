'use client';

import React, { useEffect } from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration500 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Safely log error without leaking sensitive credentials
    console.error('Docora application runtime error:', error);
  }, [error]);

  const sanitizedDigest = error.digest ? `Reference ID: ${error.digest}` : undefined;

  return (
    <ErrorLayout
      statusCode="500"
      badgeLabel="Server Error"
      title="Something Went Wrong"
      description="An unexpected error occurred while processing your document request. Our automated diagnostics have recorded the incident."
      illustration={<Illustration500 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Try Again',
        onClick: () => reset(),
        icon: RotateCcw,
      }}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
      diagnosticDetails={sanitizedDigest}
    />
  );
}
