'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Lock,
  Download,
  AlertCircle,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SharedDocInfo {
  id: string;
  title: string;
  documentType: string;
  allowDownload: boolean;
  watermarkText: string;
  requiresPassword: boolean;
  expiresAt?: string;
}

function ShareContent() {
  const params = useParams();
  const token = params?.token as string;

  const [info, setInfo] = useState<SharedDocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password state
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [accessing, setAccessing] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/v1/public/share/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'This link has expired, reached its limit, or does not exist.');
        }
        return res.json();
      })
      .then((data: SharedDocInfo) => {
        setInfo(data);
        setLoading(false);
        if (!data.requiresPassword) {
          fetchPdf('');
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const fetchPdf = async (pwd: string) => {
    setAccessing(true);
    setPasswordError(null);

    try {
      const res = await fetch(`/api/v1/public/share/${token}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Invalid password or link inaccessible.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setUnlocked(true);
    } catch (err: any) {
      setPasswordError(err.message || 'Access denied');
    } finally {
      setAccessing(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    fetchPdf(password);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-black text-sm">
            D
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-white">DOCORA SECURE SHARE</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Document Operations Platform</div>
          </div>
        </div>

        {unlocked && info?.allowDownload && pdfBlobUrl && (
          <a
            href={pdfBlobUrl}
            download={`${info.title || 'document'}.pdf`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto my-6 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-neutral-400">Verifying secure link access...</p>
          </div>
        ) : error ? (
          <div className="border border-red-900/60 bg-red-950/20 rounded-2xl p-8 max-w-md mx-auto text-center">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-200 mb-2">Link Inaccessible</h2>
            <p className="text-xs text-neutral-400 mb-6">{error}</p>
            <Link
              href="/"
              className="text-xs px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-medium"
            >
              Return Home
            </Link>
          </div>
        ) : !unlocked ? (
          /* Password Form */
          <div className="max-w-md w-full mx-auto border border-neutral-800 bg-neutral-900/60 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-neutral-200" />
            </div>
            <h1 className="text-xl font-bold text-center text-white mb-1">Protected Document</h1>
            <p className="text-xs text-neutral-400 text-center mb-6">
              This document is protected with a password. Please enter the password to view the document.
            </p>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="Enter document password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600"
                  required
                />
              </div>

              {passwordError && (
                <div className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-900/50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={accessing}
                className="w-full bg-white text-black hover:bg-neutral-200 font-semibold"
              >
                {accessing ? 'Unlocking...' : 'Unlock Document'} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        ) : (
          /* Unlocked PDF Viewer */
          <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/80 flex-1 flex flex-col">
            <div className="p-3.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-300" />
                <span className="font-semibold text-neutral-200">{info?.title || 'Shared Document'}</span>
              </div>
              {info?.watermarkText && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Watermarked: {info.watermarkText}
                </span>
              )}
            </div>

            {pdfBlobUrl && (
              <div className="flex-1 min-h-[70vh] bg-neutral-950">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0`}
                  className="w-full h-full min-h-[70vh] border-0"
                  title="Shared Document Viewer"
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto pt-4 border-t border-neutral-800 text-center text-xs text-neutral-600">
        &copy; {new Date().getFullYear()} Docora. Secure end-to-end document sharing.
      </footer>
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
          Loading document...
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
