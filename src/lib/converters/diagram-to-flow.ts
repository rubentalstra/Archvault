import type { MarkerType } from "@xyflow/react";
import type { AppNode, AppEdge } from "#/lib/types/diagram-nodes";
import { PATH_TYPE_TO_EDGE_TYPE } from "#/lib/types/diagram-nodes";
import type { DiagramType } from "#/lib/diagram.validators";
import type { ElementStatus } from "#/lib/element.validators";
import type { ConnectionDirection } from "#/lib/connection.validators";
import type { LineStyle, AnchorPoint, PathType } from "#/lib/diagram.validators";

// ── Types for server data ────────────────────────────────────────────

export interface DiagramElementRow {
  id: string;
  diagramId: string;
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  elementName: string;
  elementType: string;
  displayDescription: string | null;
  status: string;
  external: boolean;
  parentElementId: string | null;
  technologies: string[];
  iconTechSlug: string | null;
  displayMode: "normal" | "sub_flow";
}

export interface DiagramConnectionRow {
  id: string;
  diagramId: string;
  connectionId: string;
  pathType: string;
  lineStyle: string;
  sourceAnchor: string;
  targetAnchor: string;
  labelPosition: number;
  sourceElementId: string;
  targetElementId: string;
  direction: string;
  description: string | null;
  technologies: string[];
  iconTechSlug: string | null;
}

// ── Deeper diagrams info ─────────────────────────────────────────────

export interface DeeperDiagramInfo {
  id: string;
  name: string;
  diagramType: DiagramType;
}

// ── Convert DB elements to React Flow nodes ──────────────────────────

export function toFlowNodes(
  rows: DiagramElementRow[],
  _diagramType: DiagramType,
  deeperDiagramsMap?: Map<string, DeeperDiagramInfo[]>,
): AppNode[] {
  // Step 1: Build lookup maps
  const elementIdToRow = new Map<string, DiagramElementRow>();
  const elementIdToNodeId = new Map<string, string>();
  for (const row of rows) {
    elementIdToRow.set(row.elementId, row);
    elementIdToNodeId.set(row.elementId, row.id);
  }

  // Step 2: Detect sub-flow parents from displayMode
  const parentElementIds = new Set<string>();
  for (const row of rows) {
    if (row.displayMode === "sub_flow") {
      parentElementIds.add(row.elementId);
    }
  }

  // Step 3: Detect children — elements whose parentElementId is a sub-flow on this diagram
  const childNodeIdToParentNodeId = new Map<string, string>();
  for (const row of rows) {
    if (!row.parentElementId) continue;
    if (!parentElementIds.has(row.parentElementId)) continue;
    const parentNodeId = elementIdToNodeId.get(row.parentElementId);
    if (!parentNodeId) continue;
    childNodeIdToParentNodeId.set(row.id, parentNodeId);
  }

  // Step 4: Build nodes
  const nodes: AppNode[] = [];

  for (const row of rows) {
    const isSubFlow = parentElementIds.has(row.elementId);
    const parentNodeId = childNodeIdToParentNodeId.get(row.id);
    const deeperDiagrams = deeperDiagramsMap?.get(row.elementId) ?? [];

    const baseData = {
      elementId: row.elementId,
      diagramElementId: row.id,
      name: row.elementName,
      displayDescription: row.displayDescription,
      status: row.status as ElementStatus,
      external: row.external,
      technologies: row.technologies,
      iconTechSlug: row.iconTechSlug,
      isSubFlow,
      deeperDiagrams,
    };

    // Determine position — if child, convert to parent-relative coordinates
    let position = { x: row.x, y: row.y };
    if (parentNodeId) {
      const parentRow = [...elementIdToRow.values()].find(
        (r) => r.id === parentNodeId,
      );
      if (parentRow) {
        position = {
          x: row.x - parentRow.x,
          y: row.y - parentRow.y,
        };
      }
    }

    const nodeType = row.elementType as AppNode["type"];
    const needsSize = isSubFlow || nodeType === "group";

    nodes.push({
      id: row.id,
      type: nodeType,
      position,
      ...(needsSize ? { style: { width: row.width, height: row.height } } : {}),
      zIndex: row.zIndex,
      data: baseData,
      ...(parentNodeId ? { parentId: parentNodeId, extent: "parent" as const } : {}),
    } as AppNode);
  }

  // Step 5: Topological sort — parents before children
  return sortNodesTopologically(nodes);
}

