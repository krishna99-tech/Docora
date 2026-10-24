'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>>([]);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (doc) {
      if (doc.status !== 'draft') {
        alert('Issued or paid invoices cannot be edited.');
        router.push(`/invoices/${id}`);
        return;
      }
      setPaymentMethod(doc.paymentMethod || 'Bank Transfer');
      if (doc.dueDate) setDueDate(doc.dueDate.split('T')[0]);
      setNotes(doc.notes || '');
      setTerms(doc.terms || '');

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

  const handleSave = async () => {
    setError(null);
    for (const item of items) {
      if (!item.description.trim()) {
        setError('Please enter descriptions for all items');
        return;
      }
    }
    setIsSubmitting(true);
    router.push(`/invoices/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[var(--muted-foreground)]">
        Loading draft...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Edit Draft Invoice #${doc?.documentNumber}`}
        description="Update terms and deliverables before issuance"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
        <Link href={`/invoices/${id}`} className="inline-block">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Invoice
          </Button>
        </Link>

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice Terms</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Payment Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Input
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
            <div>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Modify items and unit prices</CardDescription>
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
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 sm:p-4 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <div className="md:col-span-5">
                  <label className="text-[11px] font-semibold text-[var(--muted-foreground)] md:hidden block mb-1">
                    Description
                  </label>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 md:contents">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-[var(--muted-foreground)] md:hidden block mb-1">
                      Qty
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-[var(--muted-foreground)] md:hidden block mb-1">
                      Unit Price ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="flex md:contents items-center justify-between pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                  <div className="md:col-span-2 md:text-right font-mono font-bold text-xs text-[var(--foreground)]">
                    <span className="md:hidden text-[var(--muted-foreground)] font-normal mr-2">Total:</span>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </div>
                  <div className="md:col-span-1 text-right">
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
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[var(--foreground)]">{formatCurrency(subtotal * 100, doc?.currency)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-[var(--border)] text-sm text-[var(--foreground)]">
                <span>Total:</span>
                <span>{formatCurrency(grandTotal * 100, doc?.currency)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <Link href={`/invoices/${id}`} className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
          </Link>
          <Button variant="default" onClick={handleSave} isLoading={isSubmitting} className="w-full sm:w-auto">
            <Save className="w-3.5 h-3.5 mr-1" />
            Done Editing
          </Button>
        </div>
      </div>
    </div>
  );
}
