import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Box } from "lucide-react";
import type { SystemNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";

function SystemNodeComponent({ data, selected }: NodeProps & { data: SystemNodeData }) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!size-2 !border-primary !bg-primary" />
      <Handle type="source" position={Position.Bottom} className="!size-2 !border-primary !bg-primary" />
      <Handle type="target" position={Position.Left} className="!size-2 !border-primary !bg-primary" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-primary !bg-primary" />

      <div
        className={`flex w-56 flex-col items-center gap-1 rounded-xl border-2 bg-card px-5 py-4 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        {/* Icon + Name row */}
        <div className="flex w-full items-center gap-2.5">
          <Box className="size-7 shrink-0 text-foreground" />
          <span className="truncate text-base font-bold">{data.name}</span>
          <StatusDot status={data.status} />
        </div>

        {/* Description */}
        {data.displayDescription && (
          <span className="line-clamp-2 w-full text-center text-xs text-muted-foreground">
            {data.displayDescription}
          </span>
        )}

        {/* Type + technologies label */}
        <span className="text-xs text-muted-foreground">
          {data.technologies.length > 0
            ? `${m.element_type_system()}: ${data.technologies.join(", ")}`
            : m.element_type_system()}
        </span>

        {data.external && (
          <span className="text-[10px] text-muted-foreground">{m.canvas_node_external()}</span>
        )}
      </div>
    </>
  );
}

export const SystemNode = memo(SystemNodeComponent);
