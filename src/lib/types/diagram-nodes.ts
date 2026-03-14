import type { Node, Edge } from "@xyflow/react";
import type { ElementStatus } from "#/lib/element.validators";
import type {
  RelationshipDirection,
} from "#/lib/relationship.validators";
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
  [key: string]: unknown;
}

export type ActorNodeData = BaseNodeData;
export type SystemNodeData = BaseNodeData;
export type AppNodeData = BaseNodeData;
export type StoreNodeData = BaseNodeData;
export type ComponentNodeData = BaseNodeData;

export interface GroupNodeData extends BaseNodeData {
  isScope: boolean;
}

// ── Node Types ───────────────────────────────────────────────────────

export type ActorNode = Node<ActorNodeData, "actor">;
export type SystemNode = Node<SystemNodeData, "system">;
export type AppContainerNode = Node<AppNodeData, "app">;
export type StoreNode = Node<StoreNodeData, "store">;
export type ComponentNode = Node<ComponentNodeData, "component">;
export type GroupNode = Node<GroupNodeData, "group">;

export type AppNode =
  | ActorNode
  | SystemNode
  | AppContainerNode
  | StoreNode
  | ComponentNode
  | GroupNode;

// ── Edge Data ────────────────────────────────────────────────────────

export interface RelationshipEdgeData {
  diagramRelationshipId: string;
  relationshipId: string;
  description: string | null;
  technology: string | null;
  direction: RelationshipDirection;
  lineStyle: LineStyle;
  sourceAnchor: AnchorPoint;
  targetAnchor: AnchorPoint;
  labelPosition: number;
  [key: string]: unknown;
}

// ── Edge Types ───────────────────────────────────────────────────────

export type CurvedEdge = Edge<RelationshipEdgeData, "curved">;
export type StraightEdge = Edge<RelationshipEdgeData, "straight">;
export type OrthogonalEdge = Edge<RelationshipEdgeData, "orthogonal">;

export type AppEdge = CurvedEdge | StraightEdge | OrthogonalEdge;

// ── Path type to React Flow edge type mapping ────────────────────────

export const PATH_TYPE_TO_EDGE_TYPE: Record<PathType, string> = {
  curved: "default",
  straight: "straight",
  orthogonal: "step",
};
