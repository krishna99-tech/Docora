'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown, Plus, Settings, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Workspace } from '@/types';

export function WorkspaceSelector() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ['user-workspaces'],
    queryFn: async () => {
      try {
        const list = await api.listWorkspaces();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const current = api.getActiveWorkspaceId();
    if (current) {
      setActiveId(current);
    } else if (workspaces.length > 0) {
      setActiveId(workspaces[0].id);
      api.setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) || workspaces[0];

  const handleSelect = (ws: Workspace) => {
    setActiveId(ws.id);
    api.setActiveWorkspaceId(ws.id);
    setIsOpen(false);
    queryClient.invalidateQueries();
  };

  if (isLoading && workspaces.length === 0) {
    return (
      <div className="h-8 w-28 sm:w-36 bg-[var(--surface-secondary)] rounded-md animate-pulse border border-[var(--border)]" />
    );
  }

  if (workspaces.length === 0) {
    return (
      <Link
        href="/settings/workspaces"
        className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Workspace</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] transition-colors cursor-pointer max-w-[150px] sm:max-w-[200px]"
        aria-label="Select active workspace"
        aria-expanded={isOpen}
      >
        <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--muted-foreground)]" />
        <span className="truncate font-semibold text-left">
          {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 shrink-0 text-[var(--muted-foreground)] ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-60 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 py-1 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Workspaces
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === (activeWorkspace?.id || activeId);
              return (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer ${
                    isSelected ? 'font-semibold text-[var(--foreground)] bg-[var(--surface-hover)]/50' : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="text-xs text-[var(--foreground)] truncate">{ws.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] font-mono truncate">
                      /{ws.slug}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[var(--border)] pt-1 mt-1">
            <Link
              href="/settings/workspaces"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <span>Manage Workspaces</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
