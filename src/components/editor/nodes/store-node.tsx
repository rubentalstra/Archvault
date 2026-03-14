import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";
import type { StoreNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";
import { TechIcon } from "#/components/technologies/tech-icon";
import { NodeHandles } from "./node-handles";

function StoreNodeComponent({ data, selected }: NodeProps & { data: StoreNodeData }) {
  return (
    <>
      <NodeHandles />
      <div
        className={`flex w-52 flex-col items-center gap-1 rounded-lg border-2 bg-card px-5 py-4 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex w-full items-center gap-2.5">
          {data.iconTechSlug ? (
            <TechIcon slug={data.iconTechSlug} className="size-7 shrink-0" fallback={<Database className="size-7 shrink-0 text-foreground" />} />
          ) : (
            <Database className="size-7 shrink-0 text-foreground" />
          )}
          <span className="truncate text-base font-bold">{data.name}</span>
          <StatusDot status={data.status} />
        </div>
        {data.displayDescription && (
          <span className="line-clamp-2 w-full text-center text-xs text-muted-foreground">
            {data.displayDescription}
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {data.technologies.length > 0
            ? `${m.element_type_store()}: ${data.technologies.join(", ")}`
            : m.element_type_store()}
        </span>
        {data.external && (
          <span className="text-[10px] text-muted-foreground">{m.canvas_node_external()}</span>
        )}
      </div>
    </>
  );
}

export const StoreNode = memo(StoreNodeComponent);
