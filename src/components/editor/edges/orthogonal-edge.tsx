import { memo } from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { ConnectionEdgeData } from "#/lib/types/diagram-nodes";
import { EdgeLabel } from "./edge-label";

function OrthogonalEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  markerStart,
  style,
}: EdgeProps<ConnectionEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 4,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...style,
          stroke: selected
            ? "hsl(var(--primary))"
            : "hsl(var(--muted-foreground))",
          strokeWidth: selected ? 2.5 : 1.5,
        }}
      />
      {data && (
        <EdgeLabel
          labelX={labelX}
          labelY={labelY}
          description={data.description}
          technologies={data.technologies}
          iconTechSlug={data.iconTechSlug}
        />
      )}
    </>
  );
}

export const OrthogonalEdge = memo(OrthogonalEdgeComponent);
