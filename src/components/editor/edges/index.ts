import type { EdgeTypes } from "@xyflow/react";
import { CurvedEdge } from "./curved-edge";
import { StraightEdge } from "./straight-edge";
import { OrthogonalEdge } from "./orthogonal-edge";

export const edgeTypes: EdgeTypes = {
  curved: CurvedEdge,
  straight: StraightEdge,
  orthogonal: OrthogonalEdge,
};
