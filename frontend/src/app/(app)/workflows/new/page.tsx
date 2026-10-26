'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Play,
  CheckCircle,
  Layout,
  List,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/header';
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas';
import { WorkflowStepList } from '@/components/workflow/workflow-step-list';
import { WorkflowNodeLibrary } from '@/components/workflow/workflow-node-library';
import { WorkflowConfigPanel } from '@/components/workflow/workflow-config-panel';
import { WorkflowDryRunModal } from '@/components/workflow/workflow-dryrun-modal';
import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '@/types';
import { api } from '@/lib/api';

function NewWorkflowBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  // Workflow State
  const [name, setName] = useState('New Document Pipeline');
  const [description, setDescription] = useState('Automated document processing workflow.');
  const [category, setCategory] = useState('General');
  const [triggerType, setTriggerType] = useState('manual');
  const [isActive, setIsActive] = useState(true);

  // Graph Definition State
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node_start',
      type: 'trigger',
      label: 'Manual Trigger',
      position: { x: 80, y: 120 },
      data: {},
    },
    {
      id: 'node_validate',
      type: 'validate_fields',
      label: 'Validate Client & Total',
      position: { x: 340, y: 120 },
      data: { requiredFields: ['customerName'] },
    },
    {
      id: 'node_receipt',
      type: 'generate_receipt',
      label: 'Generate Receipt PDF',
      position: { x: 600, y: 120 },
      data: { currency: 'USD' },
    },
  ]);

  const [edges, setEdges] = useState<WorkflowEdge[]>([
    { id: 'e1', source: 'node_start', target: 'node_validate' },
    { id: 'e2', source: 'node_validate', target: 'node_receipt' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDryRunOpen, setIsDryRunOpen] = useState(false);

  // Load Template if specified in query
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (tId: string) => {
    try {
      const templates = await api.getWorkflowTemplates();
      const match = templates.find((t) => t.id === tId);
      if (match) {
        setName(match.name);
        setDescription(match.description);
        setCategory(match.category);
        setTriggerType(match.triggerType);
        if (match.definition?.nodes) setNodes(match.definition.nodes);
        if (match.definition?.edges) setEdges(match.definition.edges);
        setSuccessMsg(`Loaded template "${match.name}"`);
      }
    } catch {}
  };

  // Add Node from Library
  const handleAddNode = (type: string, label: string, defaultData: Record<string, any>) => {
    const newId = `node_${type}_${Date.now()}`;
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x), 50);
    const maxY = nodes.reduce((max, n) => Math.max(max, n.position.y), 100);

    const newNode: WorkflowNode = {
      id: newId,
      type,
      label,
      position: { x: maxX + 180, y: maxY },
      data: defaultData,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);

    // Auto-link to last node if appropriate
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge: WorkflowEdge = {
        id: `e_${lastNode.id}_${newId}`,
        source: lastNode.id,
        target: newId,
      };
      setEdges((prev) => [...prev, newEdge]);
    }
  };

  const handleUpdateNode = (updated: WorkflowNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleReorderStep = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const next = [...nodes];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setNodes(next);
  };

  const handleSaveWorkflow = async (activateImmediately: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!name.trim()) {
      setErrorMsg('Workflow name is required.');
      return;
    }
    if (nodes.length === 0) {
      setErrorMsg('Workflow must contain at least one node.');
      return;
    }

    setSaving(true);
    try {
      const definition: WorkflowDefinition = {
        nodes,
        edges,
      };

      const res = await api.createWorkflow({
        name,
        description,
        category,
        triggerType,
        definition,
        isActive: activateImmediately,
      });

      setSuccessMsg('Workflow saved successfully!');
      setTimeout(() => {
        router.push(`/workflows`);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[var(--background)]">
      <Header
        title={name || 'New Document Pipeline'}
        description={`Category: ${category} • Trigger: ${triggerType}`}
        backHref="/workflows"
        hideWorkspaceSelector
      >
        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Canvas vs Step List */}
          <div className="p-0.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center">
            <button
              onClick={() => setViewMode('canvas')}
              title="Visual Canvas Editor"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Accessible Step List"
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Step List</span>
            </button>
          </div>

          {/* Test Dry Run */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDryRunOpen(true)}
            className="text-xs h-8 font-semibold hidden md:inline-flex"
          >
            <Activity className="w-3.5 h-3.5 mr-1" /> Test Run
          </Button>

          {/* Save Draft */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveWorkflow(false)}
            disabled={saving}
            className="text-xs h-8 font-semibold"
          >
            Save Draft
          </Button>

          {/* Activate & Save */}
          <Button
            size="sm"
            onClick={() => handleSaveWorkflow(true)}
            disabled={saving}
            className="text-xs h-8 bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Saving...' : 'Activate'}
          </Button>
        </div>
      </Header>

      {/* Error or Success notification toast */}
      {errorMsg && (
        <div className="p-2.5 bg-red-950/20 border-b border-red-900/50 text-red-400 text-xs flex items-center gap-2 px-4 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-2.5 bg-emerald-950/20 border-b border-emerald-900/50 text-emerald-400 text-xs flex items-center gap-2 px-4 shrink-0">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Builder Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Node Library */}
        <WorkflowNodeLibrary onAddNode={handleAddNode} />

        {/* Center: Canvas or Step List */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {viewMode === 'canvas' ? (
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
            />
          ) : (
            <WorkflowStepList
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onDeleteNode={handleDeleteNode}
              onReorderStep={handleReorderStep}
            />
          )}
        </div>

        {/* Right Sidebar: Config Panel */}
        <WorkflowConfigPanel
          node={selectedNode}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Dry Run Modal */}
      {isDryRunOpen && (
        <WorkflowDryRunModal
          isOpen={isDryRunOpen}
          onClose={() => setIsDryRunOpen(false)}
          definition={{ nodes, edges }}
        />
      )}
    </div>
  );
}

export default function NewWorkflowPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-center text-neutral-400">Loading builder...</div>}>
      <NewWorkflowBuilderContent />
    </Suspense>
  );
}
