'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Plus,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Workspace, WorkspaceMember } from '@/types';
import { formatDate } from '@/lib/utils';

export default function WorkspaceSettingsPage() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Queries
  const { data: workspaces = [], isLoading: wsLoading } = useQuery({
    queryKey: ['workspaces-list'],
    queryFn: () => api.listWorkspaces(),
  });

  const activeWorkspace = workspaces[0] || null;

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: () => (activeWorkspace ? api.getWorkspaceMembers(activeWorkspace.id) : []),
    enabled: !!activeWorkspace,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      api.addWorkspaceMember(activeWorkspace!.id, data),
    onSuccess: () => {
      setFeedbackMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspace?.id] });
    },
    onError: (err: any) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to add workspace member.' });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.removeWorkspaceMember(activeWorkspace!.id, userId),
    onSuccess: () => {
      setFeedbackMsg({ type: 'success', text: 'Member removed from workspace.' });
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspace?.id] });
    },
    onError: (err: any) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to remove member.' });
    },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Workspace Management"
        description="Organize collaborative workspaces, assign role-based permissions, and manage team members"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Link
            href="/settings/profile"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Business Workspace
          </Link>
          <Link
            href="/settings/workspaces"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs"
          >
            Team & Members
          </Link>
          <Link
            href="/settings/security"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Security & Password
          </Link>
        </div>

        {feedbackMsg && (
          <div
            className={`p-3 text-xs rounded-lg flex items-center gap-2 border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Active Workspace Card */}
        <Card className="p-6 border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">
                  {activeWorkspace?.name || 'Personal Workspace'}
                </h3>
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  Slug: {activeWorkspace?.slug || 'ws-default'}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold">
              Owner Active
            </Badge>
          </div>
        </Card>

        {/* Add Member Card */}
        <Card className="p-6 border-[var(--border)] space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[var(--foreground)]">Invite Team Member</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Grant colleagues access to generate documents, review templates, and run workflows in this workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] font-semibold"
              >
                <option value="admin">Admin (Full Control)</option>
                <option value="editor">Editor (Author & Run)</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>
            </div>

            <Button
              size="sm"
              disabled={!inviteEmail || addMemberMutation.isPending}
              onClick={() => addMemberMutation.mutate({ email: inviteEmail, role: inviteRole })}
              className="w-full sm:w-auto text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {addMemberMutation.isPending ? 'Inviting...' : 'Add Member'}
            </Button>
          </div>
        </Card>

        {/* Member Directory */}
        <Card className="p-6 border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-[var(--foreground)]">Workspace Members</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Users with authorized access to this multi-tenant workspace.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {members.length > 0 ? members.length : 1} Members
            </Badge>
          </div>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-secondary)]">
            {membersLoading ? (
              <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              /* Fallback showing current user as owner */
              <div className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs">
                    U
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Workspace Administrator</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">Owner Account</div>
                  </div>
                </div>
                <Badge variant="default" className="text-[10px] font-mono capitalize">
                  Owner
                </Badge>
              </div>
            ) : (
              members.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
                      {m.userName ? m.userName.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {m.userName || 'Team Member'}
                      </div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {m.userEmail || 'Member Account'} &bull; Joined {formatDate(m.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={m.role === 'owner' ? 'default' : 'outline'}
                      className="text-[10px] font-mono capitalize"
                    >
                      {m.role}
                    </Badge>

                    {m.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(m.userId)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-7 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
