export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxRegistrationNumber: string;
  logoStorageKey: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  userId?: string;
  name: string;
  documentType: 'receipt' | 'invoice' | 'general';
  description: string;
  templateContent: Record<string, any>;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  documentId: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
  taxMinor: number;
  lineTotalMinor: number;
  sortOrder: number;
}

export interface Document {
  id: string;
  userId: string;
  customerId?: string;
  customer?: Customer;
  documentNumber: string;
  documentType: 'receipt' | 'invoice' | 'general';
  title: string;
  status: 'draft' | 'finalized' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  balanceMinor: number;
  issueDate: string;
  dueDate?: string;
  paymentMethod: string;
  paymentReference: string;
  notes: string;
  terms: string;
  templateVersionId?: string;
  template?: Template;
  storageKey: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
  metadata?: any;
  items?: DocumentItem[];
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  receiptsGenerated: number;
  invoicesGenerated: number;
  generalPdfsGenerated: number;
  documentsThisMonth: number;
  totalReceiptRevenueMinor: number;
  totalInvoicePendingMinor: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ItemInput {
  description: string;
  quantity: number;
  unitPriceMinor: number;
  discountMinor: number;
  taxRate: number;
}

export interface CreateReceiptInput {
  customerId?: string;
  documentNumber?: string;
  title?: string;
  currency?: string;
  issueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  amountPaidMinor: number;
  notes?: string;
  terms?: string;
  templateVersionId?: string;
  items: ItemInput[];
}

export interface CreateInvoiceInput {
  customerId?: string;
  documentNumber?: string;
  title?: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  amountPaidMinor: number;
  notes?: string;
  terms?: string;
  templateVersionId?: string;
  items: ItemInput[];
}

export interface GeneralPDFSection {
  type: 'heading' | 'paragraph' | 'table' | 'key_value' | 'spacer' | 'divider';
  title?: string;
  content?: string;
  headers?: string[];
  rows?: string[][];
  pairs?: { key: string; value: string }[];
}

export interface CreateGeneralPDFInput {
  title: string;
  subtitle?: string;
  pageSize?: string;
  orientation?: string;
  margin?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  customerId?: string;
  templateVersionId?: string;
  sections: GeneralPDFSection[];
  notes?: string;
}
