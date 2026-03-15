import { Handle, Position } from "@xyflow/react";

interface NodeHandlesProps {
  omitTop?: boolean;
}

/**
 * Renders one handle per side (top, right, bottom, left).
 *
 * With `connectionMode="loose"` on <ReactFlow>, each handle works as both
 * a source and a target — any handle can connect to any other handle.
 * Only `type="source"` is needed; React Flow treats all handles as valid
 * connection endpoints in loose mode.
 *
 * Uses default React Flow handle styling (round dots).
 */
export function NodeHandles({ omitTop = false }: NodeHandlesProps) {
  return (
    <>
      {!omitTop && (
        <Handle id="top" type="source" position={Position.Top} />
      )}
      <Handle id="right" type="source" position={Position.Right} />
      <Handle id="bottom" type="source" position={Position.Bottom} />
      <Handle id="left" type="source" position={Position.Left} />
    </>
  );
}
