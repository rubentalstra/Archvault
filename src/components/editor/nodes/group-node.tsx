import { memo } from "react";
import { NodeResizer } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import type { BaseNodeData } from "#/lib/types/diagram-nodes";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

function GroupNodeComponent({ data, selected }: NodeProps & { data: BaseNodeData }) {
  return (
    <>
      <NodeResizer
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        isVisible={selected}
        lineClassName="!border-primary"
        handleClassName="!size-2 !border-primary !bg-background"
      />
      <div
        className={`h-full w-full rounded-xl border-2 border-dashed bg-muted/30 p-3 ${
          selected ? "border-primary" : "border-muted-foreground/40"
        }`}
      >
        <span className="text-xs font-medium text-muted-foreground">
          {data.name}
        </span>
      </div>
    </>
  );
}

export const GroupNode = memo(GroupNodeComponent);
