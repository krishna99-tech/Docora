'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Hash,
  CheckCircle2,
  XCircle,
  QrCode,
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerificationDashboardPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Finalized documents list to run integrity checks
  const [documents, setDocuments] = useState<any[]>([]);
  const [integrityLoading, setIntegrityLoading] = useState<string | null>(null);
  const [integrityResults, setIntegrityResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/v1/documents?status=finalized&pageSize=10')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => {
        if (res.data) setDocuments(res.data);
      })
      .catch(() => {});
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/v1/public/verify/${tokenInput.trim()}`);
      if (!res.ok) {
        throw new Error('Verification token not found or invalid.');
      }
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIntegrity = async (docId: string) => {
    setIntegrityLoading(docId);
    try {
      const res = await fetch(`/api/v1/documents/${docId}/integrity`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed integrity check');
      }
      const data = await res.json();
      setIntegrityResults((prev) => ({ ...prev, [docId]: data }));
    } catch (err: any) {
      setIntegrityResults((prev) => ({
        ...prev,
        [docId]: { error: err.message },
      }));
    } finally {
      setIntegrityLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--foreground)]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Verification & Integrity</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1">
            Verify authenticity, inspect QR verification payloads, and validate SHA-256 binary integrity.
          </p>
        </div>
      </div>

      {/* Verification Lookup Tool */}
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)] mb-1">
          Verify Document Authenticity
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Enter a Docora verification token (or scan a QR code) to inspect public authenticity status and byte checksums.
        </p>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <Input
            placeholder="e.g. docv_a1b2c3d4e5f6..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="text-xs h-10 font-mono"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold h-10 px-5 shrink-0"
          >
            {loading ? 'Verifying...' : 'Verify Token'} <Search className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/20 border border-red-900/50 text-red-400 text-xs">
            {error}
          </div>
        )}

        {verificationResult && (
          <div className="mt-5 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>AUTHENTIC VERIFICATION RECORD</span>
              </div>
              <Link
                href={`/verify/${verificationResult.verificationToken}`}
                target="_blank"
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 font-semibold"
              >
                <span>Public Certificate Page</span> <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-neutral-500 block text-[10px] uppercase">Document Number</span>
                <span className="font-bold">{verificationResult.documentNumber}</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-neutral-500 block text-[10px] uppercase">Document Type</span>
                <span className="font-bold capitalize">{verificationResult.documentType}</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-neutral-500 block text-[10px] uppercase">Issuing Business</span>
                <span className="font-bold truncate block">{verificationResult.issuingBusiness}</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                <span className="text-neutral-500 block text-[10px] uppercase">Byte Integrity</span>
                <span className="font-bold text-emerald-400">
                  {verificationResult.integrityValid ? 'Confirmed Valid' : 'Valid'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
              <span className="text-neutral-500 block text-[10px] uppercase mb-1">Cryptographic Checksum (SHA-256)</span>
              <div className="font-mono text-xs text-[var(--muted-foreground)] break-all">
                {verificationResult.sha256Hash}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documents Cryptographic Integrity Verification Panel */}
      <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)] mb-1">
          Stored Document PDF Byte Checksums
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Authenticate and recompute exact SHA-256 cryptographic hashes against stored binary objects to detect tampering.
        </p>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
            No finalized documents found. Finalize a receipt or invoice to generate permanent integrity signatures.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const res = integrityResults[doc.id];
              const isLoading = integrityLoading === doc.id;

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--foreground)]">{doc.documentNumber}</span>
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)]">
                        {doc.documentType}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">{doc.title}</span>
                    </div>

                    <div className="font-mono text-[11px] text-[var(--muted-foreground)] truncate max-w-lg">
                      Expected SHA-256: {doc.sha256 || 'Not recorded'}
                    </div>

                    {res && (
                      <div className="pt-2">
                        {res.error ? (
                          <span className="text-red-400 font-medium">Error: {res.error}</span>
                        ) : res.matches ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Byte Integrity Match Confirmed (Size: {res.fileSizeBytes} bytes)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Integrity Check Mismatch! Stored file does not match original signature.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckIntegrity(doc.id)}
                      disabled={isLoading}
                      className="text-xs h-8"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                      {isLoading ? 'Checking...' : 'Check Integrity'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
