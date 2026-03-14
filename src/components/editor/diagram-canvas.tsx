import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  ConnectionMode,
} from "@xyflow/react";
import type {
  OnSelectionChangeFunc,
  IsValidConnection,
  OnConnect,
  Connection,
} from "@xyflow/react";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { nodeTypes } from "#/components/editor/nodes";
import { edgeTypes } from "#/components/editor/edges";
import {
  updateDiagramElement,
  removeDiagramElement,
  removeDiagramConnection,
  addDiagramConnection,
} from "#/lib/diagram.functions";
import { createConnection } from "#/lib/connection.functions";
import { flowNodeToUpdate } from "#/lib/converters/flow-to-diagram";
import { EditorToolbar } from "#/components/editor/editor-toolbar";
import { EditorContextMenu } from "#/components/editor/context-menu";
import { useAddElement } from "#/components/editor/use-add-element";
import { m } from "#/paraglide/messages";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";

type CreatedConnection = { id: string };
type CreatedDiagramConnection = { id: string };

interface DiagramCanvasProps {
  readOnly?: boolean;
  onNodeDoubleClick?: (event: React.MouseEvent, node: AppNode) => void;
}

const NODE_COLOR_MAP: Record<string, string> = {
  actor: "#60a5fa",
  group: "#94a3b8",
  system: "#34d399",
  app: "#a78bfa",
  store: "#22c55e",
  component: "#fb923c",
};

function getNodeColor(node: { type?: string }) {
  return NODE_COLOR_MAP[node.type ?? ""] ?? "#94a3b8";
}

