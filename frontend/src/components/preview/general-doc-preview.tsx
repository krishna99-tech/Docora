'use client';

import React from 'react';
import { GeneralPDFSection, BusinessProfile } from '@/types';
import { formatDate } from '@/lib/utils';

export interface GeneralDocPreviewProps {
  title: string;
  subtitle?: string;
  pageSize?: string;
  orientation?: string;
  margin?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  includePageNumbers?: boolean;
  sections: GeneralPDFSection[];
  business?: BusinessProfile | null;
  documentNumber?: string;
}

export function GeneralDocPreview({
  title,
  subtitle,
  pageSize = 'A4',
  orientation = 'portrait',
  includeHeader = true,
  includeFooter = true,
  includePageNumbers = true,
  sections = [],
  business,
  documentNumber = 'DOC-PREVIEW',
}: GeneralDocPreviewProps) {
  const currentDate = formatDate(new Date().toISOString());

  return (
    <div
      id="printable-document"
      className="print-document-sheet bg-white text-[#111111] p-12 font-sans shadow-lg border border-neutral-200 rounded-sm w-[794px] min-h-[1123px] box-border text-[13px] leading-relaxed select-text flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        {includeHeader && (
          <div className="border-b-2 border-[#111111] pb-5 mb-8 flex justify-between items-start avoid-break">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#111111]">
                {title || 'Untitled Document'}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#555555] font-medium mt-1">{subtitle}</p>
              )}
            </div>
            <div className="text-right text-xs text-[#666666]">
              <div className="font-bold text-[#111111] font-mono">#{documentNumber}</div>
              <div>{currentDate}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#888888]">
                {business?.businessName || 'Docora Structured Document'}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            switch (section.type) {
              case 'heading':
                return (
                  <div key={idx} className="pt-2 avoid-break">
                    <h2 className="text-base font-extrabold tracking-tight text-[#111111] border-b border-[#e5e5e5] pb-1.5 mb-2">
                      {section.title}
                    </h2>
                  </div>
                );

              case 'paragraph':
                return (
                  <div key={idx} className="avoid-break">
                    <p className="text-xs text-[#333333] leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                );

              case 'key_value':
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-2 gap-3 bg-[#f8f8f8] border border-[#e5e5e5] rounded p-4 avoid-break"
                  >
                    {section.pairs?.map((pair, pIdx) => (
                      <div key={pIdx} className="flex justify-between py-1 border-b border-[#eeeeee] text-xs">
                        <span className="font-semibold text-[#555555]">{pair.key}</span>
                        <span className="font-bold text-[#111111]">{pair.value}</span>
                      </div>
                    ))}
                  </div>
                );

              case 'table':
                return (
                  <div key={idx} className="overflow-hidden rounded border border-[#e5e5e5] avoid-break">
                    <table className="w-full border-collapse">
                      {section.headers && section.headers.length > 0 && (
                        <thead>
                          <tr className="bg-[#111111] text-white text-[11px] font-bold uppercase tracking-wider">
                            {section.headers.map((h, hIdx) => (
                              <th key={hIdx} className="py-2.5 px-3.5 text-left">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {section.rows?.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}
                            style={{ borderBottom: '1px solid #eeeeee' }}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-3.5 text-xs text-[#222222]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );

              case 'divider':
                return <hr key={idx} className="border-t border-[#e5e5e5] my-4 avoid-break" />;

              case 'spacer':
                return <div key={idx} className="h-6" />;

              default:
                return null;
            }
          })}
        </div>
      </div>

      {/* Footer */}
      {includeFooter && (
        <div className="mt-12 pt-4 border-t border-[#e5e5e5] flex justify-between items-center text-[11px] text-[#888888] avoid-break">
          <div>
            <span>{business?.businessName || 'Docora Generated Platform'}</span>
            <span className="mx-2">·</span>
            <span>Confidential & Proprietary</span>
          </div>
          {includePageNumbers && (
            <div className="font-mono">
              Page 1 of 1
            </div>
          )}
        </div>
      )}
    </div>
  );
}
