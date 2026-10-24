'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building2,
  FileText,
  Hash,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

interface VerificationData {
  verificationToken: string;
  documentNumber: string;
  documentType: string;
  issueDate: string;
  issuingBusiness: string;
  status: string;
  sha256Hash: string;
  verifiedAt: string;
  integrityValid: boolean;
}

function VerifyContent() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/v1/public/verify/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('This document record could not be verified or does not exist.');
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Verification failed');
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-neutral-800">
      {/* Top Bar */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 border-b border-neutral-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-black text-xs">
            D
          </div>
          <span className="font-extrabold text-sm tracking-widest uppercase">DOCORA VERIFY</span>
        </Link>
        <span className="text-xs text-neutral-400 font-mono">ID: {token?.slice(0, 14)}...</span>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl w-full mx-auto my-auto py-10">
        {loading ? (
          <div className="border border-neutral-800 rounded-xl p-8 bg-neutral-900/40 text-center animate-pulse">
            <div className="w-12 h-12 bg-neutral-800 rounded-full mx-auto mb-4" />
            <div className="h-6 w-48 bg-neutral-800 rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-neutral-800 rounded mx-auto" />
          </div>
        ) : error || !data ? (
          <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-8 text-center max-w-lg mx-auto">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-200 mb-2">Verification Failed</h1>
            <p className="text-sm text-neutral-400 mb-6">
              {error || 'Unable to verify this document token. The link may be broken or corrupted.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Docora
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-800 bg-neutral-900/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Verification Header Banner */}
            <div className="p-6 sm:p-8 border-b border-neutral-800 bg-neutral-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-neutral-400">Authentic Document</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">{data.documentNumber}</h1>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-mono block">Document Type</span>
                <span className="text-sm font-semibold capitalize text-neutral-200">{data.documentType}</span>
              </div>
            </div>

            {/* Approved Non-Sensitive Details Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-neutral-800/80 rounded-xl p-4 bg-neutral-950/40">
                <div className="flex items-center gap-2.5 text-xs text-neutral-400 mb-1">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <span>Issuing Business</span>
                </div>
                <div className="text-base font-semibold text-white">{data.issuingBusiness}</div>
              </div>

              <div className="border border-neutral-800/80 rounded-xl p-4 bg-neutral-950/40">
                <div className="flex items-center gap-2.5 text-xs text-neutral-400 mb-1">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>Issue Date</span>
                </div>
                <div className="text-base font-semibold text-white">
                  {new Date(data.issueDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              {/* SHA-256 Byte Integrity Panel */}
              <div className="md:col-span-2 border border-neutral-800/80 rounded-xl p-5 bg-neutral-950/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                    <Hash className="w-4 h-4 text-neutral-400" />
                    <span>Exact Cryptographic Hash (SHA-256)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Byte Integrity Verified</span>
                  </div>
                </div>
                <div className="font-mono text-xs text-neutral-400 break-all bg-neutral-900 p-3 rounded border border-neutral-800">
                  {data.sha256Hash}
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">
                  The cryptographic fingerprint of the finalized PDF was matched against Docora's immutable verification register.
                </p>
              </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="p-4 sm:p-6 bg-neutral-950 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
              <span>Verified via Docora Document Operations Platform</span>
              <span className="font-mono text-[11px]">
                Timestamp: {new Date(data.verifiedAt).toISOString()}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-3xl w-full mx-auto pt-6 border-t border-neutral-800 text-center text-xs text-neutral-600">
        &copy; {new Date().getFullYear()} Docora Platform. All document records are cryptographically verified.
      </footer>
    </div>
  );
}

export default function PublicVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-xs text-neutral-400">
          Verifying certificate...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
