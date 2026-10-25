'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration403 } from '@/components/errors/error-illustrations';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden403Page() {
  return (
    <ErrorLayout
      statusCode="403"
      badgeLabel="Access Denied"
      title="Restricted Workspace Permission"
      description="You do not have the required permissions or role within this workspace to view or modify this document or workflow."
      illustration={<Illustration403 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
      secondaryAction={{
        label: 'Browse My Documents',
        href: '/documents',
      }}
    />
  );
}
