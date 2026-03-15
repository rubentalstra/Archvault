import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { NodeChange, EdgeChange } from "@xyflow/react";
import type { AppNode, AppEdge, BaseNodeData, ConnectionEdgeData } from "#/lib/types/diagram-nodes";
import type { DiagramType } from "#/lib/diagram.validators";

// ── Context menu state ─────────────────────────────────────────────

export interface ContextMenuState {
  type: "node" | "edge" | "pane";
  position: { x: number; y: number };
  nodeId?: string;
  edgeId?: string;
}

// ── Topological sort ──────────────────────────────────────────────

function sortNodesTopologically(nodes: AppNode[]): AppNode[] {
  const result: AppNode[] = [];
  const placed = new Set<string>();
  let remaining = [...nodes];

  while (remaining.length > 0) {
    const next = remaining.filter((n) => !n.parentId || placed.has(n.parentId));
    if (next.length === 0) break;
    for (const n of next) {
      result.push(n);
      placed.add(n.id);
    }
    remaining = remaining.filter((n) => !placed.has(n.id));
  }
  result.push(...remaining);
  return result;
}

// ── Store types ────────────────────────────────────────────────────

type EditorMode = "select" | "pan" | "add_connection";

interface EditorState {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  mode: EditorMode;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  diagramId: string | null;
  diagramType: DiagramType | null;
  workspaceId: string | null;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showMinimap: boolean;
  propertiesPanelOpen: boolean;
  elementPickerOpen: boolean;
  contextMenu: ContextMenuState | null;
  shortcutsDialogOpen: boolean;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  setMode: (mode: EditorMode) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  toggleElementPicker: () => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  setShortcutsDialogOpen: (open: boolean) => void;
  addNode: (node: AppNode) => void;
  addEdge: (edge: AppEdge) => void;
  removeNodeById: (id: string) => void;
  removeEdgeById: (id: string) => void;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
  updateEdgeData: (edgeId: string, data: Partial<ConnectionEdgeData>) => void;
  updateNodeZIndex: (nodeId: string, zIndex: number) => void;
  initDiagram: (params: {
    diagramId: string;
    diagramType: DiagramType;
    workspaceId: string;
    nodes: AppNode[];
    edges: AppEdge[];
    gridSize: number;
    snapToGrid: boolean;
  }) => void;
  reset: () => void;
}

const initialState = {
  nodes: [] as AppNode[],
  edges: [] as AppEdge[],
  mode: "select" as EditorMode,
  selectedNodeIds: [] as string[],
  selectedEdgeIds: [] as string[],
  diagramId: null as string | null,
  diagramType: null as DiagramType | null,
  workspaceId: null as string | null,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  showMinimap: true,
  propertiesPanelOpen: true,
  elementPickerOpen: false,
  contextMenu: null as ContextMenuState | null,
  shortcutsDialogOpen: false,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setMode: (mode) => set({ mode }),
  setSelection: (nodeIds, edgeIds) =>
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  toggleElementPicker: () => set((s) => ({ elementPickerOpen: !s.elementPickerOpen })),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setShortcutsDialogOpen: (open) => set({ shortcutsDialogOpen: open }),
  addNode: (node) => set({ nodes: sortNodesTopologically([...get().nodes, node]) }),
  addEdge: (edge) => set({ edges: [...get().edges, edge] }),
  removeNodeById: (id) => {
    const state = get();
    // Cascade: also remove children of the deleted node
    const childIds = new Set(state.nodes.filter((n) => n.parentId === id).map((n) => n.id));
    const allIds = new Set([id, ...childIds]);
    set({
      nodes: state.nodes.filter((n) => !allIds.has(n.id)),
      edges: state.edges.filter((e) => !allIds.has(e.source) && !allIds.has(e.target)),
    });
  },
  removeEdgeById: (id) =>
    set({ edges: get().edges.filter((e) => e.id !== id) }),
  updateNodeData: (nodeId, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? ({ ...n, data: { ...n.data, ...data } } as AppNode) : n,
      ),
    }),
  updateEdgeData: (edgeId, data) =>
    set({
      edges: get().edges.map((e) =>
        e.id === edgeId ? ({ ...e, data: { ...e.data, ...data } } as AppEdge) : e,
      ),
    }),
  updateNodeZIndex: (nodeId, zIndex) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, zIndex } : n,
      ),
    }),
  initDiagram: ({ diagramId, diagramType, workspaceId, nodes, edges, gridSize, snapToGrid }) =>
    set({ diagramId, diagramType, workspaceId, nodes, edges, gridSize, snapToGrid }),
  reset: () => set(initialState),
}));
