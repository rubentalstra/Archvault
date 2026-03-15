import {
    createContext,
    useContext,
    useCallback,
    useRef,
    useSyncExternalStore,
} from "react";
import {useReactFlow} from "@xyflow/react";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {useEditorStore} from "#/stores/editor-store";
import {createElement} from "#/lib/element.functions";
import {addDiagramElement} from "#/lib/diagram.functions";
import {validateChildPlacement} from "#/lib/diagram.validators";
import {m} from "#/paraglide/messages";
import type {AppNode} from "#/lib/types/diagram-nodes";
import type {ElementType, ElementStatus} from "#/lib/element.validators";

type CreatedElement = {
    id: string;
    name: string;
    status: ElementStatus;
    external: boolean;
};
type CreatedDiagramElement = { id: string };

export const DEFAULT_SIZES: Record<
    ElementType,
    { width: number; height: number }
> = {
    actor: {width: 160, height: 100},
    group: {width: 320, height: 220},
    system: {width: 200, height: 120},
    app: {width: 180, height: 110},
    store: {width: 180, height: 110},
    component: {width: 160, height: 100},
};

const NEW_ELEMENT_NAMES: Record<ElementType, () => string> = {
    actor: () => m.editor_new_actor(),
    group: () => m.editor_new_system(),
    system: () => m.editor_new_system(),
    app: () => m.editor_new_app(),
    store: () => m.editor_new_store(),
    component: () => m.editor_new_component(),
};

