'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '@/app/providers';
import { COLOR_PALETTES, ColorPaletteId } from '@/types/palette';

export function PalettePicker() {
  const { colorPalette, setColorPalette } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const activePalette = COLOR_PALETTES.find((p) => p.id === colorPalette) || COLOR_PALETTES[0];

  return (
    <div className="relative" ref={containerRef}>
      {/* Palette Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 sm:px-2 sm:py-1.5 rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-all cursor-pointer h-8 flex items-center gap-1.5 shrink-0"
        title="Figma Color Harmony Palettes"
        aria-label="Select Color Palette"
        aria-expanded={isOpen}
      >
        {/* Dual color dot indicator */}
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/20 transition-transform hover:scale-110"
          style={{ background: activePalette.previewGradient }}
        />
        <span className="hidden sm:inline text-xs font-medium text-[var(--muted-foreground)]">
          Theme
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-[var(--border)] mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-from)]" />
              <span>Figma Color Palettes</span>
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)] bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">
              Harmonies
            </span>
          </div>

          <div className="space-y-1">
            {COLOR_PALETTES.map((p) => {
              const isSelected = p.id === colorPalette;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setColorPalette(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--surface-secondary)] border border-[var(--border-strong)]'
                      : 'hover:bg-[var(--surface-hover)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Swatch Pill */}
                    <div
                      className="w-6 h-6 rounded-lg shrink-0 shadow-xs border border-black/10 flex items-center justify-center"
                      style={{ background: p.previewGradient }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {p.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--muted-foreground)]">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[170px]">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase shrink-0 ml-1">
                    {p.primaryHex}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[var(--border)] px-2 text-[10px] text-[var(--muted-foreground)] flex items-center justify-between">
            <span>Harmonious Color Theory</span>
            <span className="font-semibold text-[var(--brand-from)]">Figma Generator</span>
          </div>
        </div>
      )}
    </div>
  );
}
