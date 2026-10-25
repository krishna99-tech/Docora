'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Share2,
  Lock,
  Download,
  Copy,
  Check,
  Ban,
  Clock,
  Eye,
  Plus,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Header } from '@/components/layout/header';
import { TablePagination } from '@/components/ui/table-pagination';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function SharedDocumentsPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // New share link modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('72');
  const [password, setPassword] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [watermarkText, setWatermarkText] = useState('');
  const [maxAccesses, setMaxAccesses] = useState('0');
  const [creating, setCreating] = useState(false);
  const [createdLinkUrl, setCreatedLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = () => {
    setLoading(true);
    fetch('/api/v1/shared-links')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setLinks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const openCreateModal = () => {
    setError(null);
    setCreatedLinkUrl(null);
    setSelectedDocId('');
    setPassword('');
    setIsModalOpen(true);

    fetch('/api/v1/documents?pageSize=50')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((res) => {
        if (res.data) setDocuments(res.data);
      })
      .catch(() => {});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) {
      setError('Please select a document to share');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const expHours = parseInt(expiresInHours, 10);
      const accesses = parseInt(maxAccesses, 10);

      const res = await fetch(`/api/v1/documents/${selectedDocId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresInHours: expHours > 0 ? expHours : null,
          password: password || undefined,
          allowDownload,
          watermarkText: watermarkText || undefined,
          maxAccesses: accesses > 0 ? accesses : 0,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create sharing link');
      }

      const data = await res.json();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/share/${data.rawToken}`;
      setCreatedLinkUrl(url);

      fetchLinks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const confirm = useConfirm();

  const handleRevoke = async (id: string, docTitle?: string) => {
    const ok = await confirm({
      title: 'Revoke Shared Link',
      message: 'Are you sure you want to revoke this sharing link? Anyone with the URL will immediately lose access to this document.',
      itemName: docTitle,
      itemType: 'Shared Link',
      confirmText: 'Revoke Access',
      variant: 'warning',
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/v1/shared-links/${id}/revoke`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        fetchLinks();
      }
    } catch {}
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalPages = Math.ceil(links.length / pageSize);
  const paginatedLinks = links.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Shared Documents"
        description="Create temporary, password-protected, and rate-limited document sharing links"
        action={{
          label: 'Create Sharing Link',
          onClick: openCreateModal,
        }}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Sharing Links Table / Cards */}
        <div className="border border-[var(--border)] rounded-2xl bg-[var(--card)] overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Loading active links...</div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--muted-foreground)]">
              <Share2 className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-[var(--foreground)]">No Shared Links Yet</p>
              <p className="mt-1">Generate a temporary, secure link to share invoices or receipts safely.</p>
              <Button
                onClick={openCreateModal}
                className="mt-4 bg-white text-black hover:bg-neutral-200 text-xs font-semibold h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Create First Link
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Document</th>
                    <th className="py-3 px-4 font-semibold">Security</th>
                    <th className="py-3 px-4 font-semibold">Access Count</th>
                    <th className="py-3 px-4 font-semibold">Expires</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                  {paginatedLinks.map((link) => {
                    const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                    const isRevoked = link.isRevoked;

                    return (
                      <tr key={link.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm">{link.documentTitle}</div>
                          <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-mono">
                            {link.documentType}
                          </span>
                        </td>

                        <td className="py-3 px-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {link.hasPassword ? (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                                <Lock className="w-3 h-3" /> Password Protected
                              </span>
                            ) : (
                              <span className="text-neutral-500">Public Link</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--muted-foreground)]">
                            {link.allowDownload ? 'Download Allowed' : 'View Only'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-xs">
                          {link.accessCount} {link.maxAccesses > 0 ? `/ ${link.maxAccesses}` : 'views'}
                        </td>

                        <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">
                          {link.expiresAt
                            ? new Date(link.expiresAt).toLocaleDateString() +
                              ' ' +
                              new Date(link.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Never'}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              isRevoked
                                ? 'bg-red-950/40 text-red-400 border border-red-800/40'
                                : isExpired
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {isRevoked ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isRevoked && !isExpired && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevoke(link.id, link.documentTitle || 'Shared Document')}
                              className="text-xs h-7 text-red-400 hover:text-red-300 border-red-900/40"
                            >
                              <Ban className="w-3 h-3 mr-1" /> Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <TablePagination
                page={page}
                totalPages={totalPages}
                totalItems={links.length}
                pageSize={pageSize}
                onPageChange={setPage}
                itemName="shared links"
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Sharing Link Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Secure Document Share Link">
        {createdLinkUrl ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Share Link Generated</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  This high-entropy token is ready. For privacy and security, share this link manually with your recipient.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Link URL</label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdLinkUrl} className="font-mono text-xs h-9 bg-[var(--surface)]" />
                <Button
                  onClick={() => copyToClipboard(createdLinkUrl, 'modal')}
                  className="shrink-0 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs h-9 px-3"
                >
                  {copiedId === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsModalOpen(false)} variant="outline" className="text-xs">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Select Document *</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-xs"
                required
              >
                <option value="">-- Choose Document --</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.documentNumber ? `[${d.documentNumber}] ` : ''}
                    {d.title} ({d.documentType})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Expires In</label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  className="w-full h-9 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-xs"
                >
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="72">72 Hours (3 Days)</option>
                  <option value="168">7 Days</option>
                  <option value="720">30 Days</option>
                  <option value="0">Never Expires</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Max Accesses (0 = Unlimited)</label>
                <Input
                  type="number"
                  min="0"
                  value={maxAccesses}
                  onChange={(e) => setMaxAccesses(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Optional Password Protection</label>
              <Input
                type="password"
                placeholder="Leave blank for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Optional Watermark Note</label>
              <Input
                placeholder="e.g. SHARED COPY"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="allowDownload"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="rounded border-[var(--input)] text-[var(--primary)]"
              />
              <label htmlFor="allowDownload" className="text-xs font-medium cursor-pointer">
                Allow recipient to download the raw PDF file
              </label>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-950/20 border border-red-900/40 text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold"
              >
                {creating ? 'Generating Link...' : 'Create Secure Link'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
