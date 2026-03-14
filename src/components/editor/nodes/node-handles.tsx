import { Handle, Position } from "@xyflow/react";

const HANDLE_CLASS = "!size-2 !border-primary !bg-primary";

interface NodeHandlesProps {
  omitTop?: boolean;
}

export function NodeHandles({ omitTop = false }: NodeHandlesProps) {
  return (
    <>
      {!omitTop && (
        <>
          <Handle id="top-target" type="target" position={Position.Top} className={HANDLE_CLASS} />
          <Handle id="top-source" type="source" position={Position.Top} className={HANDLE_CLASS} />
        </>
      )}
      <Handle id="bottom-target" type="target" position={Position.Bottom} className={HANDLE_CLASS} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className={HANDLE_CLASS} />
      <Handle id="left-target" type="target" position={Position.Left} className={HANDLE_CLASS} />
      <Handle id="left-source" type="source" position={Position.Left} className={HANDLE_CLASS} />
      <Handle id="right-target" type="target" position={Position.Right} className={HANDLE_CLASS} />
      <Handle id="right-source" type="source" position={Position.Right} className={HANDLE_CLASS} />
    </>
  );
}
