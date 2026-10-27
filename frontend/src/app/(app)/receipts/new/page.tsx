'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, CheckCircle, Save, Eye, Edit3, Columns, Printer } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ItemInput } from '@/types';
import { DocumentLayoutPicker, DocumentLayoutConfig } from '@/components/layout/document-layout-picker';
import { DocumentPreviewContainer } from '@/components/preview/document-preview-container';
import { ReceiptPreview } from '@/components/preview/receipt-preview';

export default function NewReceiptPage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Official Receipt');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('All sales are final.');
  const [templateVersionId, setTemplateVersionId] = useState('');
  const [layoutConfig, setLayoutConfig] = useState<DocumentLayoutConfig>({
    preset: 'modern',
    pageSize: 'A4',
    orientation: 'portrait',
    headerAlignment: 'split',
    tableDensity: 'comfortable',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');

  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number; // in dollars for user input
    discount: number;  // in dollars
    taxRate: number;   // e.g. 0.05
  }>>([
    { description: 'Consulting Services', quantity: 1, unitPrice: 150.0, discount: 0, taxRate: 0.0 },
  ]);

  const [amountPaid, setAmountPaid] = useState<number>(150.0);

  // Fetch customers
  const { data: customerData } = useQuery({
    queryKey: ['customers-list-all'],
    queryFn: () => api.listCustomers({ pageSize: 100 }),
  });

  // Fetch templates for receipts
  const { data: templates } = useQuery({
    queryKey: ['templates-receipts'],
    queryFn: () => api.listTemplates('receipt'),
  });

  // Fetch business profile for preview
  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  const selectedCustomer = customerData?.data.find((c) => c.id === customerId) || null;

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0.0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    setItems(updated);
  };

  // Client-side instant calculation preview
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discountTotal = items.reduce((acc, item) => acc + item.discount, 0);
  const taxTotal = items.reduce((acc, item) => {
    const taxable = Math.max(0, (item.quantity * item.unitPrice) - item.discount);
    return acc + (taxable * item.taxRate);
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleSubmit = async (finalizeImmediately: boolean) => {
    setError(null);
    for (const item of items) {
      if (!item.description.trim()) {
        setError('Please enter a description for all items');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payloadItems: ItemInput[] = items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPriceMinor: Math.round((Number(it.unitPrice) || 0) * 100),
        discountMinor: Math.round((Number(it.discount) || 0) * 100),
        taxRate: Number(it.taxRate) || 0,
      }));

      const receipt = await api.createReceipt({
        customerId: customerId || undefined,
        currency,
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        paymentMethod,
        paymentReference,
        amountPaidMinor: Math.round((Number(amountPaid) || 0) * 100),
        notes,
        terms,
        templateVersionId: templateVersionId || undefined,
        items: payloadItems,
      });

      if (finalizeImmediately) {
        await api.finalizeReceipt(receipt.id);
      }

      router.push(`/receipts/${receipt.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create receipt');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Create Receipt"
        description="Fill in transaction details to generate an authoritative receipt with live preview"
        backHref="/receipts"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation & View Mode Switcher */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/receipts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Receipts
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-semibold cursor-pointer shadow-xs border-[var(--border)] hover:bg-[var(--surface-hover)]"
              title="Print document directly (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-[var(--primary)]" />
              Direct Print
            </Button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border)] self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'editor'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'preview'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Split View
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg no-print">
            {error}
          </div>
        )}

        {/* Content Layout */}
        <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
          {/* Editor Column - Hidden on Print */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={`no-print ${viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6 space-y-6' : 'max-w-4xl mx-auto space-y-6'}`}>
              {/* Transaction Header Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer & Transaction Metadata</CardTitle>
                  <CardDescription>Select recipient and payment details</CardDescription>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide">
                        Receipt Title / Heading
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        {['Official Receipt', 'Payment Receipt', 'Cash Receipt', 'Sales Receipt', 'Donation Receipt'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setDocumentTitle(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer font-medium ${
                              documentTitle.toLowerCase() === preset.toLowerCase()
                                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="e.g. Official Receipt, Payment Receipt"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="">Walk-in Customer</option>
                      {customerData?.data.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Receipt Date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <Input
                    label="Payment Reference / Transaction ID"
                    placeholder="e.g. TXN-998242"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide">
                        Template Layout
                      </label>
                      <Link
                        href="/templates"
                        className="text-[11px] text-[var(--primary)] hover:underline font-medium"
                      >
                        Browse & Install Templates →
                      </Link>
                    </div>
                    <select
                      value={templateVersionId}
                      onChange={(e) => setTemplateVersionId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="">Default Clean Receipt</option>
                      {templates?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Document Layout & Alignment Settings */}
              <DocumentLayoutPicker config={layoutConfig} onChange={setLayoutConfig} />

              {/* Line Items Card */}
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>Add purchased goods or services</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={addItem}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] space-y-3 transition-colors"
                    >
                      {/* Top row: Description + Line Total + Remove button */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Item description or service deliverable..."
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="text-right shrink-0 min-w-[80px]">
                          <span className="text-[10px] text-[var(--muted-foreground)] block">Total</span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-[var(--foreground)]">
                            ${((item.quantity * item.unitPrice) * (1 + item.taxRate)).toFixed(2)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0 h-9 w-9 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Bottom row: Quantity, Unit Price, Tax Rate */}
                      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[var(--border)]/60">
                        <div>
                          <label className="text-[10px] sm:text-[11px] font-semibold text-[var(--muted-foreground)] block mb-1">
                            Quantity
                          </label>
                          <Input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] sm:text-[11px] font-semibold text-[var(--muted-foreground)] block mb-1">
                            Unit Price ($)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] sm:text-[11px] font-semibold text-[var(--muted-foreground)] block mb-1">
                            Tax (e.g. 0.05)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.taxRate}
                            onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex justify-between py-0.5 text-[var(--muted-foreground)]">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(subtotal * 100, currency)}</span>
                    </div>
                    {taxTotal > 0 && (
                      <div className="flex justify-between py-0.5 text-[var(--muted-foreground)]">
                        <span>Estimated Tax:</span>
                        <span className="font-semibold text-[var(--foreground)]">{formatCurrency(taxTotal * 100, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 text-sm font-bold border-t border-[var(--border)] text-[var(--foreground)]">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(grandTotal * 100, currency)}</span>
                    </div>

                    <div className="pt-1.5">
                      <Input
                        label="Amount Received / Paid ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex justify-between py-1 text-xs font-bold pt-2 text-[var(--muted-foreground)] border-t border-[var(--border)]">
                      <span>Balance Due:</span>
                      <span className={balanceDue > 0 ? 'text-amber-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                        {formatCurrency(balanceDue * 100, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notes and Terms */}
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Receipt Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Terms & Conditions
                    </label>
                    <textarea
                      rows={3}
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    />
                  </div>
                </div>
              </Card>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => handleSubmit(false)}
                  isLoading={isSubmitting}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save as Draft
                </Button>

                <Button
                  type="button"
                  variant="default"
                  className="w-full sm:w-auto"
                  onClick={() => handleSubmit(true)}
                  isLoading={isSubmitting}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Create & Finalize
                </Button>
              </div>
            </div>
          )}

          {/* Live Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'lg:col-span-6 xl:col-span-6 sticky top-4 self-start' : 'max-w-4xl mx-auto w-full'} print:block print:w-full print:max-w-none print:static print:p-0`}>
              <DocumentPreviewContainer title="Live Receipt Preview">
                <ReceiptPreview
                  documentTitle={documentTitle}
                  documentNumber="DRAFT"
                  status="draft"
                  issueDate={issueDate}
                  currency={currency}
                  paymentMethod={paymentMethod}
                  paymentReference={paymentReference}
                  customer={selectedCustomer}
                  business={businessProfile}
                  items={items}
                  amountPaid={amountPaid}
                  notes={notes}
                  terms={terms}
                />
              </DocumentPreviewContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
