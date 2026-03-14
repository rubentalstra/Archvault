import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import type { NodeChange, EdgeChange } from "@xyflow/react";
import type { AppNode, AppEdge, BaseNodeData } from "#/lib/types/diagram-nodes";
import type { DiagramType } from "#/lib/diagram.validators";
import type { ElementType } from "#/lib/element.validators";

// ── Context menu state ─────────────────────────────────────────────

export interface ContextMenuState {
  type: "node" | "edge" | "pane";
  position: { x: number; y: number };
  nodeId?: string;
  edgeId?: string;
}

// ── Store types ────────────────────────────────────────────────────

type EditorMode = "select" | "pan" | "add_element" | "add_relationship";

interface EditorState {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  mode: EditorMode;
  addElementType: ElementType | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  diagramId: string | null;
  diagramType: DiagramType | null;
  workspaceId: string | null;
  scopeElementId: string | null;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  showMinimap: boolean;
  propertiesPanelOpen: boolean;
  contextMenu: ContextMenuState | null;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  setMode: (mode: EditorMode) => void;
  setAddElementType: (type: ElementType | null) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  setShowGrid: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  setContextMenu: (menu: ContextMenuState | null) => void;
  addNode: (node: AppNode) => void;
  addEdge: (edge: AppEdge) => void;
  removeNodeById: (id: string) => void;
  removeEdgeById: (id: string) => void;
  updateNodeData: (nodeId: string, data: Partial<BaseNodeData>) => void;
  updateNodeZIndex: (nodeId: string, zIndex: number) => void;
  initDiagram: (params: {
    diagramId: string;
    diagramType: DiagramType;
    workspaceId: string;
    scopeElementId: string | null;
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
  addElementType: null as ElementType | null,
  selectedNodeIds: [] as string[],
  selectedEdgeIds: [] as string[],
  diagramId: null as string | null,
  diagramType: null as DiagramType | null,
  workspaceId: null as string | null,
  scopeElementId: null as string | null,
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  showMinimap: true,
  propertiesPanelOpen: true,
  contextMenu: null as ContextMenuState | null,
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
  setMode: (mode) => {
    if (mode !== "add_element") {
      set({ mode, addElementType: null });
    } else {
      set({ mode });
    }
  },
  setAddElementType: (type) =>
    set({ addElementType: type, mode: type ? "add_element" : "select" }),
  setSelection: (nodeIds, edgeIds) =>
    set({ selectedNodeIds: nodeIds, selectedEdgeIds: edgeIds }),
  setShowGrid: (show) => set({ showGrid: show }),
  setShowMinimap: (show) => set({ showMinimap: show }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  addEdge: (edge) => set({ edges: [...get().edges, edge] }),
  removeNodeById: (id) => {
    const state = get();
    set({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
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
  updateNodeZIndex: (nodeId, zIndex) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, zIndex } : n,
      ),
    }),
  initDiagram: ({ diagramId, diagramType, workspaceId, scopeElementId, nodes, edges, gridSize, snapToGrid }) =>
    set({ diagramId, diagramType, workspaceId, scopeElementId, nodes, edges, gridSize, snapToGrid }),
  reset: () => set(initialState),
}));
