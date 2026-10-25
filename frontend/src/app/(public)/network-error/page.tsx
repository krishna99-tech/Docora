'use client';

import React from 'react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { IllustrationNetworkError } from '@/components/errors/error-illustrations';
import { RefreshCw } from 'lucide-react';

export default function NetworkErrorPage() {
  return (
    <ErrorLayout
      statusCode="OFFLINE"
      badgeLabel="Network Disconnected"
      title="Unable to Reach Docora Server"
      description="Your browser could not establish a connection to the application server. Check your network cables, WiFi connection, or firewall settings."
      illustration={<IllustrationNetworkError className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: 'Retry Connection',
        onClick: () => window.location.reload(),
        icon: RefreshCw,
      }}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
    />
  );
}
