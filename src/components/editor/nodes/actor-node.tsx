import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { User } from "lucide-react";
import type { ActorNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";
import { NodeHandles } from "./node-handles";

function ActorNodeComponent({ data, selected }: NodeProps & { data: ActorNodeData }) {
  return (
    <>
      <NodeHandles omitTop />

      {/* Floating person icon badge */}
      <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
        <div className="flex size-10 items-center justify-center rounded-lg border bg-card shadow-sm">
          <User className="size-5 text-foreground" />
        </div>
      </div>

      {/* Card body */}
      <div
        className={`flex w-48 flex-col items-center gap-0.5 rounded-xl border-2 bg-card px-4 pt-7 pb-3 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold">{data.name}</span>
          <StatusDot status={data.status} />
        </div>
        <span className="text-xs text-muted-foreground">
          {data.displayDescription ?? m.element_type_actor()}
        </span>
        {data.external && (
          <span className="mt-0.5 text-[10px] text-muted-foreground">{m.canvas_node_external()}</span>
        )}
      </div>
    </>
  );
}

export const ActorNode = memo(ActorNodeComponent);
