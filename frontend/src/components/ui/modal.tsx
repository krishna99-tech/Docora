'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '4xl' | 'full';
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '4xl': 'max-w-5xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={cn(
          'w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden',
          widthStyles[maxWidth]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] tracking-tight">{title}</h3>
            {description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