/** Detect if a flow position lands inside a sub-flow container node */
export function findSubFlowParent(
    flowPos: { x: number; y: number },
    nodes: AppNode[],
): AppNode | null {
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (!node.data.isSubFlow) continue;

        const nodeWidth = Number(node.style?.width ?? 0);
        const nodeHeight = Number(node.style?.height ?? 0);
        if (nodeWidth === 0 || nodeHeight === 0) continue;

        if (
            flowPos.x >= node.position.x &&
            flowPos.x <= node.position.x + nodeWidth &&
            flowPos.y >= node.position.y &&
            flowPos.y <= node.position.y + nodeHeight
        ) {
            return node;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DnDState {
    isDragging: boolean;
    dragLabel: string | null;
    pointerPos: { x: number; y: number } | null;
    startDrag: (
        event: React.PointerEvent,
        label: string,
        onDrop: (flowPos: { x: number; y: number }) => Promise<void>,
    ) => void;
}

const DnDContext = createContext<DnDState | null>(null);

export function useDnD() {
    const ctx = useContext(DnDContext);
    if (!ctx) throw new Error("useDnD must be used inside DnDProvider");
    return ctx;
}

// ---------------------------------------------------------------------------
// Provider — imperative store so listeners are attached synchronously
// ---------------------------------------------------------------------------

/** Mutable snapshot that drives both the ghost and the drop logic. */
interface DragSnapshot {
    isDragging: boolean;
    dragLabel: string | null;
    pointerPos: { x: number; y: number } | null;
}

function createDragStore() {
    let snap: DragSnapshot = {isDragging: false, dragLabel: null, pointerPos: null};
    const listeners = new Set<() => void>();

    function emit() {
        // Create a new object reference so useSyncExternalStore re-renders
        snap = {...snap};
        for (const l of listeners) l();
    }

    return {
        getSnapshot: () => snap,
        subscribe: (l: () => void) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        set: (partial: Partial<DragSnapshot>) => {
            Object.assign(snap, partial);
            emit();
        },
    };
}

export function DnDProvider({children}: { children: React.ReactNode }) {
    // One store per provider instance (stable across renders)
    const storeRef = useRef<ReturnType<typeof createDragStore>>(null);
    if (!storeRef.current) storeRef.current = createDragStore();
    const store = storeRef.current;

    const snap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

    const dropActionRef = useRef<
        ((flowPos: { x: number; y: number }) => Promise<void>) | null
    >(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const reactFlowRef = useRef<ReturnType<typeof useReactFlow>>(null);
    reactFlowRef.current = useReactFlow();

    const startDrag = useCallback(
        (
            event: React.PointerEvent,
            label: string,
            onDrop: (flowPos: { x: number; y: number }) => Promise<void>,
        ) => {
            // Clean up any previous drag (safety net)
            cleanupRef.current?.();

            dropActionRef.current = onDrop;

            // Update store synchronously — the ghost renders on the next frame,
            // but the listeners below are active *immediately*.
            store.set({
                isDragging: true,
                dragLabel: label,
                pointerPos: {x: event.clientX, y: event.clientY},
            });

            // Attach window listeners synchronously so we never miss pointerup
            const onMove = (e: PointerEvent) => {
                store.set({pointerPos: {x: e.clientX, y: e.clientY}});
            };

            const onUp = (e: PointerEvent) => {
                // 1. Remove listeners first (prevent double-fire)
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);

                // 2. Run drop logic BEFORE resetting state — resetting triggers a
                //    synchronous re-render via useSyncExternalStore which could
                //    interfere with elementFromPoint.
                const target = document.elementFromPoint(e.clientX, e.clientY);
                const flowEl = target?.closest(".react-flow");

                if (flowEl && dropActionRef.current && reactFlowRef.current) {
                    const flowPos = reactFlowRef.current.screenToFlowPosition({
                        x: e.clientX,
                        y: e.clientY,
                    });
                    dropActionRef.current(flowPos);
                }

                // 3. Reset state after drop logic
                dropActionRef.current = null;
                cleanupRef.current = null;
                store.set({isDragging: false, dragLabel: null, pointerPos: null});
            };

            // Safety-net cleanup for aborting a stuck previous drag (called from startDrag)
            const cleanup = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                cleanupRef.current = null;
                store.set({isDragging: false, dragLabel: null, pointerPos: null});
            };

            cleanupRef.current = cleanup;

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
        },
        [store],
    );

    return (
        <DnDContext.Provider
            value={{
                isDragging: snap.isDragging,
                dragLabel: snap.dragLabel,
                pointerPos: snap.pointerPos,
                startDrag,
            }}
        >
            {children}
        </DnDContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Drag Ghost
// ---------------------------------------------------------------------------

export function DragGhost() {
    const ctx = useContext(DnDContext);
    if (!ctx?.isDragging || !ctx.pointerPos || !ctx.dragLabel) return null;

    return (
        <div
            className="pointer-events-none fixed z-100 rounded-md border bg-card/90 px-3 py-1.5 text-sm font-medium shadow-lg backdrop-blur-sm"
            style={{
                left: ctx.pointerPos.x + 12,
                top: ctx.pointerPos.y + 12,
            }}
        >
            {ctx.dragLabel}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Shared helper: create a new element at a flow position
// ---------------------------------------------------------------------------

export function useCreateElementAtPosition() {
    const addNode = useEditorStore((s) => s.addNode);
    const setSelection = useEditorStore((s) => s.setSelection);
    const createElementFn = useServerFn(createElement);
    const addDiagramElementFn = useServerFn(addDiagramElement);

    return useCallback(
        async (
            elementType: ElementType,
            flowPos: { x: number; y: number },
        ) => {
            const store = useEditorStore.getState();
            if (!store.workspaceId || !store.diagramId) return;

            const parentNode = findSubFlowParent(flowPos, store.nodes);
            const parentElementId = parentNode ? parentNode.data.elementId : null;
            const size = DEFAULT_SIZES[elementType];

            // Validate placement — e.g. apps/stores must be inside a sub-flow container
            if (store.diagramType) {
                const subFlowElementIds = new Set(
                    store.nodes
                        .filter((n) => n.data.isSubFlow)
                        .map((n) => n.data.elementId),
                );
                const placement = validateChildPlacement(
                    store.diagramType,
                    elementType,
                    parentElementId,
                    subFlowElementIds,
                );
                if (!placement.valid) {
                    const typeName = elementType.charAt(0).toUpperCase() + elementType.slice(1);
                    toast.error(
                        m.editor_drop_requires_container({elementType: typeName}),
                    );
                    return;
                }
            }

            try {
                const newElement = (await createElementFn({
                    data: {
                        workspaceId: store.workspaceId,
                        elementType,
                        name: NEW_ELEMENT_NAMES[elementType](),
                        ...(parentElementId ? {parentElementId} : {}),
                    },
                })) as CreatedElement;

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

                const position = parentNode
                    ? {
                        x: flowPos.x - parentNode.position.x,
                        y: flowPos.y - parentNode.position.y,
                    }
                    : {x: flowPos.x, y: flowPos.y};

                const isResizable = elementType === "group";

                const newNode: AppNode = {
                    id: diagramElement.id,
                    type: elementType,
                    position,
                    ...(isResizable
                        ? {style: {width: size.width, height: size.height}}
                        : {}),
                    zIndex: 0,
                    data: {
                        elementId: newElement.id,
                        diagramElementId: diagramElement.id,
                        name: newElement.name,
                        displayDescription: null,
                        status: newElement.status,
                        external: newElement.external,
                        technologies: [],
                        iconTechSlug: null,
                        isSubFlow: false,
                        deeperDiagrams: [],
                    },
                    ...(parentNode
                        ? {parentId: parentNode.id, extent: "parent" as const}
                        : {}),
                } as unknown as AppNode;

                addNode(newNode);
                setSelection([newNode.id], []);
            } catch {
                toast.error(m.editor_panel_save_failed());
            }
        },
        [createElementFn, addDiagramElementFn, addNode, setSelection],
    );
}
