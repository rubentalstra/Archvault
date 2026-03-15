import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { useEditorStore } from "#/stores/editor-store";
import { useEditorActions } from "#/hooks/use-editor-actions";
import { useClipboard } from "#/hooks/use-clipboard";
import { useCreateElementAtPosition, DEFAULT_SIZES } from "#/components/editor/dnd-context";
import type { ElementType } from "#/lib/element.validators";

function isInputElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || el.hasAttribute("contenteditable");
}

interface UseEditorHotkeysOptions {
  readOnly: boolean;
}

export function useEditorHotkeys({ readOnly }: UseEditorHotkeysOptions) {
  const reactFlow = useReactFlow();
  const actions = useEditorActions();
  const clipboard = useClipboard();
  const createElementAtPosition = useCreateElementAtPosition();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (readOnly) return;
      if (isInputElement(document.activeElement)) return;

      const mod = e.metaKey || e.ctrlKey;

      // ── Delete ──
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const state = useEditorStore.getState();
        if (state.selectedNodeIds.length > 0) {
          actions.removeNodesWithHistory(state.selectedNodeIds);
        }
        if (state.selectedEdgeIds.length > 0) {
          actions.removeEdgesWithHistory(state.selectedEdgeIds);
        }
        return;
      }

      // ── Cmd+A — Select all ──
      if (mod && e.key === "a") {
        e.preventDefault();
        const nodes = useEditorStore.getState().nodes;
        useEditorStore.getState().setSelection(
          nodes.map((n) => n.id),
          [],
        );
        return;
      }

      // ── Cmd+Z — Undo ──
      if (mod && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        actions.undo();
        return;
      }

      // ── Cmd+Shift+Z — Redo ──
      if (mod && e.shiftKey && e.key === "z") {
        e.preventDefault();
        actions.redo();
        return;
      }

      // ── Cmd+C — Copy ──
      if (mod && e.key === "c") {
        e.preventDefault();
        clipboard.copy();
        return;
      }

      // ── Cmd+V — Paste ──
      if (mod && e.key === "v") {
        e.preventDefault();
        void clipboard.paste(reactFlow);
        return;
      }

      // ── Cmd+D — Duplicate ──
      if (mod && e.key === "d") {
        e.preventDefault();
        void clipboard.duplicate(reactFlow);
        return;
      }

      // ── Escape — Deselect / close context menu ──
      if (e.key === "Escape") {
        const state = useEditorStore.getState();
        if (state.contextMenu) {
          state.setContextMenu(null);
        } else {
          state.setSelection([], []);
        }
        return;
      }

      // ── Zoom shortcuts ──
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        void reactFlow.zoomIn();
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        void reactFlow.zoomOut();
        return;
      }
      if (mod && e.key === "0") {
        e.preventDefault();
        void reactFlow.fitView();
        return;
      }
      if (mod && e.key === "1") {
        e.preventDefault();
        void reactFlow.zoomTo(1);
        return;
      }

      // ── Mode shortcuts (no modifier) ──
      if (!mod && !e.shiftKey) {
        if (e.key === "v") {
          useEditorStore.getState().setMode("select");
          return;
        }
        if (e.key === "h") {
          useEditorStore.getState().setMode("pan");
          return;
        }
        if (e.key === "c") {
          useEditorStore.getState().setMode("add_connection");
          return;
        }
        if (e.key === "?") {
          const store = useEditorStore.getState();
          store.setShortcutsDialogOpen(!store.shortcutsDialogOpen);
          return;
        }
      }

      // ── Shift+Key — Add elements at viewport center ──
      if (!mod && e.shiftKey) {
        const typeMap: Record<string, ElementType> = {
          P: "actor",
          S: "system",
          A: "app",
          D: "store",
          X: "component",
        };
        const elementType = typeMap[e.key.toUpperCase()];
        if (elementType) {
          e.preventDefault();
          const viewport = reactFlow.getViewport();
          const container = document.querySelector(".react-flow");
          const rect = container?.getBoundingClientRect();
          if (rect) {
            const size = DEFAULT_SIZES[elementType];
            const centerX = (rect.width / 2 - viewport.x) / viewport.zoom - size.width / 2;
            const centerY = (rect.height / 2 - viewport.y) / viewport.zoom - size.height / 2;
            void createElementAtPosition(elementType, { x: centerX, y: centerY });
          }
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, reactFlow, actions, clipboard, createElementAtPosition]);
}
