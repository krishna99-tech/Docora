'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, CheckCircle, Save } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ItemInput } from '@/types';

export default function NewInvoicePage() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('Payment is due within 30 days of invoice date.');
  const [terms, setTerms] = useState('Late payments may incur an interest fee of 1.5% per month.');
  const [templateVersionId, setTemplateVersionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>>([
    { description: 'Web Platform Development (Sprint 1)', quantity: 40, unitPrice: 75.0, discount: 0, taxRate: 0.08 },
  ]);

  const [amountPaid, setAmountPaid] = useState<number>(0);

  const { data: customerData } = useQuery({
    queryKey: ['customers-list-all'],
    queryFn: () => api.listCustomers({ pageSize: 100 }),
  });

  const { data: templates } = useQuery({
    queryKey: ['templates-invoices'],
    queryFn: () => api.listTemplates('invoice'),
  });

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
        setError('Please enter a description for all line items');
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

      const invoice = await api.createInvoice({
        customerId: customerId || undefined,
        currency,
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        paymentMethod,
        paymentReference,
        amountPaidMinor: Math.round((Number(amountPaid) || 0) * 100),
        notes,
        terms,
        templateVersionId: templateVersionId || undefined,
        items: payloadItems,
      });

      if (finalizeImmediately) {
        await api.finalizeInvoice(invoice.id);
      }

      router.push(`/invoices/${invoice.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Create Invoice"
        description="Build an itemized commercial invoice with payment instructions"
      />

      <div className="p-8 max-w-5xl space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Invoices
            </Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice Terms & Recipient</CardTitle>
            <CardDescription>Assign customer, billing dates, and payment options</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                Client / Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
              >
                <option value="">Select Recipient (or Walk-in)</option>
                {customerData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />

            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
                <option value="Bank Transfer">Bank Transfer / Wire</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Check</option>
                <option value="ACH">ACH Direct Debit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                Template Layout
              </label>
              <select
                value={templateVersionId}
                onChange={(e) => setTemplateVersionId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
              >
                <option value="">Default Minimal Invoice</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Line Items Card */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
            <div>
              <CardTitle>Billable Line Items</CardTitle>
              <CardDescription>Enter products, hours, or deliverables</CardDescription>
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
                className="grid grid-cols-12 gap-3 items-center p-3 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <div className="col-span-12 md:col-span-4">
                  <Input
                    placeholder="Item / service description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Unit Price ($)"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Tax Rate (e.g. 0.08)"
                    value={item.taxRate}
                    onChange={(e) => updateItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="col-span-5 md:col-span-1 text-right font-mono font-bold text-xs">
                  ${((item.quantity * item.unitPrice) * (1 + item.taxRate)).toFixed(2)}
                </div>

                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(subtotal * 100, currency)}</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Applicable Tax:</span>
                  <span className="font-semibold text-[var(--foreground)]">{formatCurrency(taxTotal * 100, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold pt-2 border-t border-[var(--border)] text-[var(--foreground)]">
                <span>Total Invoice Due:</span>
                <span>{formatCurrency(grandTotal * 100, currency)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes & Terms */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] tracking-wide block mb-1.5">
                Invoice Notes & Payment Instructions
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
                Terms & Late Policy
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(false)}
            isLoading={isSubmitting}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={() => handleSubmit(true)}
            isLoading={isSubmitting}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Create & Finalize
          </Button>
        </div>
      </div>
    </div>
  );
}
