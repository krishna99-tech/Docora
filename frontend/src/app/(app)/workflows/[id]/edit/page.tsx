'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  Calendar,
  Layers,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Header } from '@/components/layout/header';
import { WorkflowCanvas } from '@/components/workflow/workflow-canvas';
import { WorkflowStepList } from '@/components/workflow/workflow-step-list';
import { WorkflowNodeLibrary } from '@/components/workflow/workflow-node-library';
import { WorkflowConfigPanel } from '@/components/workflow/workflow-config-panel';
import { WorkflowDryRunModal } from '@/components/workflow/workflow-dryrun-modal';
import { WorkflowScheduleModal } from '@/components/workflow/workflow-schedule-modal';
import { WorkflowVersionModal } from '@/components/workflow/workflow-version-modal';
import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '@/types';
import { api } from '@/lib/api';

export default function EditWorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [triggerType, setTriggerType] = useState('manual');
  const [isActive, setIsActive] = useState(true);
  const [version, setVersion] = useState(1);

  // Graph Definition State
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isDryRunOpen, setIsDryRunOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    setLoading(true);
    try {
      const wf = await api.getWorkflow(id);
      setName(wf.name);
      setDescription(wf.description || '');
      setCategory(wf.category || 'General');
      setTriggerType(wf.triggerType || 'manual');
      setIsActive(wf.isActive);
      setVersion(wf.version || 1);

      let def: WorkflowDefinition = { nodes: [], edges: [] };
      if (typeof wf.definition === 'string') {
        def = JSON.parse(wf.definition);
      } else if (wf.definition) {
        def = wf.definition as WorkflowDefinition;
      }

      setNodes(def.nodes || []);
      setEdges(def.edges || []);
    } catch (err: any) {
      setErrorMsg(`Failed to load workflow: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveWorkflow = async () => {
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

      const updated = await api.updateWorkflow(id, {
        name,
        description,
        category,
        triggerType,
        definition,
        isActive,
        changeSummary: `Updated workflow structure in visual builder`,
      });

      setVersion(updated.version);
      setSuccessMsg(`Workflow saved successfully (v${updated.version})!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkflow = async () => {
    const ok = await confirm({
      title: 'Delete Workflow',
      message: 'Are you sure you want to delete this workflow permanently? All version history and scheduled triggers will be removed.',
      itemName: name,
      itemType: 'Workflow Pipeline',
      confirmText: 'Delete Workflow',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.deleteWorkflow(id);
      router.push('/workflows');
    } catch (err: any) {
      setErrorMsg(`Failed to delete workflow: ${err.message}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-xs text-[var(--muted-foreground)]">
        Loading workflow editor...
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[var(--background)]">
      <Header
        title={name || 'Edit Workflow'}
        description={`Category: ${category} • Version ${version}`}
        backHref="/workflows"
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

          {/* Version History */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVersionsOpen(true)}
            className="text-xs h-8 font-semibold hidden md:inline-flex"
          >
            <Calendar className="w-3.5 h-3.5 mr-1" /> Revisions
          </Button>

          {/* Schedule Configuration */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="text-xs h-8 font-semibold hidden lg:inline-flex"
          >
            <Clock className="w-3.5 h-3.5 mr-1" /> Schedule
          </Button>

          {/* Test Dry Run */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDryRunOpen(true)}
            className="text-xs h-8 font-semibold hidden sm:inline-flex"
          >
            <Activity className="w-3.5 h-3.5 mr-1" /> Test Run
          </Button>

          {/* Delete Workflow */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteWorkflow}
            disabled={deleting}
            className="text-xs h-8 font-semibold border-red-900/40 text-red-400 hover:bg-red-950/20 hover:text-red-300"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>

          {/* Save Changes */}
          <Button
            size="sm"
            onClick={handleSaveWorkflow}
            disabled={saving}
            className="text-xs h-8 bg-white text-black hover:bg-neutral-200 font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Saving...' : 'Save Updates'}
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
          workflowId={id}
          definition={{ nodes, edges }}
        />
      )}

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <WorkflowScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          workflowId={id}
        />
      )}

      {/* Version History Modal */}
      {isVersionsOpen && (
        <WorkflowVersionModal
          isOpen={isVersionsOpen}
          onClose={() => setIsVersionsOpen(false)}
          workflowId={id}
          onRestored={loadWorkflow}
        />
      )}
    </div>
  );
}
