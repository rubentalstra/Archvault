import {
  ReactFlow,
  Panel,
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
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { useHistoryStore } from "#/stores/history-store";
import { nodeTypes } from "#/components/editor/nodes";
import { edgeTypes } from "#/components/editor/edges";
import {
  removeDiagramElement,
  removeDiagramConnection,
  addDiagramConnection,
} from "#/lib/diagram.functions";
import { createConnection, deleteConnection } from "#/lib/connection.functions";
import { EditorToolbar } from "#/components/editor/editor-toolbar";
import { DiagramNavBar } from "#/components/editor/diagram-nav-bar";
import type { DiagramNavBarProps } from "#/components/editor/diagram-nav-bar";
import { EditorContextMenu } from "#/components/editor/context-menu";
import { ShortcutsDialog } from "#/components/editor/shortcuts-dialog";
import { Toggle } from "#/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip";
import { PanelRight } from "lucide-react";
import { m } from "#/paraglide/messages";
import { useAutosave } from "#/hooks/use-autosave";
import { useEditorHotkeys } from "#/hooks/use-editor-hotkeys";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";

type CreatedConnection = { id: string };
type CreatedDiagramConnection = { id: string };

interface DiagramCanvasProps {
  readOnly?: boolean;
  navBar: DiagramNavBarProps;
}

const NODE_COLOR_MAP: Record<string, string> = {
  actor: "#60a5fa",
  system: "#34d399",
  app: "#a78bfa",
  store: "#22c55e",
  component: "#fb923c",
};

function getNodeColor(node: { type?: string }) {
  return NODE_COLOR_MAP[node.type ?? ""] ?? "#94a3b8";
}

export function DiagramCanvas({ readOnly = false, navBar }: DiagramCanvasProps) {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const mode = useEditorStore((s) => s.mode);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showMinimap = useEditorStore((s) => s.showMinimap);
  const propertiesPanelOpen = useEditorStore((s) => s.propertiesPanelOpen);
  const setPropertiesPanelOpen = useEditorStore((s) => s.setPropertiesPanelOpen);
  const setSelection = useEditorStore((s) => s.setSelection);
  const setContextMenu = useEditorStore((s) => s.setContextMenu);
  const addEdge = useEditorStore((s) => s.addEdge);

  const reactFlow = useReactFlow();

  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const removeDiagramConnectionFn = useServerFn(removeDiagramConnection);
  const createConnectionFn = useServerFn(createConnection);
  const deleteConnectionFn = useServerFn(deleteConnection);
  const addDiagramConnectionFn = useServerFn(addDiagramConnection);

  // ── Autosave & Hotkeys ──
  const autosave = useAutosave();
  useEditorHotkeys({ readOnly });

  // ── Drag start: capture pre-drag positions for undo ──
  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, _node: AppNode, draggedNodes: AppNode[]) => {
      dragStartPositionsRef.current = new Map(
        draggedNodes.map((n) => [n.id, { ...n.position }]),
      );
    },
    [],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: AppNode, draggedNodes: AppNode[]) => {
      const beforePositions = dragStartPositionsRef.current;
      if (beforePositions.size === 0) return;

      // Push move action to history
      const beforeNodes = draggedNodes
        .filter((n) => beforePositions.has(n.id))
        .map((n) => ({
          ...n,
          position: beforePositions.get(n.id)!,
        })) as AppNode[];

      const afterNodes = draggedNodes.map((n) => ({ ...n })) as AppNode[];

      useHistoryStore.getState().pushAction({
        type: "move_nodes",
        before: { nodes: beforeNodes },
        after: { nodes: afterNodes },
      });

      dragStartPositionsRef.current = new Map();
    },
    [],
  );

  // ── Resize tracking for undo ──
  const resizeStartRef = useRef<Map<string, { width: number; height: number; x: number; y: number }>>(new Map());

  const onNodesDelete = useCallback(
    (deletedNodes: AppNode[]) => {
      const allNodes = useEditorStore.getState().nodes;
      const currentEdges = useEditorStore.getState().edges;
      const deletedIds = new Set(deletedNodes.map((n) => n.id));

      for (const node of allNodes) {
        if (node.parentId && deletedIds.has(node.parentId)) {
          deletedIds.add(node.id);
        }
      }

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

      const { nodes: storeNodes, edges: storeEdges } = useEditorStore.getState();

      const sourceNode = storeNodes.find((n) => n.id === connection.source);
      const targetNode = storeNodes.find((n) => n.id === connection.target);
      if (sourceNode?.data.isSubFlow || targetNode?.data.isSubFlow) return false;

      return !storeEdges.some(
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

        const sourceAnchor = (connection.sourceHandle ?? "auto") as "auto" | "top" | "bottom" | "left" | "right";
        const targetAnchor = (connection.targetHandle ?? "auto") as "auto" | "top" | "bottom" | "left" | "right";

        const diagramRel = (await addDiagramConnectionFn({
          data: {
            diagramId: store.diagramId,
            connectionId: rel.id,
            sourceAnchor,
            targetAnchor,
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
            sourceAnchor,
            targetAnchor,
            labelPosition: 0.5,
          },
        } as AppEdge;

        addEdge(newEdge);

        // Track in history
        useHistoryStore.getState().pushAction({
          type: "add_edge",
          before: { nodes: [], edges: [] },
          after: { nodes: [], edges: [newEdge] },
        });
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

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, [setContextMenu]);

  const handleNodesChange = useCallback(
    (changes: import("@xyflow/react").NodeChange<AppNode>[]) => {
      // Track resize start for undo
      for (const change of changes) {
        if (change.type === "dimensions" && (change as NodeDimensionChange).resizing === true) {
          const dimChange = change as NodeDimensionChange & { id: string };
          if (!resizeStartRef.current.has(dimChange.id)) {
            const node = useEditorStore.getState().nodes.find((n) => n.id === dimChange.id);
            if (node) {
              resizeStartRef.current.set(dimChange.id, {
                width: node.style?.width ? Number(node.style.width) : 200,
                height: node.style?.height ? Number(node.style.height) : 120,
                x: node.position.x,
                y: node.position.y,
              });
            }
          }
        }
      }

      onNodesChange(changes);

      // Track resize end for undo
      for (const change of changes) {
        if (change.type === "dimensions" && (change as NodeDimensionChange).resizing === false) {
          const dimChange = change as NodeDimensionChange & { id: string };
          const startData = resizeStartRef.current.get(dimChange.id);
          const node = useEditorStore.getState().nodes.find((n) => n.id === dimChange.id);
          if (startData && node) {
            useHistoryStore.getState().pushAction({
              type: "resize_node",
              before: {
                nodes: [{
                  ...node,
                  position: { x: startData.x, y: startData.y },
                  style: { ...node.style, width: startData.width, height: startData.height },
                } as AppNode],
              },
              after: { nodes: [{ ...node } as AppNode] },
            });
          }
          resizeStartRef.current.delete(dimChange.id);
        }
      }
    },
    [onNodesChange],
  );

  // Suppress unused variable warnings — autosave status is passed to toolbar
  void autosave;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={readOnly ? undefined : handleNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onNodeDragStart={readOnly ? undefined : onNodeDragStart}
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
        deleteKeyCode={null}
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
        <DiagramNavBar {...navBar} />
        {!readOnly && <EditorToolbar autosaveStatus={autosave.status} />}
        <Panel position="top-right">
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  size="sm"
                  pressed={propertiesPanelOpen}
                  onPressedChange={setPropertiesPanelOpen}
                  aria-label={propertiesPanelOpen ? m.editor_panel_close() : m.editor_panel_open()}
                  className="rounded-lg border bg-card shadow-sm"
                >
                  <PanelRight className="size-4" />
                </Toggle>
              }
            />
            <TooltipContent side="bottom" className="text-xs">
              {propertiesPanelOpen ? m.editor_panel_close() : m.editor_panel_open()}
            </TooltipContent>
          </Tooltip>
        </Panel>
        <Controls showInteractive={false} />
        {showMinimap && (
          <MiniMap nodeColor={getNodeColor} zoomable pannable />
        )}
        <EditorContextMenu />
      </ReactFlow>
      <ShortcutsDialog />
    </>
  );
}
