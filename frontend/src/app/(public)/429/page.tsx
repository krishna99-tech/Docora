'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorLayout } from '@/components/errors/error-layout';
import { Illustration429 } from '@/components/errors/error-illustrations';
import { RotateCcw } from 'lucide-react';

function RateLimitContent() {
  const searchParams = useSearchParams();
  const retryParam = parseInt(searchParams.get('retryAfter') || '30', 10);
  const [countdown, setCountdown] = useState(isNaN(retryParam) ? 30 : retryParam);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <ErrorLayout
      statusCode="429"
      badgeLabel="Rate Limited"
      title="Too Many Requests Received"
      description={
        countdown > 0
          ? `You have exceeded the API request rate limit. Please wait ${countdown} seconds before initiating new document operations.`
          : 'Rate limit cooldown has expired. You may now safely retry your request.'
      }
      illustration={<Illustration429 className="w-44 h-44 sm:w-52 sm:h-52" />}
      primaryAction={{
        label: countdown > 0 ? `Wait (${countdown}s)` : 'Try Again Now',
        onClick: () => window.location.reload(),
        icon: RotateCcw,
      }}
      secondaryAction={{
        label: 'Go to Dashboard',
        href: '/dashboard',
      }}
      diagnosticDetails={`Rate limit threshold active. Cooldown interval: ${retryParam}s`}
    />
  );
}

export default function RateLimit429Page() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-neutral-400">Loading rate limit info...</div>}>
      <RateLimitContent />
    </Suspense>
  );
}
