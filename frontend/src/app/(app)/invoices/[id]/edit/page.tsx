'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, Save, Eye, Edit3, Columns } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ItemInput } from '@/types';
import { DocumentPreviewContainer } from '@/components/preview/document-preview-container';
import { InvoicePreview } from '@/components/preview/invoice-preview';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');

  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>>([]);

  const [amountPaid, setAmountPaid] = useState<number>(0);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: Boolean(id),
  });

  const { data: businessProfile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: () => api.getBusinessProfile(),
  });

  useEffect(() => {
    if (doc) {
      if (doc.status !== 'draft') {
        alert('Issued or paid invoices cannot be modified.');
        router.push(`/invoices/${id}`);
        return;
      }
      setPaymentMethod(doc.paymentMethod || 'Bank Transfer');
      setPaymentReference(doc.paymentReference || '');
      setDueDate(doc.dueDate ? doc.dueDate.split('T')[0] : '');
      setNotes(doc.notes || '');
      setTerms(doc.terms || '');
      setAmountPaid((doc.amountPaidMinor || 0) / 100);

      if (doc.items && doc.items.length > 0) {
        setItems(
          doc.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPriceMinor / 100,
            discount: it.discountMinor / 100,
            taxRate: it.taxRate,
          }))
        );
      }
    }
  }, [doc, id, router]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }]);
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

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discountTotal = items.reduce((acc, item) => acc + item.discount, 0);
  const taxTotal = items.reduce((acc, item) => {
    const taxable = Math.max(0, (item.quantity * item.unitPrice) - item.discount);
    return acc + (taxable * item.taxRate);
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleSave = async () => {
    setError(null);
    for (const item of items) {
      if (!item.description.trim()) {
        setError('Please enter descriptions for all items');
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

      await api.updateInvoice(id, {
        customerId: doc?.customerId,
        currency: doc?.currency || 'USD',
        issueDate: doc?.issueDate,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        paymentMethod,
        paymentReference,
        amountPaidMinor: Math.round((Number(amountPaid) || 0) * 100),
        notes,
        terms,
        templateVersionId: doc?.templateVersionId,
        items: payloadItems,
      });

      router.push(`/invoices/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed saving draft invoice');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading draft...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={`Edit Draft Invoice #${doc?.documentNumber}`}
        description="Update terms and deliverables before issuance with live preview"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Navigation & View Mode Switcher */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href={`/invoices/${id}`} className="inline-block">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Invoice
            </Button>
          </Link>

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

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-6'}>
          {/* Editor Column */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5 space-y-6' : 'max-w-4xl mx-auto space-y-6'}>
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Terms & Remittance</CardTitle>
                  <CardDescription>Adjust settlement terms and due date</CardDescription>
                </CardHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Due Date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />

                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Payment Reference / Wire Account"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Items Card */}
              <Card>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                  <div>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>Update deliverables and rates</CardDescription>
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
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)]"
                    >
                      <div className="sm:col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Rate"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Tax"
                          value={item.taxRate}
                          onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}
                          className="text-red-500 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
                  <div className="w-full sm:w-72 space-y-2 text-xs">
                    <div className="flex justify-between text-[var(--muted-foreground)]">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-[var(--foreground)]">{formatCurrency(subtotal * 100, doc?.currency || 'USD')}</span>
                    </div>
                    {taxTotal > 0 && (
                      <div className="flex justify-between text-[var(--muted-foreground)]">
                        <span>Tax:</span>
                        <span className="font-semibold text-[var(--foreground)]">{formatCurrency(taxTotal * 100, doc?.currency || 'USD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-[var(--border)] text-[var(--foreground)]">
                      <span>Total:</span>
                      <span>{formatCurrency(grandTotal * 100, doc?.currency || 'USD')}</span>
                    </div>
                    <div className="pt-2">
                      <Input
                        label="Amount Paid ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-2 text-[var(--muted-foreground)]">
                      <span>Balance Due:</span>
                      <span className={balanceDue > 0 ? 'text-amber-500 font-extrabold' : 'text-emerald-500'}>
                        {formatCurrency(balanceDue * 100, doc?.currency || 'USD')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Notes & Terms */}
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                      Notes
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
                      Terms
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

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="default"
                  className="w-full sm:w-auto"
                  onClick={handleSave}
                  isLoading={isSubmitting}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save Draft Changes
                </Button>
              </div>
            </div>
          )}

          {/* Live Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7 sticky top-4 self-start' : 'max-w-4xl mx-auto w-full'}>
              <DocumentPreviewContainer
                title="Live Invoice Preview"
                documentNumber={doc?.documentNumber}
                documentId={id}
              >
                <InvoicePreview
                  documentNumber={doc?.documentNumber || 'DRAFT'}
                  status={doc?.status || 'draft'}
                  issueDate={doc?.issueDate}
                  dueDate={dueDate || doc?.dueDate}
                  currency={doc?.currency || 'USD'}
                  paymentMethod={paymentMethod}
                  paymentReference={paymentReference}
                  customer={doc?.customer || null}
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
