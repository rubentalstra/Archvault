import { useCallback, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import {
  updateDiagramElement,
  removeDiagramElement,
  addDiagramElement,
} from "#/lib/diagram.functions";
import {
  removeDiagramConnection,
} from "#/lib/diagram.functions";
import {
  createElement,
  deleteElement,
} from "#/lib/element.functions";
import { deleteConnection } from "#/lib/connection.functions";
import { validateElementForDiagram } from "#/lib/diagram.validators";
import { m } from "#/paraglide/messages";
import { Separator } from "#/components/ui/separator";
import { useReactFlow } from "@xyflow/react";
import type { AppNode } from "#/lib/types/diagram-nodes";
import type { ElementStatus, ElementType } from "#/lib/element.validators";
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
import { useState } from "react";

type CreatedElement = { id: string; name: string; status: ElementStatus; external: boolean };
type CreatedDiagramElement = { id: string };

const DEFAULT_SIZES: Record<ElementType, { width: number; height: number }> = {
  actor: { width: 160, height: 100 },
  group: { width: 320, height: 220 },
  system: { width: 200, height: 120 },
  app: { width: 180, height: 110 },
  store: { width: 180, height: 110 },
  component: { width: 160, height: 100 },
};

const ELEMENT_TYPES: ElementType[] = ["actor", "group", "system", "app", "store", "component"];

const ELEMENT_LABELS: Record<ElementType, () => string> = {
  actor: () => m.editor_toolbar_add_actor(),
  group: () => m.element_type_system(),
  system: () => m.editor_toolbar_add_system(),
  app: () => m.editor_toolbar_add_app(),
  store: () => m.editor_toolbar_add_store(),
  component: () => m.editor_toolbar_add_component(),
};

const NEW_ELEMENT_NAMES: Record<ElementType, () => string> = {
  actor: () => m.editor_new_actor(),
  group: () => m.editor_new_system(),
  system: () => m.editor_new_system(),
  app: () => m.editor_new_app(),
  store: () => m.editor_new_store(),
  component: () => m.editor_new_component(),
};

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

  if (!contextMenu) return (
    <DeleteConfirmDialog confirm={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
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
      <DeleteConfirmDialog confirm={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
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

function NodeContextMenuItems({
  nodeId,
  onDelete,
}: {
  nodeId: string;
  onDelete: (elementId: string, nodeId: string) => void;
}) {
  const nodes = useEditorStore((s) => s.nodes);
  const updateNodeZIndex = useEditorStore((s) => s.updateNodeZIndex);
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const addNode = useEditorStore((s) => s.addNode);

  const updateDiagramElementFn = useServerFn(updateDiagramElement);
  const removeDiagramElementFn = useServerFn(removeDiagramElement);
  const createElementFn = useServerFn(createElement);
  const addDiagramElementFn = useServerFn(addDiagramElement);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const handleBringToFront = useCallback(() => {
    const maxZ = Math.max(...nodes.map((n) => n.zIndex ?? 0));
    const newZ = maxZ + 1;
    updateNodeZIndex(nodeId, newZ);
    updateDiagramElementFn({ data: { id: node.data.diagramElementId, zIndex: newZ } });
  }, [nodes, nodeId, updateNodeZIndex, updateDiagramElementFn, node.data.diagramElementId]);

  const handleSendToBack = useCallback(() => {
    const minZ = Math.min(...nodes.map((n) => n.zIndex ?? 0));
    const newZ = minZ - 1;
    updateNodeZIndex(nodeId, newZ);
    updateDiagramElementFn({ data: { id: node.data.diagramElementId, zIndex: newZ } });
  }, [nodes, nodeId, updateNodeZIndex, updateDiagramElementFn, node.data.diagramElementId]);

  const handleDuplicate = useCallback(async () => {
    const store = useEditorStore.getState();
    if (!store.workspaceId || !store.diagramId) return;
    try {
      const newElement = (await createElementFn({
        data: {
          workspaceId: store.workspaceId,
          elementType: node.type as ElementType,
          name: `Copy of ${node.data.name}`,
        },
      })) as CreatedElement;
      const size = DEFAULT_SIZES[node.type as ElementType];
      const diagramElement = (await addDiagramElementFn({
        data: {
          diagramId: store.diagramId,
          elementId: newElement.id,
          x: node.position.x + 30,
          y: node.position.y + 30,
          width: Number(node.style?.width ?? size.width),
          height: Number(node.style?.height ?? size.height),
        },
      })) as CreatedDiagramElement;
      const newNode: AppNode = {
        id: diagramElement.id,
        type: node.type,
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        ...(node.type === "group" ? { style: { width: Number(node.style?.width ?? size.width), height: Number(node.style?.height ?? size.height) } } : {}),
        zIndex: 0,
        data: {
          elementId: newElement.id,
          diagramElementId: diagramElement.id,
          name: newElement.name,
          displayDescription: null,
          status: newElement.status,
          external: newElement.external,
          ...(node.type === "group" ? { isScope: false } : {}),
        },
      } as AppNode;
      addNode(newNode);
    } catch {
      toast.error(m.editor_panel_save_failed());
    }
  }, [node, createElementFn, addDiagramElementFn, addNode]);

  const handleRemoveFromDiagram = useCallback(() => {
    removeDiagramElementFn({ data: { id: node.data.diagramElementId } });
    removeNodeById(nodeId);
  }, [removeDiagramElementFn, node.data.diagramElementId, removeNodeById, nodeId]);

  return (
    <>
      <MenuItem onClick={handleBringToFront}>{m.editor_ctx_bring_to_front()}</MenuItem>
      <MenuItem onClick={handleSendToBack}>{m.editor_ctx_send_to_back()}</MenuItem>
      <Separator className="my-1" />
      <MenuItem onClick={handleDuplicate}>{m.editor_ctx_duplicate()}</MenuItem>
      <MenuItem onClick={handleRemoveFromDiagram}>{m.editor_ctx_remove_from_diagram()}</MenuItem>
      <MenuItem
        destructive
        onClick={() => onDelete(node.data.elementId, nodeId)}
      >
        {m.editor_ctx_delete_element()}
      </MenuItem>
    </>
  );
}

function EdgeContextMenuItems({
  edgeId,
  onDelete,
}: {
  edgeId: string;
  onDelete: (connectionId: string, edgeId: string) => void;
}) {
  const edges = useEditorStore((s) => s.edges);
  const removeEdgeById = useEditorStore((s) => s.removeEdgeById);
  const setSelection = useEditorStore((s) => s.setSelection);
  const removeDiagramConnectionFn = useServerFn(removeDiagramConnection);

  const edge = edges.find((e) => e.id === edgeId);
  if (!edge?.data) return null;

  const handleEditProperties = useCallback(() => {
    setSelection([], [edgeId]);
  }, [edgeId, setSelection]);

  const handleRemoveFromDiagram = useCallback(() => {
    removeDiagramConnectionFn({ data: { id: edge.data!.diagramConnectionId } });
    removeEdgeById(edgeId);
  }, [removeDiagramConnectionFn, edge.data, removeEdgeById, edgeId]);

  return (
    <>
      <MenuItem onClick={handleEditProperties}>{m.editor_ctx_edit_properties()}</MenuItem>
      <MenuItem onClick={handleRemoveFromDiagram}>{m.editor_ctx_remove_from_diagram()}</MenuItem>
      <MenuItem
        destructive
        onClick={() => onDelete(edge.data!.connectionId, edgeId)}
      >
        {m.editor_ctx_delete_connection()}
      </MenuItem>
    </>
  );
}

function PaneContextMenuItems({ position }: { position: { x: number; y: number } }) {
  const diagramType = useEditorStore((s) => s.diagramType);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const addNode = useEditorStore((s) => s.addNode);
  const reactFlow = useReactFlow();

  const createElementFn = useServerFn(createElement);
  const addDiagramElementFn = useServerFn(addDiagramElement);

  const handleAddElement = useCallback(
    async (type: ElementType) => {
      const store = useEditorStore.getState();
      if (!store.workspaceId || !store.diagramId) return;

      const flowPos = reactFlow.screenToFlowPosition({ x: position.x, y: position.y });

      try {
        const newElement = (await createElementFn({
          data: {
            workspaceId: store.workspaceId,
            elementType: type,
            name: NEW_ELEMENT_NAMES[type](),
          },
        })) as CreatedElement;
        const size = DEFAULT_SIZES[type];
        const diagramElement = (await addDiagramElementFn({
          data: {
            diagramId: store.diagramId,
            elementId: newElement.id,
            x: flowPos.x,
            y: flowPos.y,
            width: size.width,
            height: size.height,
          },
        })) as CreatedDiagramElement;
        const newNode: AppNode = {
          id: diagramElement.id,
          type,
          position: { x: flowPos.x, y: flowPos.y },
          ...(type === "group" ? { style: { width: size.width, height: size.height } } : {}),
          zIndex: 0,
          data: {
            elementId: newElement.id,
            diagramElementId: diagramElement.id,
            name: newElement.name,
            displayDescription: null,
            status: newElement.status,
            external: newElement.external,
            technologies: [],
          },
        } as AppNode;
        addNode(newNode);
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [reactFlow, position, createElementFn, addDiagramElementFn, addNode],
  );

  return (
    <>
      {ELEMENT_TYPES.map((type) => {
        const valid = diagramType ? validateElementForDiagram(diagramType, type).valid : true;
        return (
          <MenuItem key={type} onClick={() => handleAddElement(type)} disabled={!valid}>
            {ELEMENT_LABELS[type]()}
          </MenuItem>
        );
      })}
      <Separator className="my-1" />
      <MenuItem onClick={() => reactFlow.fitView()}>{m.editor_ctx_fit_view()}</MenuItem>
      <MenuItem onClick={() => setShowGrid(!showGrid)}>{m.editor_ctx_toggle_grid()}</MenuItem>
    </>
  );
}

function DeleteConfirmDialog({
  confirm,
  onClose,
}: {
  confirm: { type: "element" | "connection"; id: string; nodeId?: string; edgeId?: string } | null;
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
  }, [confirm, deleteElementFn, deleteConnectionFn, removeNodeById, removeEdgeById, onClose]);

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
