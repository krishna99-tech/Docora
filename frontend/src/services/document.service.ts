import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';
import {
  CreateGeneralPDFInput,
  CreateInvoiceInput,
  CreateReceiptInput,
  DashboardStats,
  Document,
  DocumentFolder,
  PaginatedResponse,
} from '@/types';

export class DocumentService {
  constructor(private http: HttpClient = httpClient) {}

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return this.http.request<DashboardStats>(API_ROUTES.DASHBOARD.STATS);
  }

  async getRecentDocuments(limit = 10): Promise<Document[]> {
    const res = await this.http.request<Document[]>(`${API_ROUTES.DASHBOARD.RECENT_DOCUMENTS}?limit=${limit}`);
    return Array.isArray(res) ? res : [];
  }

  // Receipts
  async createReceipt(data: CreateReceiptInput): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.RECEIPTS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listReceipts(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = query ? `${API_ROUTES.RECEIPTS.BASE}?${query}` : API_ROUTES.RECEIPTS.BASE;
    return this.http.request<PaginatedResponse<Document>>(endpoint);
  }

  async getReceipt(id: string): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.RECEIPTS.BY_ID(id));
  }

  async finalizeReceipt(id: string): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.RECEIPTS.FINALIZE(id), { method: 'POST' });
  }

  async cancelReceipt(id: string): Promise<void> {
    return this.http.request<void>(API_ROUTES.RECEIPTS.CANCEL(id), { method: 'POST' });
  }

  async updateReceipt(id: string, data: CreateReceiptInput): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.RECEIPTS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async createInvoice(data: CreateInvoiceInput): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.INVOICES.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listInvoices(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = query ? `${API_ROUTES.INVOICES.BASE}?${query}` : API_ROUTES.INVOICES.BASE;
    return this.http.request<PaginatedResponse<Document>>(endpoint);
  }

  async getInvoice(id: string): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.INVOICES.BY_ID(id));
  }

  async finalizeInvoice(id: string): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.INVOICES.FINALIZE(id), { method: 'POST' });
  }

  async cancelInvoice(id: string): Promise<void> {
    return this.http.request<void>(API_ROUTES.INVOICES.CANCEL(id), { method: 'POST' });
  }

  async updateInvoice(id: string, data: CreateInvoiceInput): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.INVOICES.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // General Documents
  async listDocuments(params: Record<string, string | number> = {}): Promise<PaginatedResponse<Document>> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const endpoint = query ? `${API_ROUTES.DOCUMENTS.BASE}?${query}` : API_ROUTES.DOCUMENTS.BASE;
    return this.http.request<PaginatedResponse<Document>>(endpoint);
  }

  async getDocument(id: string): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.DOCUMENTS.BY_ID(id));
  }

  async deleteDocument(id: string): Promise<void> {
    return this.http.request<void>(API_ROUTES.DOCUMENTS.BY_ID(id), { method: 'DELETE' });
  }

  async createGeneralPdf(data: CreateGeneralPDFInput): Promise<Document> {
    return this.http.request<Document>(API_ROUTES.DOCUMENTS.GENERAL_PDF, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Previews & Downloads
  async getDocumentPreviewBlob(id: string): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.DOCUMENTS.PREVIEW(id));
  }

  async downloadDocument(id: string, filename: string): Promise<void> {
    const blob = await this.http.requestBlob(API_ROUTES.DOCUMENTS.DOWNLOAD(id));
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename || `document-${id}.pdf`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Enterprise Folders & Compliance
  async listFolders(): Promise<DocumentFolder[]> {
    return this.http.request<DocumentFolder[]>(API_ROUTES.FOLDERS.BASE);
  }

  async createFolder(data: { name: string; color?: string; parentId?: string }): Promise<DocumentFolder> {
    return this.http.request<DocumentFolder>(API_ROUTES.FOLDERS.BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFolder(id: string, data: { name?: string; color?: string; parentId?: string }): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFolder(id: string): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.BY_ID(id), {
      method: 'DELETE',
    });
  }

  async moveDocuments(documentIds: string[], folderId: string | null): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.MOVE, {
      method: 'POST',
      body: JSON.stringify({ documentIds, folderId }),
    });
  }

  async tagDocuments(documentIds: string[], tags: string[]): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.TAG, {
      method: 'POST',
      body: JSON.stringify({ documentIds, tags }),
    });
  }

  async archiveDocuments(documentIds: string[], archive: boolean): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.ARCHIVE, {
      method: 'POST',
      body: JSON.stringify({ documentIds, archive }),
    });
  }

  async applyCompliance(complianceStandard: string, retentionDays: number): Promise<{ message: string }> {
    return this.http.request<{ message: string }>(API_ROUTES.FOLDERS.COMPLIANCE, {
      method: 'POST',
      body: JSON.stringify({ complianceStandard, retentionDays }),
    });
  }
}

export const documentService = new DocumentService();
