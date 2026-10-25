'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration401 } from '@/components/errors/error-illustrations';
import { LogIn } from 'lucide-react';

export default function Unauthorized401Page() {
  return (
    <ErrorLayout
      statusCode="401"
      badgeLabel="Session Expired"
      title="Authentication Required"
      description="Your session has expired or you need to be signed in to access this document generation resource."
      illustration={<Illustration401 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Sign In to Account',
        href: '/login',
        icon: LogIn,
      }}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
    />
  );
}
