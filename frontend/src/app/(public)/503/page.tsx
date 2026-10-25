'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration503 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function ServiceUnavailable503Page() {
  return (
    <ErrorLayout
      statusCode="503"
      badgeLabel="Service Unavailable"
      title="Temporarily Offline for Optimization"
      description="The document processing engine is temporarily experiencing high capacity or undergoing system upgrades. Please try again shortly."
      illustration={<Illustration503 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Retry Connection',
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
