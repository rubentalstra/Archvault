import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useReactFlow } from "@xyflow/react";
import { useEditorStore } from "#/stores/editor-store";
import { updateDiagramElement } from "#/lib/diagram.functions";
import { useEditorActions } from "#/hooks/use-editor-actions";
import { deleteElement } from "#/lib/element.functions";
import { deleteConnection } from "#/lib/connection.functions";
import {
  validateElementForDiagram,
  validateChildPlacement,
  REQUIRES_PARENT_SUB_FLOW,
} from "#/lib/diagram.validators";
import {
  useCreateElementAtPosition,
  DEFAULT_SIZES,
  findSubFlowParent,
} from "#/components/editor/dnd-context";
import { m } from "#/paraglide/messages";
import { Separator } from "#/components/ui/separator";
import {
  User,
  Box,
  Package,
  Database,
  Cpu,
} from "lucide-react";
import type { ElementType } from "#/lib/element.validators";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";

const ADD_ELEMENT_OPTIONS: {
  type: ElementType;
  label: () => string;
  icon: React.ReactNode;
}[] = [
  { type: "actor", label: () => m.editor_toolbar_add_actor(), icon: <User className="mr-2 size-4" /> },
  { type: "system", label: () => m.editor_toolbar_add_system(), icon: <Box className="mr-2 size-4" /> },
  { type: "app", label: () => m.editor_toolbar_add_app(), icon: <Package className="mr-2 size-4" /> },
  { type: "store", label: () => m.editor_toolbar_add_store(), icon: <Database className="mr-2 size-4" /> },
  { type: "component", label: () => m.editor_toolbar_add_component(), icon: <Cpu className="mr-2 size-4" /> },
];

