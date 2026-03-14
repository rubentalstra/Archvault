import { memo } from "react";
import { BaseEdge, getBezierPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { ConnectionEdgeData } from "#/lib/types/diagram-nodes";
import { EdgeLabel } from "./edge-label";

function CurvedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  markerStart,
  style,
}: EdgeProps<ConnectionEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
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

export const CurvedEdge = memo(CurvedEdgeComponent);