export function DiagramCanvas({ readOnly = false, onNodeDoubleClick }: DiagramCanvasProps) {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const mode = useEditorStore((s) => s.mode);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showMinimap = useEditorStore((s) => s.showMinimap);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setContextMenu = useEditorStore((s) => s.setContextMenu);
  const addEdge = useEditorStore((s) => s.addEdge);

  const { onPaneClick: onAddElementPaneClick, isAddMode } = useAddElement();

  const updateDiagramElementFn = useServerFn(updateDiagramElement);
  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const removeDiagramConnectionFn = useServerFn(removeDiagramConnection);
  const createConnectionFn = useServerFn(createConnection);
  const addDiagramConnectionFn = useServerFn(addDiagramConnection);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: AppNode) => {
      const update = flowNodeToUpdate(node);
      updateDiagramElementFn({ data: update });
    },
    [updateDiagramElementFn],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: AppNode[]) => {
      for (const node of deletedNodes) {
        removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
      }
    },
    [removeDiagramElementFn],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: AppEdge[]) => {
      for (const edge of deletedEdges) {
        if (edge.data) {
          removeDiagramConnectionFn({
            data: { id: edge.data.diagramConnectionId },
          });
        }
      }
    },
    [removeDiagramConnectionFn],
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      setSelection(
        selectedNodes.map((n) => n.id),
        selectedEdges.map((e) => e.id),
      );
    },
    [setSelection],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection: Connection | { source: string; target: string }) => {
      // Prevent self-connections
      if (connection.source === connection.target) return false;
      // Prevent duplicate edges
      const existing = useEditorStore.getState().edges;
      return !existing.some(
        (e) => e.source === connection.source && e.target === connection.target,
      );
    },
    [],
  );

  const onConnect: OnConnect = useCallback(
    async (connection) => {
      const store = useEditorStore.getState();
      if (!store.workspaceId || !store.diagramId) return;

      const sourceNode = store.nodes.find((n) => n.id === connection.source);
      const targetNode = store.nodes.find((n) => n.id === connection.target);
      if (!sourceNode || !targetNode) return;

      try {
        const rel = (await createConnectionFn({
          data: {
            workspaceId: store.workspaceId,
            sourceElementId: sourceNode.data.elementId,
            targetElementId: targetNode.data.elementId,
          },
        })) as CreatedConnection;

        const diagramRel = (await addDiagramConnectionFn({
          data: {
            diagramId: store.diagramId,
            connectionId: rel.id,
          },
        })) as CreatedDiagramConnection;

        const newEdge: AppEdge = {
          id: diagramRel.id,
          source: connection.source,
          target: connection.target,
          type: "curved",
          markerEnd: { type: "arrowclosed" as const, width: 30, height: 30 },
          data: {
            diagramConnectionId: diagramRel.id,
            connectionId: rel.id,
            description: null,
            technologies: [],
            iconTechSlug: null,
            direction: "outgoing",
            lineStyle: "solid",
            sourceAnchor: "auto",
            targetAnchor: "auto",
            labelPosition: 0.5,
          },
        } as AppEdge;

        addEdge(newEdge);
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [createConnectionFn, addDiagramConnectionFn, addEdge],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: AppNode) => {
      event.preventDefault();
      setContextMenu({
        type: "node",
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
      });
    },
    [setContextMenu],
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: AppEdge) => {
      event.preventDefault();
      setContextMenu({
        type: "edge",
        position: { x: event.clientX, y: event.clientY },
        edgeId: edge.id,
      });
    },
    [setContextMenu],
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setContextMenu({
        type: "pane",
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [setContextMenu],
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      setContextMenu(null);
      if (isAddMode) {
        onAddElementPaneClick(event);
      }
    },
    [setContextMenu, isAddMode, onAddElementPaneClick],
  );

  // Unused for now but keeping the callback reference for future NodeResizer onResizeEnd
  const onResizeEnd = useCallback(
    (_event: unknown, { id }: { id: string }) => {
      const node = useEditorStore.getState().nodes.find((n) => n.id === id);
      if (node) {
        const update = flowNodeToUpdate(node);
        updateDiagramElementFn({ data: update });
      }
    },
    [updateDiagramElementFn],
  );
  void onResizeEnd;

  return (
    <ReactFlow
      className={isAddMode ? "cursor-crosshair" : ""}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={readOnly ? undefined : onNodesChange}
      onEdgesChange={readOnly ? undefined : onEdgesChange}
      onNodeDragStop={readOnly ? undefined : onNodeDragStop}
      onNodesDelete={readOnly ? undefined : onNodesDelete}
      onEdgesDelete={readOnly ? undefined : onEdgesDelete}
      onConnect={readOnly ? undefined : onConnect}
      onSelectionChange={onSelectionChange}
      onNodeContextMenu={readOnly ? undefined : onNodeContextMenu}
      onEdgeContextMenu={readOnly ? undefined : onEdgeContextMenu}
      onPaneContextMenu={readOnly ? undefined : onPaneContextMenu}
      onPaneClick={handlePaneClick}
      onNodeDoubleClick={onNodeDoubleClick}
      isValidConnection={isValidConnection}
      connectionMode={ConnectionMode.Loose}
      colorMode="system"
      snapToGrid={snapToGrid}
      snapGrid={[gridSize, gridSize]}
      fitView
      selectNodesOnDrag={false}
      selectionMode={SelectionMode.Partial}
      panOnDrag={mode === "pan" ? true : [1]}
      selectionOnDrag={mode === "select"}
      deleteKeyCode={readOnly ? null : "Backspace"}
      selectionKeyCode="Shift"
      panActivationKeyCode="Space"
      nodesDraggable={mode === "select" && !readOnly}
      nodesConnectable={(mode === "select" || mode === "add_connection") && !readOnly}
      elementsSelectable={!readOnly}
      elevateEdgesOnSelect
    >
      {showGrid && (
        <Background variant={BackgroundVariant.Dots} gap={gridSize} />
      )}
      {!readOnly && <EditorToolbar />}
      <Controls showInteractive={false} />
      {showMinimap && (
        <MiniMap nodeColor={getNodeColor} zoomable pannable />
      )}
      <EditorContextMenu />
    </ReactFlow>
  );
}
