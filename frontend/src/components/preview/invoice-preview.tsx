'use client';

import React from 'react';
import { Customer, BusinessProfile } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface InvoicePreviewProps {
  documentNumber?: string;
  status?: string;
  issueDate?: string;
  dueDate?: string;
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

export function InvoicePreview({
  documentNumber = 'DRAFT',
  status = 'draft',
  issueDate,
  dueDate,
  currency = 'USD',
  paymentMethod = 'Bank Transfer',
  paymentReference,
  customer,
  business,
  items = [],
  amountPaid = 0,
  notes,
  terms,
}: InvoicePreviewProps) {
  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const discountTotal = items.reduce((acc, it) => acc + (Number(it.discount) || 0), 0);
  const taxTotal = items.reduce((acc, it) => {
    const taxable = Math.max(0, (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0));
    return acc + taxable * (Number(it.taxRate) || 0);
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const balanceDue = Math.max(0, grandTotal - (Number(amountPaid) || 0));

  const displayIssueDate = issueDate ? formatDate(issueDate) : formatDate(new Date().toISOString());
  const displayDueDate = dueDate
    ? formatDate(dueDate)
    : formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  return (
    <div
      id="printable-document"
      className="print-document-sheet bg-white text-[#111111] p-10 font-sans shadow-lg border border-neutral-200 rounded-sm w-[794px] min-h-[1123px] box-border text-[13px] leading-relaxed select-text"
    >
      {/* Top Banner */}
      <div className="flex justify-between items-start border-b-[3px] border-[#111111] pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#111111]">
            {business?.businessName || 'Docora Enterprises'}
          </h1>
          <div className="mt-1 text-xs text-[#555555] space-y-0.5">
            {business?.address && <p>{business.address}</p>}
            {business?.email && <p>Email: {business.email}</p>}
            {business?.phone && <p>Phone: {business.phone}</p>}
            {business?.taxRegistrationNumber && <p>Tax ID: {business.taxRegistrationNumber}</p>}
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black tracking-wider text-[#111111]">
            INVOICE
          </div>
          <div className="text-base font-bold text-[#444444] mt-1 font-mono">
            #{documentNumber}
          </div>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-4 gap-3 bg-[#f7f7f7] border border-[#e5e5e5] rounded-md p-3.5 mb-6 text-xs">
        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#777777] mb-1">
            Invoice Date
          </span>
          <span className="font-semibold text-[#111111]">{displayIssueDate}</span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#777777] mb-1">
            Due Date
          </span>
          <span className="font-semibold text-[#111111]">{displayDueDate}</span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#777777] mb-1">
            Payment Terms
          </span>
          <span className="font-semibold text-[#111111]">
            {paymentMethod || 'Net 30 Days'}
          </span>
        </div>

        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[#777777] mb-1">
            Status
          </span>
          <span className="inline-block uppercase font-extrabold text-[10px] px-2 py-0.5 rounded border border-[#111111] tracking-wider">
            {status}
          </span>
        </div>
      </div>

      {/* Bill To & Remit To */}
      <div className="grid grid-cols-2 gap-6 mb-7">
        <div className="bg-[#fcfcfc] border border-[#e5e5e5] rounded-md p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-2">
            Billed To
          </h3>
          {customer ? (
            <div>
              <p className="font-bold text-sm text-[#111111]">{customer.name}</p>
              {customer.email && <p className="text-xs text-[#555555] mt-0.5">{customer.email}</p>}
              {customer.phone && <p className="text-xs text-[#555555]">{customer.phone}</p>}
              {customer.address && <p className="text-xs text-[#555555] mt-1">{customer.address}</p>}
            </div>
          ) : (
            <div>
              <p className="font-bold text-sm text-[#111111]">Walk-in / Direct Client</p>
              <p className="text-xs text-[#888888]">No registered billing profile selected</p>
            </div>
          )}
        </div>

        <div className="bg-[#fcfcfc] border border-[#e5e5e5] rounded-md p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-2">
            Payment Instructions
          </h3>
          <p className="font-bold text-xs text-[#111111]">Method: {paymentMethod}</p>
          {paymentReference ? (
            <p className="text-xs font-mono text-[#555555] mt-1">Ref / Account: {paymentReference}</p>
          ) : (
            <p className="text-xs text-[#666666] mt-1">Please quote invoice number on bank remittance.</p>
          )}
          <p className="text-xs text-[#555555] mt-1">Settlement Currency: {currency}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 overflow-hidden rounded border border-[#e5e5e5]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3.5 text-left">Item & Description</th>
              <th className="py-2.5 px-3 text-center w-20">Qty</th>
              <th className="py-2.5 px-3.5 text-right w-28">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-20">Tax</th>
              <th className="py-2.5 px-3.5 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-xs text-[#888888] italic">
                  No line items specified.
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
                    <td className="py-2.5 px-3.5 font-medium text-[#111111] text-xs">
                      {it.description || 'Deliverable Item'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-xs text-[#444444]">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-xs font-mono text-[#444444]">
                      {formatCurrency((Number(it.unitPrice) || 0) * 100, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs text-[#666666]">
                      {it.taxRate ? `${(it.taxRate * 100).toFixed(0)}%` : '0%'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-xs font-mono font-bold text-[#111111]">
                      {formatCurrency(lineTotal * 100, currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
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
              <span>Discounts:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(discountTotal * 100, currency)}
              </span>
            </div>
          )}

          {taxTotal > 0 && (
            <div className="flex justify-between py-1">
              <span>Tax Amount:</span>
              <span className="font-mono font-semibold text-[#111111]">
                {formatCurrency(taxTotal * 100, currency)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center py-2.5 border-t-2 border-b-2 border-[#111111] text-base font-extrabold text-[#111111]">
            <span>Total Payable:</span>
            <span className="font-mono">
              {formatCurrency(grandTotal * 100, currency)}
            </span>
          </div>

          <div className="flex justify-between py-1 font-semibold text-[#111111]">
            <span>Paid to Date:</span>
            <span className="font-mono">
              {formatCurrency((Number(amountPaid) || 0) * 100, currency)}
            </span>
          </div>

          <div className="flex justify-between py-1 font-bold">
            <span>Balance Due:</span>
            <span
              className={`font-mono ${
                balanceDue > 0 ? 'text-amber-700 font-extrabold' : 'text-emerald-700'
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
                Invoice Notes
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

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-[#e5e5e5] flex justify-between items-end text-xs text-[#777777] avoid-break">
        <div>
          <p className="font-medium text-[#444444]">
            {business?.businessName || 'Docora Enterprises'}
          </p>
          <p className="text-[11px]">Commercial Invoice Document</p>
        </div>
        <div className="text-right">
          <div className="w-48 border-b border-[#111111] mb-1" />
          <p className="text-[11px]">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
