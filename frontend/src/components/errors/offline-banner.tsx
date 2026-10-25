'use client';

import React from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 border-b border-neutral-800 text-white px-4 py-2 text-xs flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">Connection Lost:</span>
          <span className="text-neutral-300 hidden sm:inline">
            You are currently offline. Document generation and workflow triggers will resume once internet connection is restored.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Flash when back online
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-950 border-b border-emerald-900 text-emerald-300 px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-2xl animate-fade-in">
      <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="font-semibold">Connection Restored:</span>
      <span>Back online. All services are synchronized.</span>
    </div>
  );
}
