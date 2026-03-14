import type { Node, Edge } from "@xyflow/react";
import type { ElementStatus } from "#/lib/element.validators";
import type {
  ConnectionDirection,
} from "#/lib/connection.validators";
import type {
  LineStyle,
  AnchorPoint,
  PathType,
} from "#/lib/diagram.validators";

// ── Node Data ────────────────────────────────────────────────────────

export interface BaseNodeData {
  elementId: string;
  diagramElementId: string;
  name: string;
  displayDescription: string | null;
  status: ElementStatus;
  external: boolean;
  technologies: string[];
  iconTechSlug: string | null;
  /** Whether this node acts as a sub-flow container (parent of other nodes) */
  isParent: boolean;
  [key: string]: unknown;
}

export type ActorNodeData = BaseNodeData;
export type SystemNodeData = BaseNodeData;
export type AppNodeData = BaseNodeData;
export type StoreNodeData = BaseNodeData;
export type ComponentNodeData = BaseNodeData;

// ── Node Types ───────────────────────────────────────────────────────

export type ActorNode = Node<ActorNodeData, "actor">;
export type SystemNode = Node<SystemNodeData, "system">;
export type AppContainerNode = Node<AppNodeData, "app">;
export type StoreNode = Node<StoreNodeData, "store">;
export type ComponentNode = Node<ComponentNodeData, "component">;
export type GroupNode = Node<BaseNodeData, "group">;

export type AppNode =
  | ActorNode
  | SystemNode
  | AppContainerNode
  | StoreNode
  | ComponentNode
  | GroupNode;

// ── Edge Data ────────────────────────────────────────────────────────

export interface ConnectionEdgeData {
  diagramConnectionId: string;
  connectionId: string;
  description: string | null;
  technologies: string[];
  iconTechSlug: string | null;
  direction: ConnectionDirection;
  lineStyle: LineStyle;
  sourceAnchor: AnchorPoint;
  targetAnchor: AnchorPoint;
  labelPosition: number;
  [key: string]: unknown;
}

// ── Edge Types ───────────────────────────────────────────────────────

export type CurvedEdge = Edge<ConnectionEdgeData, "curved">;
export type StraightEdge = Edge<ConnectionEdgeData, "straight">;
export type OrthogonalEdge = Edge<ConnectionEdgeData, "orthogonal">;

export type AppEdge = CurvedEdge | StraightEdge | OrthogonalEdge;

// ── Path type to React Flow edge type mapping ────────────────────────

export const PATH_TYPE_TO_EDGE_TYPE: Record<PathType, string> = {
  curved: "curved",
  straight: "straight",
  orthogonal: "orthogonal",
};
