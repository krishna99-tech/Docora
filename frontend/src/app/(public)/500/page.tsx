'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration500 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function Explicit500Page() {
  return (
    <ErrorLayout
      statusCode="500"
      badgeLabel="Server Error"
      title="Something Went Wrong"
      description="An unexpected server error occurred while processing document generation or workflow pipeline actions."
      illustration={<Illustration500 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Try Again',
        onClick: () => window.location.reload(),
        icon: RotateCcw,
      }}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
    />
  );
}
