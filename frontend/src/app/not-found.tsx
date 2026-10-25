'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration404 } from '@/components/errors/error-illustrations';

export default function NotFoundPage() {
  return (
    <ErrorLayout
      statusCode="404"
      badgeLabel="Page Not Found"
      title="The Document or Route Does Not Exist"
      description="The page or resource you are looking for might have been removed, had its name changed, or is temporarily unavailable in your workspace."
      illustration={<Illustration404 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
      secondaryAction={{
        label: 'Browse Documents',
        href: '/documents',
      }}
    />
  );
}
