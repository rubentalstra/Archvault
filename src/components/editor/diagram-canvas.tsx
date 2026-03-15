import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  SelectionMode,
  ConnectionMode,
  useReactFlow,
} from "@xyflow/react";
import type {
  OnSelectionChangeFunc,
  IsValidConnection,
  OnConnect,
  Connection,
  NodeDimensionChange,
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
import { createConnection, deleteConnection } from "#/lib/connection.functions";
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

export function DiagramCanvas({ readOnly = false }: DiagramCanvasProps) {
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
  const reactFlow = useReactFlow();

  const updateDiagramElementFn = useServerFn(updateDiagramElement);
  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const removeDiagramConnectionFn = useServerFn(removeDiagramConnection);
  const createConnectionFn = useServerFn(createConnection);
  const deleteConnectionFn = useServerFn(deleteConnection);
  const addDiagramConnectionFn = useServerFn(addDiagramConnection);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: AppNode, draggedNodes: AppNode[]) => {
      for (const n of draggedNodes) {
        const internal = reactFlow.getInternalNode(n.id);
        const absPos = internal?.internals.positionAbsolute ?? n.position;
        updateDiagramElementFn({ data: flowNodeToUpdate(n, absPos) });
      }
    },
    [updateDiagramElementFn, reactFlow],
  );

  const onNodesDelete = useCallback(
    (deletedNodes: AppNode[]) => {
      const allNodes = useEditorStore.getState().nodes;
      const currentEdges = useEditorStore.getState().edges;
      const deletedIds = new Set(deletedNodes.map((n) => n.id));

      // Include children that might not be in the deletedNodes list
      for (const node of allNodes) {
        if (node.parentId && deletedIds.has(node.parentId)) {
          deletedIds.add(node.id);
        }
      }

      // Clean up diagram_connection records for edges touching deleted nodes
      // (ReactFlow does NOT fire onEdgesDelete for edges removed as a consequence of node deletion)
      for (const edge of currentEdges) {
        if (deletedIds.has(edge.source) || deletedIds.has(edge.target)) {
          if (edge.data) {
            removeDiagramConnectionFn({ data: { id: edge.data.diagramConnectionId } });
          }
        }
      }

      for (const node of deletedNodes) {
        removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
      }
      // Also delete children not already in deletedNodes
      for (const node of allNodes) {
        if (node.parentId && deletedIds.has(node.parentId) && !deletedNodes.some((d) => d.id === node.id)) {
          removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
        }
      }
    },
    [removeDiagramElementFn, removeDiagramConnectionFn],
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: AppEdge[]) => {
      for (const edge of deletedEdges) {
        if (edge.data) {
          removeDiagramConnectionFn({
            data: { id: edge.data.diagramConnectionId },
          });
          deleteConnectionFn({
            data: { id: edge.data.connectionId },
          });
        }
      }
    },
    [removeDiagramConnectionFn, deleteConnectionFn],
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
      if (connection.source === connection.target) return false;
      const existing = useEditorStore.getState().edges;
      return !existing.some(
        (e) =>
          (e.source === connection.source && e.target === connection.target) ||
          (e.source === connection.target && e.target === connection.source),
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
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
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

  // Persist resize dimensions when a node (parent container or group) is resized
  const handleNodesChange = useCallback(
    (changes: import("@xyflow/react").NodeChange<AppNode>[]) => {
      onNodesChange(changes);

      // After applying changes, check for completed resize operations
      for (const change of changes) {
        if (change.type === "dimensions" && (change as NodeDimensionChange).resizing === false) {
          const dimChange = change as NodeDimensionChange & { id: string };
          const node = useEditorStore.getState().nodes.find((n) => n.id === dimChange.id);
          if (node) {
            const internal = reactFlow.getInternalNode(node.id);
            const absPos = internal?.internals.positionAbsolute ?? node.position;
            updateDiagramElementFn({ data: flowNodeToUpdate(node, absPos) });
          }
        }
      }
    },
    [onNodesChange, updateDiagramElementFn, reactFlow],
  );

  return (
    <ReactFlow
      className={isAddMode ? "cursor-crosshair" : ""}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={readOnly ? undefined : handleNodesChange}
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
      isValidConnection={isValidConnection}
      connectionMode={ConnectionMode.Loose}
      connectionRadius={40}
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
