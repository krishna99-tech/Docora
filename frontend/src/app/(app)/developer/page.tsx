'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code2,
  Key,
  Webhook as WebhookIcon,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Send,
  RefreshCw,
  ExternalLink,
  Shield,
  Clock,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ApiKey, Webhook, WebhookDelivery } from '@/types';
import { formatDate } from '@/lib/utils';

export default function DeveloperPlatformPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');

  // Key creation state
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyPermissions, setKeyPermissions] = useState<string[]>([
    'documents:read',
    'documents:write',
  ]);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook creation state
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'document.finalized',
    'workflow.completed',
  ]);

  // Deliveries modal
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  // Webhook Test Runner state
  const [testWebhookTarget, setTestWebhookTarget] = useState<Webhook | null>(null);
  const [testEvent, setTestEvent] = useState<string>('document.created');
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Queries
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['developer-keys'],
    queryFn: () => api.listApiKeys(),
  });

  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ['developer-webhooks'],
    queryFn: () => api.listWebhooks(),
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ['developer-deliveries', selectedWebhookId],
    queryFn: () => (selectedWebhookId ? api.listWebhookDeliveries(selectedWebhookId) : []),
    enabled: !!selectedWebhookId,
  });

  const keysList = Array.isArray(apiKeys) ? apiKeys : [];
  const webhooksList = Array.isArray(webhooks) ? webhooks : [];
  const deliveriesList = Array.isArray(deliveries) ? deliveries : [];

  // Key Mutations
  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[] }) => api.createApiKey(data),
    onSuccess: (data) => {
      setCreatedRawKey(data.rawKey || 'docora_live_key_generated');
      queryClient.invalidateQueries({ queryKey: ['developer-keys'] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-keys'] });
    },
  });

  // Webhook Mutations
  const createWebhookMutation = useMutation({
    mutationFn: (data: { targetUrl: string; events: string[]; secret?: string }) =>
      api.createWebhook(data),
    onSuccess: () => {
      setShowNewWebhookModal(false);
      setWebhookUrl('');
      setWebhookSecret('');
      queryClient.invalidateQueries({ queryKey: ['developer-webhooks'] });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => api.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-webhooks'] });
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTogglePermission = (perm: string) => {
    setKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleToggleEvent = (ev: string) => {
    setWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const handleRunWebhookTest = async () => {
    if (!testWebhookTarget) return;
    setIsTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await api.testWebhook(testWebhookTarget.id, testEvent);
      setTestResult(res);
      queryClient.invalidateQueries({ queryKey: ['developer-deliveries', testWebhookTarget.id] });
      setSelectedWebhookId(testWebhookTarget.id);
    } catch (err: any) {
      setTestError(err.message || 'Failed to dispatch test ping');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Developer Platform"
        description="Manage REST API access keys, configure webhook event dispatches, and review delivery logs"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'keys'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              API Keys ({keysList.length})
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'webhooks'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <WebhookIcon className="w-3.5 h-3.5" />
              Webhooks ({webhooksList.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'docs'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Quickstart & Code Examples
            </button>
          </div>

          <div>
            {activeTab === 'keys' && (
              <Button size="sm" onClick={() => setShowNewKeyModal(true)} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Generate New Key
              </Button>
            )}
            {activeTab === 'webhooks' && (
              <Button size="sm" onClick={() => setShowNewWebhookModal(true)} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Webhook
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: API KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {keysLoading ? (
              <div className="text-center py-12 text-xs text-[var(--muted-foreground)]">
                Loading API keys...
              </div>
            ) : keysList.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-[var(--border)]">
                <Key className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[var(--foreground)]">No API Keys Generated</h3>
                <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mt-1 mb-4">
                  Generate an API key to authenticate automated requests from your backend, CI/CD pipelines, or microservices.
                </p>
                <Button size="sm" onClick={() => setShowNewKeyModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Generate First Key
                </Button>
              </Card>
            ) : (
              <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-secondary)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted-foreground)]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Key Name</th>
                        <th className="py-3 px-4 font-semibold">Token Prefix</th>
                        <th className="py-3 px-4 font-semibold">Permissions</th>
                        <th className="py-3 px-4 font-semibold">Last Used</th>
                        <th className="py-3 px-4 font-semibold">Created</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {keysList.map((key) => {
                        const isRevoked = !!key.revokedAt;
                        return (
                          <tr key={key.id} className="hover:bg-[var(--surface-hover)]">
                            <td className="py-3 px-4 font-semibold text-[var(--foreground)]">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isRevoked ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}
                                />
                                {key.name}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-[var(--foreground)]">
                              {key.keyPrefix || 'docora_live_...'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(key.permissions || ['full_access']).map((p) => (
                                  <Badge key={p} variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                                    {p}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[var(--muted-foreground)]">
                              {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                            </td>
                            <td className="py-3 px-4 text-[var(--muted-foreground)]">
                              {formatDate(key.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!isRevoked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => revokeKeyMutation.mutate(key.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-7 px-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Revoke
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-red-500 text-[10px]">
                                  Revoked
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WEBHOOKS */}
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {webhooksLoading ? (
              <div className="text-center py-12 text-xs text-[var(--muted-foreground)]">
                Loading webhooks...
              </div>
            ) : webhooksList.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-[var(--border)]">
                <WebhookIcon className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
                <h3 className="font-bold text-sm text-[var(--foreground)]">No Webhooks Registered</h3>
                <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto mt-1 mb-4">
                  Register HTTPS endpoints to receive real-time notifications when documents are generated or workflow executions complete.
                </p>
                <Button size="sm" onClick={() => setShowNewWebhookModal(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add First Webhook
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface-secondary)]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted-foreground)]">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Endpoint URL</th>
                          <th className="py-3 px-4 font-semibold">Subscribed Events</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Created</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {webhooksList.map((hook) => (
                          <tr key={hook.id} className="hover:bg-[var(--surface-hover)]">
                            <td className="py-3 px-4 font-mono text-[11px] text-[var(--foreground)] max-w-xs truncate">
                              {hook.targetUrl}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {(hook.events || []).map((ev) => (
                                  <Badge key={ev} variant="outline" className="text-[10px] font-mono py-0 px-1.5">
                                    {ev}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={hook.isActive ? 'default' : 'outline'}
                                className="text-[10px]"
                              >
                                {hook.isActive ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-[var(--muted-foreground)]">
                              {formatDate(hook.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTestWebhookTarget(hook);
                                  setTestResult(null);
                                  setTestError(null);
                                }}
                                className="text-xs h-7 px-2"
                                title="Dispatch test event ping"
                              >
                                <Send className="w-3.5 h-3.5 mr-1 text-[var(--primary)]" />
                                Test Ping
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedWebhookId(hook.id)}
                                className="text-xs h-7 px-2"
                              >
                                <Activity className="w-3.5 h-3.5 mr-1" />
                                Logs
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteWebhookMutation.mutate(hook.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs h-7 px-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deliveries Drawer if selected */}
                {selectedWebhookId && (
                  <Card className="p-4 border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          Recent Delivery Logs ({deliveriesList.length})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWebhookId(null)}
                        className="text-xs h-6 px-2"
                      >
                        Close
                      </Button>
                    </div>

                    {deliveriesLoading ? (
                      <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">
                        Loading deliveries...
                      </div>
                    ) : deliveriesList.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[var(--muted-foreground)]">
                        No delivery events recorded yet for this webhook.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deliveriesList.slice(0, 5).map((del) => (
                          <div
                            key={del.id}
                            className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {del.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-mono font-semibold text-[var(--foreground)]">
                                {del.eventType}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                HTTP {del.statusCode}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-[var(--muted-foreground)]">
                              {formatDate(del.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CODE SAMPLES */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">cURL / REST API</span>
                <Badge variant="outline" className="text-[10px] font-mono">v1</Badge>
              </div>
              <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-lg text-[11px] font-mono overflow-x-auto">
{`curl -X POST https://api.docora.com/api/v1/pdf-generator/generate \\
  -H "Authorization: Bearer docora_live_your_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Monthly Statement",
    "pageSize": "A4",
    "sections": [
      { "type": "heading", "title": "Account Balance" },
      { "type": "paragraph", "content": "Closing balance: $12,450.00" }
    ]
  }' --output statement.pdf`}
              </pre>
            </Card>

            <Card className="p-5 border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)]">Node.js / TypeScript</span>
                <Badge variant="outline" className="text-[10px] font-mono">SDK</Badge>
              </div>
              <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-lg text-[11px] font-mono overflow-x-auto">
{`import { DocoraClient } from '@docora/sdk';

const docora = new DocoraClient({
  apiKey: process.env.DOCORA_API_KEY
});

const pdfBuffer = await docora.documents.generate({
  templateId: 'tpl_invoice_standard',
  data: {
    customerName: 'Acme Corp',
    totalMinor: 49900
  }
});`}
              </pre>
            </Card>
          </div>
        )}

        {/* Modal: Create API Key */}
        {showNewKeyModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">Create New API Key</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Provide a recognizable name and assign authorized scopes.
                </p>
              </div>

              {!createdRawKey ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--foreground)]">Key Description</label>
                    <Input
                      placeholder="e.g. Production Backend Worker"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--foreground)]">Permissions</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        'documents:read',
                        'documents:write',
                        'workflows:execute',
                        'templates:read',
                      ].map((perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)]"
                        >
                          <input
                            type="checkbox"
                            checked={keyPermissions.includes(perm)}
                            onChange={() => handleTogglePermission(perm)}
                            className="rounded border-[var(--border)]"
                          />
                          <span className="font-mono text-[11px] truncate">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewKeyModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!keyName || createKeyMutation.isPending}
                      onClick={() =>
                        createKeyMutation.mutate({ name: keyName, permissions: keyPermissions })
                      }
                      className="text-xs"
                    >
                      {createKeyMutation.isPending ? 'Generating...' : 'Create Key'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Created token display */
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Save Your Secret Key
                    </div>
                    <div>
                      This token is displayed only once. Please store it safely in your environment variables.
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-2">
                    <code className="text-[11px] text-neutral-200 font-mono truncate select-all">
                      {createdRawKey}
                    </code>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(createdRawKey)}
                      className="text-xs h-7 px-2 shrink-0"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowNewKeyModal(false);
                        setCreatedRawKey(null);
                        setKeyName('');
                      }}
                      className="text-xs"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Create Webhook */}
        {showNewWebhookModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[var(--foreground)]">Register Webhook Endpoint</h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Receive cryptographically signed payloads when platform events occur.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Payload URL</label>
                  <Input
                    placeholder="https://api.yourdomain.com/webhooks/docora"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Signing Secret (Optional)</label>
                  <Input
                    placeholder="Leave blank to auto-generate"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--foreground)]">Trigger Events</label>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {[
                      { id: 'document.created', label: 'document.created - When draft is initialized' },
                      { id: 'document.finalized', label: 'document.finalized - When document is issued' },
                      { id: 'workflow.completed', label: 'workflow.completed - When pipeline finishes' },
                      { id: 'workflow.failed', label: 'workflow.failed - When execution errors' },
                    ].map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)]"
                      >
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(ev.id)}
                          onChange={() => handleToggleEvent(ev.id)}
                          className="rounded border-[var(--border)]"
                        />
                        <span className="font-mono text-[11px] truncate">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewWebhookModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!webhookUrl || webhookEvents.length === 0 || createWebhookMutation.isPending}
                    onClick={() =>
                      createWebhookMutation.mutate({
                        targetUrl: webhookUrl,
                        events: webhookEvents,
                        secret: webhookSecret || undefined,
                      })
                    }
                    className="text-xs"
                  >
                    {createWebhookMutation.isPending ? 'Registering...' : 'Add Endpoint'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEBHOOK TEST DISPATCHER MODAL */}
        {testWebhookTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[var(--primary)]" />
                  <h3 className="font-bold text-sm text-[var(--foreground)]">Dispatch Test Ping</h3>
                </div>
                <button
                  onClick={() => setTestWebhookTarget(null)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                    Target Endpoint
                  </span>
                  <div className="p-2 rounded bg-[var(--surface-secondary)] border border-[var(--border)] font-mono text-[11px] truncate">
                    {testWebhookTarget.targetUrl}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                    Select Event Type
                  </label>
                  <select
                    value={testEvent}
                    onChange={(e) => setTestEvent(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] focus:outline-none"
                  >
                    <option value="document.created">document.created</option>
                    <option value="document.finalized">document.finalized</option>
                    <option value="invoice.issued">invoice.issued</option>
                    <option value="receipt.finalized">receipt.finalized</option>
                    <option value="workflow.completed">workflow.completed</option>
                    <option value="workflow.failed">workflow.failed</option>
                  </select>
                </div>

                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] space-y-1">
                  <div className="font-semibold text-[11px] text-[var(--foreground)]">Security & Headers:</div>
                  <div className="text-[11px] text-[var(--muted-foreground)] space-y-0.5 font-mono">
                    <div>Content-Type: application/json</div>
                    <div>X-Docora-Signature: HMAC-SHA256 (computed with secret)</div>
                    <div>X-Docora-Event: {testEvent}</div>
                  </div>
                </div>

                {testError && (
                  <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs">
                    {testError}
                  </div>
                )}

                {testResult && (
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>{testResult.success ? 'Delivery Succeeded' : 'Delivery Refused / Failed'}</span>
                      </div>
                      <Badge variant={testResult.success ? 'default' : 'outline'} className="text-[10px]">
                        HTTP {testResult.statusCode || '0'}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--muted-foreground)] block mb-0.5">Response Snippet:</span>
                      <pre className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono overflow-x-auto max-h-24">
                        {testResult.responseBody || '(empty body)'}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestWebhookTarget(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    disabled={isTesting}
                    onClick={handleRunWebhookTest}
                    className="text-xs"
                  >
                    {isTesting ? 'Sending Ping...' : 'Send Test Event'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
