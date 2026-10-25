'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration408 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

export default function Timeout408Page() {
  return (
    <ErrorLayout
      statusCode="408"
      badgeLabel="Request Timeout"
      title="The Request Took Too Long"
      description="The server closed the connection because the document compilation or file conversion took longer than expected to finish."
      illustration={<Illustration408 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Retry Operation',
        onClick: () => window.location.reload(),
        icon: RotateCcw,
      }}
      secondaryAction={{
        label: 'Return to Safety',
        href: '/dashboard',
      }}
    />
  );
}
