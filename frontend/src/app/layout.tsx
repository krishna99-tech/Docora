import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DocAutomate – All-in-One Document Operations Platform',
  description:
    'Create, process, automate, verify, share, and manage professional documents with DocAutomate.',
  openGraph: {
    title: 'DocAutomate – Every Document. One Powerful Platform.',
    description:
      'All-in-one Document Operations Platform: document generation, PDF utilities, workflow automation, cryptographic verification, and centralized document management.',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/docautomate-icon-128.svg',
  },
};

import { OfflineBanner } from '@/components/errors/offline-banner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="docora-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('docora_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var savedPalette = localStorage.getItem('docora_palette') || 'ocean';
                  document.documentElement.setAttribute('data-palette', savedPalette);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
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
