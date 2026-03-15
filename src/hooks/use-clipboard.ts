import { useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { useHistoryStore } from "#/stores/history-store";
import { createElement } from "#/lib/element.functions";
import { createConnection } from "#/lib/connection.functions";
import { addDiagramElement, addDiagramConnection } from "#/lib/diagram.functions";
import { DEFAULT_SIZES } from "#/components/editor/dnd-context";
import { m } from "#/paraglide/messages";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";
import type { DiagramType } from "#/lib/diagram.validators";
import type { ReactFlowInstance } from "@xyflow/react";
import type { ElementType, ElementStatus } from "#/lib/element.validators";

interface ClipboardPayload {
  source: "archvault";
  version: 1;
  diagramType: DiagramType;
  workspaceId: string;
  nodes: Array<{
    relativeX: number;
    relativeY: number;
    width: number;
    height: number;
    type: ElementType;
    name: string;
    displayDescription: string | null;
    status: ElementStatus;
    external: boolean;
    isSubFlow: boolean;
    originalId: string;
    parentOriginalId: string | null;
  }>;
  edges: Array<{
    sourceOriginalId: string;
    targetOriginalId: string;
    pathType: string;
    lineStyle: string;
    direction: string;
    description: string | null;
    sourceAnchor: string;
    targetAnchor: string;
  }>;
}

type CreatedElement = {
  id: string;
  name: string;
  status: ElementStatus;
  external: boolean;
};
type CreatedDiagramElement = { id: string };
type CreatedConnection = { id: string };
type CreatedDiagramConnection = { id: string };

export function useClipboard() {
  const clipboardRef = useRef<ClipboardPayload | null>(null);
  const pasteCountRef = useRef(0);

  const createElementFn = useServerFn(createElement);
  const createConnectionFn = useServerFn(createConnection);
  const addDiagramElementFn = useServerFn(addDiagramElement);
  const addDiagramConnectionFn = useServerFn(addDiagramConnection);

  const copy = useCallback(() => {
    const state = useEditorStore.getState();
    if (!state.diagramType || !state.workspaceId) return;
    if (state.selectedNodeIds.length === 0) return;

    const selectedNodes = state.nodes.filter((n) => state.selectedNodeIds.includes(n.id));
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Only include edges where both endpoints are selected
    const selectedEdges = state.edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target),
    );

    // Compute bounding box origin
    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));

    const payload: ClipboardPayload = {
      source: "archvault",
      version: 1,
      diagramType: state.diagramType,
      workspaceId: state.workspaceId,
      nodes: selectedNodes.map((n) => ({
        relativeX: n.position.x - minX,
        relativeY: n.position.y - minY,
        width: n.style?.width ? Number(n.style.width) : DEFAULT_SIZES[n.type as ElementType]?.width ?? 200,
        height: n.style?.height ? Number(n.style.height) : DEFAULT_SIZES[n.type as ElementType]?.height ?? 120,
        type: n.type as ElementType,
        name: n.data.name,
        displayDescription: n.data.displayDescription,
        status: n.data.status,
        external: n.data.external,
        isSubFlow: n.data.isSubFlow,
        originalId: n.id,
        parentOriginalId: n.parentId ?? null,
      })),
      edges: selectedEdges.map((e) => ({
        sourceOriginalId: e.source,
        targetOriginalId: e.target,
        pathType: e.type ?? "curved",
        lineStyle: e.data?.lineStyle ?? "solid",
        direction: e.data?.direction ?? "outgoing",
        description: e.data?.description ?? null,
        sourceAnchor: e.data?.sourceAnchor ?? "auto",
        targetAnchor: e.data?.targetAnchor ?? "auto",
      })),
    };

    clipboardRef.current = payload;
    pasteCountRef.current = 0;

    // Try to write to system clipboard as well (best-effort)
    try {
      void navigator.clipboard.writeText(JSON.stringify(payload));
    } catch {
      // Silently ignore — in-memory clipboard is primary
    }

    toast.success(m.editor_clipboard_copied());
  }, []);

  const paste = useCallback(
    async (reactFlow: ReactFlowInstance) => {
      const payload = clipboardRef.current;
      if (!payload || payload.nodes.length === 0) {
        toast.info(m.editor_clipboard_nothing_to_paste());
        return;
      }

      const state = useEditorStore.getState();
      if (!state.workspaceId || !state.diagramId) return;

      if (state.workspaceId !== payload.workspaceId) {
        toast.error(m.editor_clipboard_wrong_workspace());
        return;
      }

      pasteCountRef.current += 1;
      const offset = pasteCountRef.current * 20;

      try {
        // Compute paste position at viewport center
        const container = document.querySelector(".react-flow");
        const rect = container?.getBoundingClientRect();
        const viewport = reactFlow.getViewport();
        const baseX = rect ? (rect.width / 2 - viewport.x) / viewport.zoom : 100;
        const baseY = rect ? (rect.height / 2 - viewport.y) / viewport.zoom : 100;

        const originalIdToNewNodeId = new Map<string, string>();
        const originalIdToNewElementId = new Map<string, string>();
        const newNodes: AppNode[] = [];
        const newEdges: AppEdge[] = [];

        // Create nodes
        for (const nodeData of payload.nodes) {
          const newElement = (await createElementFn({
            data: {
              workspaceId: state.workspaceId,
              elementType: nodeData.type,
              name: nodeData.name,
            },
          })) as CreatedElement;

          const x = baseX + nodeData.relativeX + offset;
          const y = baseY + nodeData.relativeY + offset;

          const diagramElement = (await addDiagramElementFn({
            data: {
              diagramId: state.diagramId,
              elementId: newElement.id,
              x,
              y,
              width: nodeData.width,
              height: nodeData.height,
            },
          })) as CreatedDiagramElement;

          originalIdToNewNodeId.set(nodeData.originalId, diagramElement.id);
          originalIdToNewElementId.set(nodeData.originalId, newElement.id);

          const newNode: AppNode = {
            id: diagramElement.id,
            type: nodeData.type,
            position: { x, y },
            zIndex: 0,
            data: {
              elementId: newElement.id,
              diagramElementId: diagramElement.id,
              name: newElement.name,
              displayDescription: nodeData.displayDescription,
              status: newElement.status,
              external: newElement.external,
              technologies: [],
              iconTechSlug: null,
              isSubFlow: false,
              deeperDiagrams: [],
            },
          } as unknown as AppNode;

          newNodes.push(newNode);
          useEditorStore.getState().addNode(newNode);
        }

        // Create edges
        for (const edgeData of payload.edges) {
          const newSourceId = originalIdToNewNodeId.get(edgeData.sourceOriginalId);
          const newTargetId = originalIdToNewNodeId.get(edgeData.targetOriginalId);
          const sourceElementId = originalIdToNewElementId.get(edgeData.sourceOriginalId);
          const targetElementId = originalIdToNewElementId.get(edgeData.targetOriginalId);

          if (!newSourceId || !newTargetId || !sourceElementId || !targetElementId) continue;

          const conn = (await createConnectionFn({
            data: {
              workspaceId: state.workspaceId,
              sourceElementId,
              targetElementId,
            },
          })) as CreatedConnection;

          const diagramConn = (await addDiagramConnectionFn({
            data: {
              diagramId: state.diagramId,
              connectionId: conn.id,
              sourceAnchor: edgeData.sourceAnchor as "auto" | "top" | "bottom" | "left" | "right",
              targetAnchor: edgeData.targetAnchor as "auto" | "top" | "bottom" | "left" | "right",
            },
          })) as CreatedDiagramConnection;

          const newEdge: AppEdge = {
            id: diagramConn.id,
            source: newSourceId,
            target: newTargetId,
            type: edgeData.pathType as "curved" | "straight" | "orthogonal",
            markerEnd: { type: "arrowclosed" as const, width: 30, height: 30 },
            data: {
              diagramConnectionId: diagramConn.id,
              connectionId: conn.id,
              description: edgeData.description,
              technologies: [],
              iconTechSlug: null,
              direction: edgeData.direction as "outgoing" | "incoming" | "bidirectional" | "none",
              lineStyle: edgeData.lineStyle as "solid" | "dashed" | "dotted",
              sourceAnchor: edgeData.sourceAnchor as "auto" | "top" | "bottom" | "left" | "right",
              targetAnchor: edgeData.targetAnchor as "auto" | "top" | "bottom" | "left" | "right",
              labelPosition: 0.5,
            },
          } as AppEdge;

          newEdges.push(newEdge);
          useEditorStore.getState().addEdge(newEdge);
        }

        // Select pasted elements
        useEditorStore.getState().setSelection(
          newNodes.map((n) => n.id),
          newEdges.map((e) => e.id),
        );

        // Push single history action
        useHistoryStore.getState().pushAction({
          type: "add_node",
          before: { nodes: [], edges: [] },
          after: { nodes: newNodes, edges: newEdges },
        });

        toast.success(m.editor_clipboard_pasted());
      } catch {
        toast.error(m.editor_clipboard_paste_failed());
      }
    },
    [createElementFn, createConnectionFn, addDiagramElementFn, addDiagramConnectionFn],
  );

  const duplicate = useCallback(
    async (reactFlow: ReactFlowInstance) => {
      // Copy in-memory then immediately paste with a small offset
      copy();
      if (clipboardRef.current) {
        pasteCountRef.current = 0; // Reset so first duplicate is at +20
        await paste(reactFlow);
      }
    },
    [copy, paste],
  );

  return { copy, paste, duplicate };
}
