import { memo } from "react";
import { NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Box } from "lucide-react";
import type { SystemNodeData } from "#/lib/types/diagram-nodes";
import { m } from "#/paraglide/messages";
import { StatusDot } from "./status-dot";
import { TechIcon } from "#/components/technologies/tech-icon";
import { NodeHandles } from "./node-handles";

const CONTAINER_MIN_WIDTH = 300;
const CONTAINER_MIN_HEIGHT = 200;

function SystemNodeComponent({ data, selected }: NodeProps & { data: SystemNodeData }) {
  if (data.isParent) {
    return (
      <>
        <NodeResizer
          minWidth={CONTAINER_MIN_WIDTH}
          minHeight={CONTAINER_MIN_HEIGHT}
          isVisible={selected}
          lineClassName="!border-primary"
          handleClassName="!size-2 !border-primary !bg-background"
        />
        <NodeHandles />
        <div
          className={`h-full w-full rounded-xl border-2 p-3 ${
            selected ? "border-primary" : "border-dashed border-muted-foreground/40"
          } bg-muted/20`}
        >
          {/* Compact header bar */}
          <div className="flex items-center gap-2">
            {data.iconTechSlug ? (
              <TechIcon slug={data.iconTechSlug} className="size-5 shrink-0" fallback={<Box className="size-5 shrink-0 text-foreground" />} />
            ) : (
              <Box className="size-5 shrink-0 text-foreground" />
            )}
            <span className="truncate text-sm font-bold">{data.name}</span>
            <StatusDot status={data.status} />
            <span className="ml-auto text-xs text-muted-foreground">
              {data.technologies.length > 0
                ? `${m.element_type_system()}: ${data.technologies.join(", ")}`
                : m.element_type_system()}
            </span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NodeHandles />
      <div
        className={`flex w-56 flex-col items-center gap-1 rounded-xl border-2 bg-card px-5 py-4 text-card-foreground shadow-sm ${
          data.external ? "border-dashed border-muted-foreground" : "border-border"
        } ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex w-full items-center gap-2.5">
          {data.iconTechSlug ? (
            <TechIcon slug={data.iconTechSlug} className="size-7 shrink-0" fallback={<Box className="size-7 shrink-0 text-foreground" />} />
          ) : (
            <Box className="size-7 shrink-0 text-foreground" />
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
