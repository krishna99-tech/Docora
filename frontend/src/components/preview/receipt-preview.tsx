'use client';

import React from 'react';
import { Customer, BusinessProfile } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface ReceiptPreviewProps {
  documentNumber?: string;
  status?: string;
  issueDate?: string;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  customer?: Customer | null;
  business?: BusinessProfile | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // in dollars/units
    discount?: number;
    taxRate?: number;
  }>;
  amountPaid?: number;
  notes?: string;
  terms?: string;
}

export function ReceiptPreview({
  documentNumber = 'DRAFT',
  status = 'draft',
  issueDate,
  currency = 'USD',
  paymentMethod = 'Credit Card',
  paymentReference,
  customer,
  business,
  items = [],
  amountPaid = 0,
  notes,
  terms,
}: ReceiptPreviewProps) {
  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discountTotal = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const taxTotal = items.reduce((acc, it) => {
    const taxable = Math.max(0, (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0));
    return acc + taxable * (Number(it.taxRate) || 0);
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const balanceDue = Math.max(0, grandTotal - (Number(amountPaid) || 0));

  const displayDate = issueDate ? formatDate(issueDate) : formatDate(new Date().toISOString());

  return (
    <div
      id="printable-document"
      className="print-document-sheet bg-white text-[#111111] p-10 font-sans shadow-lg border border-neutral-200 rounded-sm w-[794px] min-h-[1123px] box-border text-[13px] leading-relaxed select-text"
    >
      {/* Top Header */}
      <div className="flex justify-between items-start border-b-2 border-[#111111] pb-5 mb-6">
        <div className="business-info">
          <h1 className="text-2xl font-black tracking-tight text-[#111111] mb-1">
            {business?.businessName || 'Docora Platform'}
          </h1>
          {business?.address && <p className="text-xs text-[#555555]">{business.address}</p>}
          {business?.phone && <p className="text-xs text-[#555555]">Phone: {business.phone}</p>}
          {business?.email && <p className="text-xs text-[#555555]">Email: {business.email}</p>}
          {business?.taxRegistrationNumber && (
            <p className="text-xs text-[#555555]">Tax ID / Reg: {business.taxRegistrationNumber}</p>
          )}
        </div>

        <div className="text-right">
          <div className="inline-block bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded mb-2">
            Official Receipt
          </div>
          <div className="text-lg font-bold text-[#111111]">#{documentNumber}</div>
          <div className="text-xs text-[#666666] mt-0.5">Date: {displayDate}</div>
          <div className="mt-1">
            <span className="inline-block border border-[#111111] text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid: Recipient & Payment */}
      <div className="grid grid-cols-2 gap-6 mb-7">
        <div className="info-box bg-[#f9f9f9] border border-[#e5e5e5] rounded-md p-3.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
            Received From / Billed To
          </h3>
          {customer ? (
            <div>
              <p className="font-bold text-[#111111] text-sm">{customer.name}</p>
              {customer.email && <p className="text-xs text-[#555555]">{customer.email}</p>}
              {customer.phone && <p className="text-xs text-[#555555]">{customer.phone}</p>}
              {customer.address && <p className="text-xs text-[#555555] mt-1">{customer.address}</p>}
            </div>
          ) : (
            <div>
              <p className="font-bold text-[#111111] text-sm">Walk-in Customer</p>
              <p className="text-xs text-[#777777]">Standard counter transaction</p>
            </div>
          )}
        </div>

        <div className="info-box bg-[#f9f9f9] border border-[#e5e5e5] rounded-md p-3.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1.5">
            Payment Method & Reference
          </h3>
          <p className="font-bold text-[#111111] text-sm">{paymentMethod || 'Standard Payment'}</p>
          {paymentReference && (
            <p className="text-xs text-[#555555] font-mono mt-0.5">
              Ref: {paymentReference}
            </p>
          )}
          <p className="text-xs text-[#555555] mt-1">Currency: {currency}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-hidden rounded border border-[#e5e5e5]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 text-left">Description</th>
              <th className="py-2.5 px-3 text-center w-20">Qty</th>
              <th className="py-2.5 px-3 text-right w-28">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-20">Tax</th>
              <th className="py-2.5 px-3 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-[#888888] italic">
                  No line items added yet.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const lineTotal =
                  (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) * (1 + (Number(it.taxRate) || 0)) -
                  (Number(it.discount) || 0);
                return (
                  <tr
                    key={idx}
                    className={idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}
                    style={{ borderBottom: '1px solid #eeeeee' }}
                  >
                    <td className="py-2.5 px-3 font-medium text-[#111111] text-xs">
                      {it.description || 'Untitled Item'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs text-[#444444]">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono text-[#444444]">
                      {formatCurrency((Number(it.unitPrice) || 0) * 100, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-[#666666]">
                      {it.taxRate ? `${(it.taxRate * 100).toFixed(0)}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono font-bold text-[#111111]">
                      {formatCurrency(lineTotal * 100, currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Totals */}
      <div className="flex justify-end mb-8 avoid-break">
        <div className="w-80 space-y-1.5 text-xs text-[#444444]">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-[#111111]">
              {formatCurrency(subtotal * 100, currency)}
            </span>
          </div>

          {discountTotal > 0 && (
            <div className="flex justify-between py-1 text-emerald-700">
              <span>Discount Applied:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(discountTotal * 100, currency)}
              </span>
            </div>
          )}

          {taxTotal > 0 && (
            <div className="flex justify-between py-1">
              <span>Estimated Tax:</span>
              <span className="font-mono font-semibold text-[#111111]">
                {formatCurrency(taxTotal * 100, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2.5 border-t-2 border-b-2 border-[#111111] text-base font-extrabold text-[#111111]">
            <span>Total Amount:</span>
            <span className="font-mono">
              {formatCurrency(grandTotal * 100, currency)}
            </span>
          </div>

          <div className="flex justify-between py-1 font-semibold text-[#111111]">
            <span>Amount Paid:</span>
            <span className="font-mono">
              {formatCurrency((Number(amountPaid) || 0) * 100, currency)}
            </span>
          </div>

          <div className="flex justify-between py-1 font-bold">
            <span>Balance Due:</span>
            <span
              className={`font-mono ${
                balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {formatCurrency(balanceDue * 100, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {(notes || terms) && (
        <div className="border-t border-[#e5e5e5] pt-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 avoid-break">
          {notes && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                Receipt Notes
              </h4>
              <p className="text-xs text-[#555555] whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          {terms && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#666666] mb-1">
                Terms & Conditions
              </h4>
              <p className="text-xs text-[#555555] whitespace-pre-wrap">{terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Signature & Authentication Footer */}
      <div className="mt-10 pt-6 border-t border-[#e5e5e5] flex justify-between items-end text-xs text-[#777777] avoid-break">
        <div>
          <p className="font-medium text-[#444444]">
            {business?.businessName || 'Docora Official'}
          </p>
          <p className="text-[11px]">Authorized Financial Receipt</p>
        </div>
        <div className="text-right">
          <div className="w-48 border-b border-[#111111] mb-1" />
          <p className="text-[11px]">Authorized Signature & Date</p>
        </div>
      </div>
    </div>
  );
}
