import { memo } from "react";
import { BaseEdge, getStraightPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { ConnectionEdgeData } from "#/lib/types/diagram-nodes";
import { EdgeLabel } from "./edge-label";

function StraightEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
  markerStart,
  style,
}: EdgeProps<ConnectionEdgeData>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
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

export const StraightEdge = memo(StraightEdgeComponent);