export function EditorContextMenu() {
  const contextMenu = useEditorStore((s) => s.contextMenu);
  const setContextMenu = useEditorStore((s) => s.setContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "element" | "connection";
    id: string;
    nodeId?: string;
    edgeId?: string;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [contextMenu, setContextMenu]);

  if (!contextMenu)
    return (
      <DeleteConfirmDialog
        confirm={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      />
    );

  return (
    <>
      <div
        ref={menuRef}
        className="fixed z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        style={{ left: contextMenu.position.x, top: contextMenu.position.y }}
      >
        {contextMenu.type === "node" && contextMenu.nodeId && (
          <NodeContextMenuItems
            nodeId={contextMenu.nodeId}
            onDelete={(id, nodeId) => {
              setContextMenu(null);
              setDeleteConfirm({ type: "element", id, nodeId });
            }}
          />
        )}
        {contextMenu.type === "edge" && contextMenu.edgeId && (
          <EdgeContextMenuItems
            edgeId={contextMenu.edgeId}
            onDelete={(id, edgeId) => {
              setContextMenu(null);
              setDeleteConfirm({ type: "connection", id, edgeId });
            }}
          />
        )}
        {contextMenu.type === "pane" && (
          <PaneContextMenuItems position={contextMenu.position} />
        )}
      </div>
      <DeleteConfirmDialog
        confirm={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
      />
    </>
  );
}

function MenuItem({
  onClick,
  children,
  destructive,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const setContextMenu = useEditorStore((s) => s.setContextMenu);
  return (
    <button
      className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 ${
        destructive ? "text-destructive hover:text-destructive" : ""
      }`}
      disabled={disabled}
      onClick={() => {
        onClick();
        setContextMenu(null);
      }}
    >
      {children}
    </button>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Node context menu
// ---------------------------------------------------------------------------

function NodeContextMenuItems({
  nodeId,
  onDelete,
}: {
  nodeId: string;
  onDelete: (elementId: string, nodeId: string) => void;
}) {
  const nodes = useEditorStore((s) => s.nodes);
  const diagramType = useEditorStore((s) => s.diagramType);
  const updateNodeZIndex = useEditorStore((s) => s.updateNodeZIndex);

  const updateDiagramElementFn = useServerFn(updateDiagramElement);
  const createElementAtPosition = useCreateElementAtPosition();
  const { removeNodesWithHistory } = useEditorActions();

  const node = nodes.find((n) => n.id === nodeId);

  const handleBringToFront = useCallback(() => {
    if (!node) return;
    const maxZ = Math.max(...nodes.map((n) => n.zIndex ?? 0));
    const newZ = maxZ + 1;
    updateNodeZIndex(nodeId, newZ);
    void updateDiagramElementFn({
      data: { id: node.data.diagramElementId, zIndex: newZ },
    });
  }, [nodes, nodeId, updateNodeZIndex, updateDiagramElementFn, node]);

  const handleSendToBack = useCallback(() => {
    if (!node) return;
    const minZ = Math.min(...nodes.map((n) => n.zIndex ?? 0));
    const newZ = minZ - 1;
    updateNodeZIndex(nodeId, newZ);
    void updateDiagramElementFn({
      data: { id: node.data.diagramElementId, zIndex: newZ },
    });
  }, [nodes, nodeId, updateNodeZIndex, updateDiagramElementFn, node]);

  const handleDuplicate = useCallback(async () => {
    if (!node) return;
    const flowPos = {
      x: node.position.x + 30,
      y: node.position.y + 30,
    };
    await createElementAtPosition(node.type, flowPos);
  }, [node, createElementAtPosition]);

  const handleRemoveFromDiagram = useCallback(() => {
    if (!node) return;
    removeNodesWithHistory([nodeId]);
  }, [removeNodesWithHistory, node, nodeId]);

  const handleAddInside = useCallback(
    async (type: ElementType) => {
      if (!node) return;
      const containerW = Number(node.style?.width ?? 320);
      const containerH = Number(node.style?.height ?? 220);
      const size = DEFAULT_SIZES[type];
      const flowPos = {
        x: node.position.x + containerW / 2 - size.width / 2,
        y: node.position.y + containerH / 2 - size.height / 2,
      };
      await createElementAtPosition(type, flowPos);
    },
    [node, createElementAtPosition],
  );

  if (!node) return null;

  // Determine which child types can be added inside this sub-flow container
  // Only show types that REQUIRE a sub-flow parent (e.g. app/store in container, component in component diagram)
  const childOptions = node.data.isSubFlow && diagramType
    ? ADD_ELEMENT_OPTIONS.filter(({ type }) =>
        REQUIRES_PARENT_SUB_FLOW[diagramType].includes(type),
      )
    : [];

  return (
    <>
      <MenuItem onClick={handleBringToFront}>
        {m.editor_ctx_bring_to_front()}
      </MenuItem>
      <MenuItem onClick={handleSendToBack}>
        {m.editor_ctx_send_to_back()}
      </MenuItem>
      <Separator className="my-1" />
      <MenuItem onClick={handleDuplicate}>{m.editor_ctx_duplicate()}</MenuItem>
      <MenuItem onClick={handleRemoveFromDiagram}>
        {m.editor_ctx_remove_from_diagram()}
      </MenuItem>
      <MenuItem
        destructive
        onClick={() => onDelete(node.data.elementId, nodeId)}
      >
        {m.editor_ctx_delete_element()}
      </MenuItem>
      {childOptions.length > 0 && (
        <>
          <Separator className="my-1" />
          <MenuLabel>{m.editor_ctx_add_inside()}</MenuLabel>
          {childOptions.map(({ type, label, icon }) => (
            <MenuItem key={type} onClick={() => void handleAddInside(type)}>
              {icon}
              {label()}
            </MenuItem>
          ))}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Edge context menu
// ---------------------------------------------------------------------------

function EdgeContextMenuItems({
  edgeId,
  onDelete,
}: {
  edgeId: string;
  onDelete: (connectionId: string, edgeId: string) => void;
}) {
  const edges = useEditorStore((s) => s.edges);
  const setSelection = useEditorStore((s) => s.setSelection);
  const { removeEdgesWithHistory } = useEditorActions();

  const edge = edges.find((e) => e.id === edgeId);

  const handleEditProperties = useCallback(() => {
    setSelection([], [edgeId]);
  }, [edgeId, setSelection]);

  const handleRemoveFromDiagram = useCallback(() => {
    if (!edge?.data) return;
    removeEdgesWithHistory([edgeId]);
  }, [removeEdgesWithHistory, edge, edgeId]);

  if (!edge?.data) return null;

  return (
    <>
      <MenuItem onClick={handleEditProperties}>
        {m.editor_ctx_edit_properties()}
      </MenuItem>
      <MenuItem onClick={handleRemoveFromDiagram}>
        {m.editor_ctx_remove_from_diagram()}
      </MenuItem>
      <MenuItem
        destructive
        onClick={() => onDelete(edge.data!.connectionId, edgeId)}
      >
        {m.editor_ctx_delete_connection()}
      </MenuItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pane context menu — position-aware element filtering
// ---------------------------------------------------------------------------

function PaneContextMenuItems({
  position,
}: {
  position: { x: number; y: number };
}) {
  const diagramType = useEditorStore((s) => s.diagramType);
  const nodes = useEditorStore((s) => s.nodes);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const reactFlow = useReactFlow();

  const createElementAtPosition = useCreateElementAtPosition();

  // Convert screen position to flow coordinates and detect sub-flow parent
  const flowPos = reactFlow.screenToFlowPosition({
    x: position.x,
    y: position.y,
  });
  const parentNode = findSubFlowParent(flowPos, nodes);
  const parentElementId = parentNode ? parentNode.data.elementId : null;
  const subFlowElementIds = new Set(
    nodes.filter((n) => n.data.isSubFlow).map((n) => n.data.elementId),
  );

  // Split options into top-level and container-child options
  const topLevelOptions = ADD_ELEMENT_OPTIONS.filter(({ type }) => {
    if (!diagramType) return true;
    if (!validateElementForDiagram(diagramType, type).valid) return false;
    return validateChildPlacement(diagramType, type, null, subFlowElementIds)
      .valid;
  });
  // Only show types that REQUIRE a sub-flow parent when clicking inside a container
  const containerOptions = parentNode && diagramType
    ? ADD_ELEMENT_OPTIONS.filter(({ type }) =>
        REQUIRES_PARENT_SUB_FLOW[diagramType].includes(type),
      )
    : [];

  return (
    <>
      {topLevelOptions.map(({ type, label, icon }) => (
        <MenuItem key={type} onClick={() => void createElementAtPosition(type, flowPos)}>
          {icon}
          {label()}
        </MenuItem>
      ))}
      {containerOptions.length > 0 && (
        <>
          <Separator className="my-1" />
          <MenuLabel>{m.editor_ctx_add_inside()}</MenuLabel>
          {containerOptions.map(({ type, label, icon }) => (
            <MenuItem key={type} onClick={() => void createElementAtPosition(type, flowPos)}>
              {icon}
              {label()}
            </MenuItem>
          ))}
        </>
      )}
      <Separator className="my-1" />
      <MenuItem onClick={() => void reactFlow.fitView()}>
        {m.editor_ctx_fit_view()}
      </MenuItem>
      <MenuItem onClick={() => setShowGrid(!showGrid)}>
        {m.editor_ctx_toggle_grid()}
      </MenuItem>
    </>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteConfirmDialog({
  confirm,
  onClose,
}: {
  confirm: {
    type: "element" | "connection";
    id: string;
    nodeId?: string;
    edgeId?: string;
  } | null;
  onClose: () => void;
}) {
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const removeEdgeById = useEditorStore((s) => s.removeEdgeById);
  const deleteElementFn = useServerFn(deleteElement);
  const deleteConnectionFn = useServerFn(deleteConnection);

  const handleConfirm = useCallback(async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "element") {
        await deleteElementFn({ data: { id: confirm.id } });
        if (confirm.nodeId) removeNodeById(confirm.nodeId);
      } else {
        await deleteConnectionFn({ data: { id: confirm.id } });
        if (confirm.edgeId) removeEdgeById(confirm.edgeId);
      }
    } catch {
      toast.error(m.editor_panel_save_failed());
    }
    onClose();
  }, [
    confirm,
    deleteElementFn,
    deleteConnectionFn,
    removeNodeById,
    removeEdgeById,
    onClose,
  ]);

  return (
    <AlertDialog open={!!confirm} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirm?.type === "element"
              ? m.editor_ctx_delete_element()
              : m.editor_ctx_delete_connection()}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirm?.type === "element"
              ? m.editor_ctx_delete_element_confirm()
              : m.editor_ctx_delete_connection_confirm()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {m.common_delete()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
