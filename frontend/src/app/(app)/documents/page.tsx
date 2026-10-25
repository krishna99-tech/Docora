'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Eye, Download, Trash2, FolderArchive, Info, Folder, FolderPlus, Tag, ShieldCheck, Plus, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PDFViewerModal } from '@/components/pdf/pdf-viewer-modal';
import { TablePagination } from '@/components/ui/table-pagination';
import { Document, DocumentFolder } from '@/types';

export default function DocumentLibraryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocNumber, setPreviewDocNumber] = useState<string>('');
  const [selectedMetaDoc, setSelectedMetaDoc] = useState<Document | null>(null);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: folders = [], refetch: refetchFolders } = useQuery({
    queryKey: ['document-folders'],
    queryFn: () => api.listFolders(),
  });

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder({ name: newFolderName.trim() });
      setNewFolderName('');
      setShowFolderModal(false);
      refetchFolders();
    } catch (err: any) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents-library', search, typeFilter, statusFilter, page, sortBy, sortOrder],
    queryFn: () =>
      api.listDocuments({
        search,
        type: typeFilter,
        status: statusFilter,
        page,
        pageSize: 15,
        sortBy,
        sortOrder,
      }),
  });

  const handleOpenPreview = (id: string, num: string) => {
    setPreviewDocId(id);
    setPreviewDocNumber(num);
  };

  const handleDownload = (id: string, num: string) => {
    api.downloadDocument(id, `${num}.pdf`);
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this draft?')) return;
    try {
      await api.deleteDocument(id);
      refetch();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Document Library"
        description="Comprehensive archive of all issued receipts, invoices, and compiled PDFs"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Enterprise Folder Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all whitespace-nowrap ${
              selectedFolderId === null
                ? 'bg-neutral-800 text-white'
                : 'bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>All Documents</span>
            <span className="text-[10px] opacity-70 ml-1">({data?.total || 0})</span>
          </button>

          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all whitespace-nowrap ${
                selectedFolderId === f.id
                  ? 'bg-neutral-800 text-white'
                  : 'bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-neutral-400" />
              <span>{f.name}</span>
              <span className="text-[10px] opacity-70 ml-0.5">({f.documentCount})</span>
            </button>
          ))}

          <button
            onClick={() => setShowFolderModal(true)}
            className="px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border)] hover:border-neutral-500 text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 whitespace-nowrap text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        </div>

        {/* Create Folder Modal */}
        {showFolderModal && (
          <Modal
            isOpen={showFolderModal}
            onClose={() => setShowFolderModal(false)}
            title="Create Enterprise Folder"
          >
            <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Q3 Invoices or Tax Audits"
                  className="w-full h-9 px-3 text-xs rounded-md bg-[var(--background)] border border-[var(--input)] text-[var(--foreground)] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowFolderModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs font-semibold">
                  Create Folder
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, number, or customer..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="invoice">Invoices</option>
              <option value="general">General PDFs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="total-desc">Highest Amount</option>
              <option value="total-asc">Lowest Amount</option>
              <option value="document_number-asc">Document # (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <Card className="p-0 overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Document #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--muted-foreground)]">
                      Loading document library...
                    </td>
                  </tr>
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <FolderArchive className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-2" />
                      <p className="font-semibold text-sm">No documents found</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Try modifying search or filter criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.data.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">{doc.documentNumber}</td>
                      <td className="py-3 px-4 font-semibold truncate max-w-xs">{doc.title}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider">
                        {doc.documentType}
                      </td>
                      <td className="py-3 px-4">{doc.customer?.name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatDate(doc.issueDate)}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {doc.totalMinor > 0 ? formatCurrency(doc.totalMinor, doc.currency) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={doc.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPreviewDocId(doc.id);
                              setPreviewDocNumber(doc.documentNumber);
                            }}
                            title="Preview PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => api.downloadDocument(doc.id, `${doc.documentNumber}.pdf`)}
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMetaDoc(doc)}
                            title="View Metadata"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </Button>

                          {doc.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDraft(doc.id)}
                              title="Delete Draft"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={15}
              onPageChange={setPage}
              itemName="documents"
            />
          )}
        </Card>

        {/* Mobile Documents Card View (< 640px) */}
        <div className="sm:hidden space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">
              Loading documents...
            </Card>
          ) : !data || data.data.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderArchive className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
              <p className="font-semibold text-xs">No documents archived yet</p>
            </Card>
          ) : (
            data.data.map((doc) => (
              <Card key={doc.id} className="p-4 space-y-2.5 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{doc.documentNumber}</span>
                  <Badge status={doc.status} />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-[var(--foreground)]">{doc.title}</div>
                  <div className="text-[var(--muted-foreground)] mt-0.5">
                    <span className="capitalize">{doc.documentType}</span> • {doc.customer?.name || 'Walk-in'} • {formatDate(doc.issueDate)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]">
                  <span className="font-bold text-xs text-[var(--foreground)]">
                    {formatCurrency(doc.totalMinor, doc.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleOpenPreview(doc.id, doc.documentNumber)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleDownload(doc.id, doc.documentNumber)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}

          {data && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              pageSize={15}
              onPageChange={setPage}
              itemName="documents"
            />
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFViewerModal
        isOpen={Boolean(previewDocId)}
        onClose={() => setPreviewDocId(null)}
        documentId={previewDocId}
        documentNumber={previewDocNumber}
        onFinalized={() => refetch()}
      />

      {/* Metadata Inspector Modal */}
      {selectedMetaDoc && (
        <Modal
          isOpen={Boolean(selectedMetaDoc)}
          onClose={() => setSelectedMetaDoc(null)}
          title={`Document Metadata: ${selectedMetaDoc.documentNumber}`}
          description="Verified cryptographic checksum and storage attributes"
          maxWidth="md"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[var(--surface-secondary)] rounded-md border border-[var(--border)] space-y-2">
              <div>
                <span className="text-[var(--muted-foreground)] block">Storage Key:</span>
                <span className="font-mono text-[11px] break-all">{selectedMetaDoc.storageKey || 'Generated on demand'}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block">SHA-256 Checksum:</span>
                <span className="font-mono text-[11px] break-all">{selectedMetaDoc.sha256 || 'Calculated on finalization'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">MIME Type:</span>
                <span className="font-semibold">{selectedMetaDoc.mimeType || 'application/pdf'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">File Size:</span>
                <span className="font-semibold">
                  {selectedMetaDoc.fileSize > 0 ? `${(selectedMetaDoc.fileSize / 1024).toFixed(1)} KB` : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Created At:</span>
                <span>{selectedMetaDoc.createdAt}</span>
              </div>
              {selectedMetaDoc.finalizedAt && (
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Finalized At:</span>
                  <span>{selectedMetaDoc.finalizedAt}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
