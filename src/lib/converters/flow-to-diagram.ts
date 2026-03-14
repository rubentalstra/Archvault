import type { AppNode } from "#/lib/types/diagram-nodes";

export function flowNodeToUpdate(node: AppNode, absolutePosition?: { x: number; y: number }) {
  const pos = absolutePosition ?? node.position;
  return {
    id: node.data.diagramElementId,
    x: pos.x,
    y: pos.y,
    width: node.style?.width ? Number(node.style.width) : undefined,
    height: node.style?.height ? Number(node.style.height) : undefined,
    zIndex: node.zIndex,
  };
}
