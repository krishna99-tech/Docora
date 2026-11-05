'use client';

import React, { useEffect } from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration500 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function AppRouteErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('DocAutomate workspace runtime error:', error);
  }, [error]);

  const diagnosticDetails = {
    message: error.message || 'An unexpected runtime error occurred.',
    digest: error.digest || 'N/A',
  };

  return (
    <div className="py-8 px-4 flex items-center justify-center">
      <ErrorLayout
        statusCode="500"
        badgeLabel="Workspace Error"
        title="Unable to Load Document View"
        description="A runtime issue occurred in this workspace view. You can reload the component or return to the overview."
        illustration={<Illustration500 className="w-36 h-36 sm:w-44 sm:h-44" />}
        primaryAction={{
          label: 'Retry View',
          onClick: () => reset(),
          icon: RotateCcw,
        }}
        secondaryAction={{
          label: 'Back to Dashboard',
          href: '/dashboard',
        }}
        diagnosticDetails={diagnosticDetails}
      />
    </div>
  );
}

