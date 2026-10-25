import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Docora | Professional Receipt & PDF Generator',
  description: 'Enterprise receipt, invoice, and PDF document generator and management platform.',
};

import { OfflineBanner } from '@/components/errors/offline-banner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <OfflineBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
