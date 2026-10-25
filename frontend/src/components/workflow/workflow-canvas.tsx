'use client';

import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { WorkflowNode, WorkflowEdge } from '@/types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Play,
  FileText,
  Receipt,
  FileSpreadsheet,
  Split,
  Clock,
  CheckCircle,
  Database,
  Sliders,
  Archive,
  AlertTriangle,
  Send,
  Zap,
} from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'trigger':
    case 'start':
    case 'manual':
      return Play;
    case 'scheduled':
      return Clock;
    case 'webhook':
      return Zap;
    case 'generate_receipt':
      return Receipt;
    case 'generate_invoice':
      return FileText;
    case 'generate_pdf':
      return FileSpreadsheet;
    case 'condition':
      return Split;
    case 'approval':
      return CheckCircle;
    case 'create_zip':
      return Archive;
    case 'delay':
      return Clock;
    case 'log_note':
      return Send;
    case 'stop':
      return AlertTriangle;
    default:
      return Sliders;
  }
};

export function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onNodesChange,
  onEdgesChange,
}: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Edge Connection in progress
  const [connectingSource, setConnectingSource] = useState<{
    nodeId: string;
    handle?: string;
  } | null>(null);

  // Handle Pan Start
  const handleMouseDownBackground = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.workflow-node') || (e.target as HTMLElement).closest('.node-port')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    onSelectNode(null);
  };

  // Handle Pan & Drag Move
  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const updatedNodes = nodes.map((n) => {
        if (n.id === draggingNodeId) {
          const newX = Math.round((e.clientX - pan.x - dragOffset.x) / zoom / 10) * 10;
          const newY = Math.round((e.clientY - pan.y - dragOffset.y) / zoom / 10) * 10;
          return {
            ...n,
            position: { x: Math.max(10, newX), y: Math.max(10, newY) },
          };
        }
        return n;
      });
      onNodesChange(updatedNodes);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node drag start
  const handleNodeMouseDown = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const nodeScreenX = node.position.x * zoom + pan.x;
      const nodeScreenY = node.position.y * zoom + pan.y;
      setDragOffset({
        x: e.clientX - nodeScreenX,
        y: e.clientY - nodeScreenY,
      });
    }
  };

  // Port Click (Connect Nodes)
  const handleOutputPortClick = (e: MouseEvent, nodeId: string, handle?: string) => {
    e.stopPropagation();
    setConnectingSource({ nodeId, handle });
  };

  const handleInputPortClick = (e: MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (!connectingSource || connectingSource.nodeId === targetNodeId) {
      setConnectingSource(null);
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      (edge) =>
        edge.source === connectingSource.nodeId &&
        edge.target === targetNodeId &&
        edge.sourceHandle === connectingSource.handle
    );

    if (!exists) {
      const newEdge: WorkflowEdge = {
        id: `e_${connectingSource.nodeId}_${targetNodeId}_${Date.now()}`,
        source: connectingSource.nodeId,
        target: targetNodeId,
        sourceHandle: connectingSource.handle,
      };
      onEdgesChange([...edges, newEdge]);
    }
    setConnectingSource(null);
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string, e: MouseEvent) => {
    e.stopPropagation();
    onEdgesChange(edges.filter((edge) => edge.id !== edgeId));
  };

  // Zoom Controls
  const handleZoomIn = () => setZoom((z) => Math.min(1.6, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 50, y: 50 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownBackground}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full w-full bg-[var(--background)] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundImage: `radial-gradient(var(--border) 1px, transparent 1px)`,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* Zoom / Viewport Controls Floating Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 rounded-xl bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] shadow-lg text-xs">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono px-1 font-semibold text-[var(--foreground)] min-w-[40px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset View"
          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Connecting in Progress Banner */}
      {connectingSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-neutral-900 text-white text-xs border border-neutral-700 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click target node input port to link connection</span>
          <button
            onClick={() => setConnectingSource(null)}
            className="text-xs text-neutral-400 hover:text-white underline ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* SVG Canvas for Edges */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--foreground)" opacity="0.6" />
          </marker>
        </defs>

        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const isCondition = sourceNode.type === 'condition';
          const isTrueHandle = edge.sourceHandle === 'true';

          // Node dimensions approximation (220px wide, 80px high)
          const sourceX = sourceNode.position.x + 220;
          let sourceY = sourceNode.position.y + 40;
          if (isCondition) {
            sourceY = isTrueHandle ? sourceNode.position.y + 28 : sourceNode.position.y + 54;
          }

          const targetX = targetNode.position.x;
          const targetY = targetNode.position.y + 40;

          const deltaX = Math.max(50, Math.abs(targetX - sourceX) * 0.5);
          const pathData = `M ${sourceX} ${sourceY} C ${sourceX + deltaX} ${sourceY}, ${
            targetX - deltaX
          } ${targetY}, ${targetX} ${targetY}`;

          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;

          return (
            <g key={edge.id} className="group pointer-events-auto cursor-pointer">
              {/* Invisible thicker hover path */}
              <path
                d={pathData}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                onClick={(e) => handleDeleteEdge(edge.id, e)}
              />
              {/* Visible bezier curve */}
              <path
                d={pathData}
                fill="none"
                stroke={isCondition ? (isTrueHandle ? '#10b981' : '#f59e0b') : 'var(--foreground)'}
                strokeWidth={2}
                strokeOpacity={0.7}
                markerEnd="url(#arrow)"
                className="transition-all group-hover:stroke-red-500 group-hover:stroke-[3px]"
              />
              {/* Delete Edge button on hover */}
              <circle
                cx={midX}
                cy={midY}
                r={10}
                className="fill-[var(--card)] stroke-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteEdge(edge.id, e)}
              />
              <text
                x={midX}
                y={midY + 3.5}
                textAnchor="middle"
                fontSize={10}
                className="fill-red-400 font-bold opacity-0 group-hover:opacity-100 pointer-events-none select-none"
              >
                ×
              </text>
            </g>
          );
        })}
      </svg>

      {/* HTML Nodes Canvas Container */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const Icon = getNodeIcon(node.type);
          const isCondition = node.type === 'condition';

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              className={`workflow-node absolute pointer-events-auto w-[220px] rounded-xl border bg-[var(--card)] shadow-md transition-shadow cursor-move ${
                isSelected
                  ? 'border-white ring-2 ring-white/20 shadow-xl'
                  : 'border-[var(--border)] hover:border-neutral-500'
              }`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
              }}
            >
              {/* Input Connection Port (Left) */}
              <div
                onClick={(e) => handleInputPortClick(e, node.id)}
                title="Input Port (Click to connect here)"
                className="node-port absolute -left-2.5 top-[32px] w-5 h-5 rounded-full bg-[var(--surface)] border-2 border-neutral-400 hover:border-white hover:scale-125 transition-all cursor-pointer flex items-center justify-center z-10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)]" />
              </div>

              {/* Node Card Header */}
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--foreground)] truncate">
                      {node.label}
                    </div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                      {node.type}
                    </div>
                  </div>
                </div>

                {/* Subtitle / summary info */}
                {node.type === 'condition' && node.data?.field && (
                  <div className="mt-2 text-[10px] bg-neutral-900/60 p-1.5 rounded border border-neutral-800 text-neutral-400 truncate">
                    {node.data.field} {node.data.operator} {node.data.value}
                  </div>
                )}
                {node.type === 'delay' && node.data?.seconds && (
                  <div className="mt-2 text-[10px] bg-neutral-900/60 p-1.5 rounded border border-neutral-800 text-neutral-400">
                    Sleep: {node.data.seconds}s
                  </div>
                )}
              </div>

              {/* Output Connection Ports (Right) */}
              {isCondition ? (
                <>
                  {/* True Port */}
                  <div
                    onClick={(e) => handleOutputPortClick(e, node.id, 'true')}
                    title="True Branch Output"
                    className="node-port absolute -right-2.5 top-[20px] w-5 h-5 rounded-full bg-emerald-950 border-2 border-emerald-500 hover:scale-125 transition-all cursor-pointer flex items-center justify-center z-10"
                  >
                    <span className="text-[9px] font-bold text-emerald-400">T</span>
                  </div>
                  {/* False Port */}
                  <div
                    onClick={(e) => handleOutputPortClick(e, node.id, 'false')}
                    title="False Branch Output"
                    className="node-port absolute -right-2.5 top-[46px] w-5 h-5 rounded-full bg-amber-950 border-2 border-amber-500 hover:scale-125 transition-all cursor-pointer flex items-center justify-center z-10"
                  >
                    <span className="text-[9px] font-bold text-amber-400">F</span>
                  </div>
                </>
              ) : (
                /* Standard Single Output Port */
                <div
                  onClick={(e) => handleOutputPortClick(e, node.id)}
                  title="Output Port (Click to connect to next node)"
                  className="node-port absolute -right-2.5 top-[32px] w-5 h-5 rounded-full bg-[var(--surface)] border-2 border-neutral-400 hover:border-white hover:scale-125 transition-all cursor-pointer flex items-center justify-center z-10"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Canvas Minimap View (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 w-44 h-32 rounded-xl bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] shadow-lg overflow-hidden p-2 select-none pointer-events-none">
        <div className="text-[9px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] mb-1">
          Minimap
        </div>
        <div className="relative w-full h-[88px] bg-neutral-950 rounded-lg border border-neutral-900 overflow-hidden">
          {nodes.map((n) => (
            <div
              key={n.id}
              className={`absolute w-3.5 h-2 rounded-sm ${
                n.id === selectedNodeId ? 'bg-white' : 'bg-neutral-600'
              }`}
              style={{
                left: `${Math.min(130, Math.max(4, n.position.x * 0.12))}px`,
                top: `${Math.min(65, Math.max(4, n.position.y * 0.12))}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
