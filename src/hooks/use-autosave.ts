import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useEditorStore } from "#/stores/editor-store";
import { batchUpdateDiagramElements } from "#/lib/diagram.functions";
import type { AppNode } from "#/lib/types/diagram-nodes";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave() {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const batchUpdateFn = useServerFn(batchUpdateDiagramElements);

  const pendingRef = useRef<Map<string, { id: string; x: number; y: number; width?: number; height?: number; zIndex?: number }>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevNodesRef = useRef<AppNode[]>([]);

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    if (pending.size === 0) return;

    const updates = Array.from(pending.values());
    pendingRef.current = new Map();

    setStatus("saving");
    try {
      await batchUpdateFn({ data: { updates } });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [batchUpdateFn]);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state) => {
      const nodes = state.nodes;
      const prevNodes = prevNodesRef.current;
      prevNodesRef.current = nodes;

      if (nodes === prevNodes || prevNodes.length === 0) return;

      // Detect position/size changes
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]));
      let changed = false;
      for (const node of nodes) {
        const prev = prevMap.get(node.id);
        if (!prev) continue;

        const posChanged = node.position.x !== prev.position.x || node.position.y !== prev.position.y;
        const sizeChanged =
          node.style?.width !== prev.style?.width ||
          node.style?.height !== prev.style?.height;

        if (posChanged || sizeChanged) {
          changed = true;
          pendingRef.current.set(node.id, {
            id: node.data.diagramElementId,
            x: node.position.x,
            y: node.position.y,
            ...(node.style?.width ? { width: Number(node.style.width) } : {}),
            ...(node.style?.height ? { height: Number(node.style.height) } : {}),
            zIndex: node.zIndex,
          });
        }
      }

      if (changed) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => void flush(), 500);
      }
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
      void flush();
    };
  }, [flush]);

  return { status };
}
