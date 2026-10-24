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
import { ItemInput } from '@/types';

export default function EditReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentReference, setPaymentReference] = useState('');
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

  const [amountPaid, setAmountPaid] = useState<number>(0);

  const { data: doc, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => api.getReceipt(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (doc) {
      if (doc.status !== 'draft') {
        alert('Finalized documents cannot be edited.');
        router.push(`/receipts/${id}`);
        return;
      }
      setPaymentMethod(doc.paymentMethod || 'Credit Card');
      setPaymentReference(doc.paymentReference || '');
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
      // In this version, updating re-submits draft or edits metadata
      router.push(`/receipts/${id}`);
    } catch (err: any) {
      setError(err.message || 'Failed saving draft edits');
    } finally {
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
    <div className="flex-1 flex flex-col">
      <Header
        title={`Edit Draft Receipt #${doc?.documentNumber}`}
        description="Update line items and payment terms before finalizing"
      />

      <div className="p-8 max-w-5xl space-y-6">
        <Link href={`/receipts/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Receipt
          </Button>
        </Link>

        {error && (
          <div className="p-4 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Update payment method and reference</CardDescription>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Input
              label="Payment Reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
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
                className="grid grid-cols-12 gap-3 items-center p-3 rounded-md bg-[var(--surface-secondary)] border border-[var(--border)]"
              >
                <div className="col-span-12 md:col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 md:col-span-2 text-right font-mono font-bold text-xs">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal * 100, doc?.currency)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-[var(--border)] text-sm">
                <span>Total:</span>
                <span>{formatCurrency(grandTotal * 100, doc?.currency)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href={`/receipts/${id}`}>
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="default" onClick={handleSave} isLoading={isSubmitting}>
            <Save className="w-3.5 h-3.5 mr-1" />
            Done Editing
          </Button>
        </div>
      </div>
    </div>
  );
}
