import { useCallback, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEditorStore } from "#/stores/editor-store";
import { createElement } from "#/lib/element.functions";
import { addDiagramElement } from "#/lib/diagram.functions";
import { m } from "#/paraglide/messages";
import type { AppNode } from "#/lib/types/diagram-nodes";
import type { ElementType } from "#/lib/element.validators";
import type { ElementStatus } from "#/lib/element.validators";

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

const NEW_ELEMENT_NAMES: Record<ElementType, () => string> = {
  actor: () => m.editor_new_person(),
  group: () => m.editor_new_system(),
  system: () => m.editor_new_system(),
  app: () => m.editor_new_container(),
  store: () => m.editor_new_container(),
  component: () => m.editor_new_component(),
};

export function useAddElement() {
  const mode = useEditorStore((s) => s.mode);
  const addElementType = useEditorStore((s) => s.addElementType);
  const setMode = useEditorStore((s) => s.setMode);
  const addNode = useEditorStore((s) => s.addNode);
  const setSelection = useEditorStore((s) => s.setSelection);
  const reactFlow = useReactFlow();

  const createElementFn = useServerFn(createElement);
  const addDiagramElementFn = useServerFn(addDiagramElement);

  // Escape returns to select mode
  useEffect(() => {
    if (mode !== "add_element") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode("select");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, setMode]);

  const onPaneClick = useCallback(
    async (event: React.MouseEvent) => {
      if (mode !== "add_element" || !addElementType) return;

      const store = useEditorStore.getState();
      if (!store.workspaceId || !store.diagramId) return;

      const flowPos = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      try {
        const newElement = (await createElementFn({
          data: {
            workspaceId: store.workspaceId,
            elementType: addElementType,
            name: NEW_ELEMENT_NAMES[addElementType](),
          },
        })) as CreatedElement;

        const size = DEFAULT_SIZES[addElementType];
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
          type: addElementType,
          position: { x: flowPos.x, y: flowPos.y },
          style: { width: size.width, height: size.height },
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
        setMode("select");
        setSelection([newNode.id], []);
      } catch {
        toast.error(m.editor_panel_save_failed());
      }
    },
    [mode, addElementType, reactFlow, createElementFn, addDiagramElementFn, addNode, setMode, setSelection],
  );

  return { onPaneClick, isAddMode: mode === "add_element" };
}