/** Sort nodes so parents appear before their children (React Flow requirement) */
function sortNodesTopologically(nodes: AppNode[]): AppNode[] {
  const result: AppNode[] = [];
  const placed = new Set<string>();
  let remaining = [...nodes];

  while (remaining.length > 0) {
    const next = remaining.filter(
      (n) => !n.parentId || placed.has(n.parentId),
    );
    if (next.length === 0) break;
    for (const n of next) {
      result.push(n);
      placed.add(n.id);
    }
    remaining = remaining.filter((n) => !placed.has(n.id));
  }
  // Push any remaining nodes (shouldn't happen, but safety)
  result.push(...remaining);
  return result;
}

// ── Convert DB relationships to React Flow edges ─────────────────────

function getMarker(direction: ConnectionDirection, end: "source" | "target"): { type: MarkerType } | undefined {
  const arrow = { type: "arrowclosed" as MarkerType, width: 30, height: 30 };

  switch (direction) {
    case "outgoing":
      return end === "target" ? arrow : undefined;
    case "incoming":
      return end === "source" ? arrow : undefined;
    case "bidirectional":
      return arrow;
    case "none":
      return undefined;
  }
}

function getStrokeDasharray(lineStyle: LineStyle): string | undefined {
  switch (lineStyle) {
    case "dashed":
      return "5 5";
    case "dotted":
      return "2 2";
    default:
      return undefined;
  }
}

/** Map an anchor point value to a React Flow handle ID. "auto" → undefined (let React Flow pick). */
function anchorToHandleId(anchor: string): string | undefined {
  if (anchor === "auto") return undefined;
  return anchor; // "top" | "bottom" | "left" | "right" match our handle IDs
}

export function toFlowEdges(
  rows: DiagramConnectionRow[],
  elementIdToNodeId: Map<string, string>,
): AppEdge[] {
  const edges: AppEdge[] = [];

  for (const row of rows) {
    const source = elementIdToNodeId.get(row.sourceElementId);
    const target = elementIdToNodeId.get(row.targetElementId);

    if (!source || !target) continue;

    const direction = row.direction as ConnectionDirection;
    const lineStyle = row.lineStyle as LineStyle;
    const pathType = row.pathType as PathType;
    const strokeDasharray = getStrokeDasharray(lineStyle);

    edges.push({
      id: row.id,
      source,
      target,
      sourceHandle: anchorToHandleId(row.sourceAnchor),
      targetHandle: anchorToHandleId(row.targetAnchor),
      type: PATH_TYPE_TO_EDGE_TYPE[pathType],
      markerEnd: getMarker(direction, "target"),
      markerStart: getMarker(direction, "source"),
      style: strokeDasharray ? { strokeDasharray } : undefined,
      data: {
        diagramConnectionId: row.id,
        connectionId: row.connectionId,
        description: row.description,
        technologies: row.technologies,
        iconTechSlug: row.iconTechSlug,
        direction,
        lineStyle,
        sourceAnchor: row.sourceAnchor as AnchorPoint,
        targetAnchor: row.targetAnchor as AnchorPoint,
        labelPosition: row.labelPosition,
      },
    } as AppEdge);
  }

  return edges;
}

// ── Build elementId -> nodeId map ────────────────────────────────────

export function buildElementIdToNodeIdMap(
  rows: DiagramElementRow[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.elementId, row.id);
  }
  return map;
}
