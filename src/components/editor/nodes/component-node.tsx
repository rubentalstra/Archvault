import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Cpu } from "lucide-react";
import type { ComponentNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";
import { TechIcon } from "#/components/technologies/tech-icon";

function ComponentNodeComponent({ data, selected }: NodeProps & { data: ComponentNodeData }) {
  return (
    <>
      <Handle id="top-target" type="target" position={Position.Top} className="!size-2 !border-primary !bg-primary" />
      <Handle id="top-source" type="source" position={Position.Top} className="!size-2 !border-primary !bg-primary" />
      <Handle id="bottom-target" type="target" position={Position.Bottom} className="!size-2 !border-primary !bg-primary" />
      <Handle id="bottom-source" type="source" position={Position.Bottom} className="!size-2 !border-primary !bg-primary" />
      <Handle id="left-target" type="target" position={Position.Left} className="!size-2 !border-primary !bg-primary" />
      <Handle id="left-source" type="source" position={Position.Left} className="!size-2 !border-primary !bg-primary" />
      <Handle id="right-target" type="target" position={Position.Right} className="!size-2 !border-primary !bg-primary" />
      <Handle id="right-source" type="source" position={Position.Right} className="!size-2 !border-primary !bg-primary" />

      <div
        className={`flex w-44 flex-col items-center gap-1 rounded-md border-2 bg-card px-4 py-3 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center gap-1.5">
          {data.iconTechSlug ? (
            <TechIcon slug={data.iconTechSlug} className="size-4 shrink-0" fallback={<Cpu className="size-4 shrink-0 text-muted-foreground" />} />
          ) : (
            <Cpu className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-semibold">{data.name}</span>
          <StatusDot status={data.status} />
        </div>
        {data.displayDescription && (
          <span className="line-clamp-2 text-center text-xs text-muted-foreground">
            {data.displayDescription}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {m.element_type_component()}
        </span>
        {data.external && (
          <span className="text-[10px] text-muted-foreground">{m.canvas_node_external()}</span>
        )}
      </div>
    </>
  );
}

export const ComponentNode = memo(ComponentNodeComponent);
