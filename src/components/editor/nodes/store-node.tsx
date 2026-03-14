import { memo } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import type { StoreNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";

const MIN_WIDTH = 160;
const MIN_HEIGHT = 90;

function StoreNodeComponent({ data, selected }: NodeProps & { data: StoreNodeData }) {
  return (
    <>
      <NodeResizer
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        isVisible={selected}
        lineClassName="!border-primary"
        handleClassName="!size-2 !border-primary !bg-background"
      />
      <Handle type="target" position={Position.Top} className="!size-2 !border-primary !bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!size-2 !border-primary !bg-primary" />
      <Handle type="target" position={Position.Left} className="!size-2 !border-primary !bg-primary" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-primary !bg-primary" />

      <div
        className={`flex h-full flex-col items-center justify-center gap-1 rounded-lg border-2 bg-card px-4 py-3 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center gap-1.5">
          <Database className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-semibold">{data.name}</span>
          <StatusDot status={data.status} />
        </div>
        {data.displayDescription && (
          <span className="line-clamp-2 text-center text-xs text-muted-foreground">
            {data.displayDescription}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{m.element_type_container()}</span>
        {data.external && (
          <span className="text-[10px] text-muted-foreground">{m.canvas_node_external()}</span>
        )}
      </div>
    </>
  );
}

export const StoreNode = memo(StoreNodeComponent);


