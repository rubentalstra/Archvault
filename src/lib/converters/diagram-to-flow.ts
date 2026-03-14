import type {MarkerType} from "@xyflow/react";
import type {AppNode, AppEdge} from "#/lib/types/diagram-nodes";
import {PATH_TYPE_TO_EDGE_TYPE} from "#/lib/types/diagram-nodes";
import type {DiagramType} from "#/lib/diagram.validators";
import type {ElementStatus} from "#/lib/element.validators";
import type {ConnectionDirection} from "#/lib/connection.validators";
import type {LineStyle, AnchorPoint, PathType} from "#/lib/diagram.validators";

// Node types that use NodeResizer and need explicit width/height
const RESIZABLE_TYPES = new Set(["group"]);

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

// ── Convert DB elements to React Flow nodes ──────────────────────────

export function toFlowNodes(
    rows: DiagramElementRow[],
    _diagramType: DiagramType,
    scopeElementId: string | null,
): AppNode[] {
    // Build a map of elementId -> diagramElement.id for parentId lookups
    const elementIdToNodeId = new Map<string, string>();
    for (const row of rows) {
        elementIdToNodeId.set(row.elementId, row.id);
    }

    const nodes: AppNode[] = [];

    for (const row of rows) {
        const isScope = row.elementId === scopeElementId;

        // Determine if this node should be a child of the scope group
        const parentNodeId = scopeElementId && row.parentElementId === scopeElementId && !isScope
            ? elementIdToNodeId.get(scopeElementId)
            : undefined;

        const baseData = {
            elementId: row.elementId,
            diagramElementId: row.id,
            name: row.elementName,
            displayDescription: row.displayDescription,
            status: row.status as ElementStatus,
            external: row.external,
            technologies: row.technologies,
            iconTechSlug: row.iconTechSlug,
        };

        if (isScope) {
            nodes.push({
                id: row.id,
                type: "group",
                position: {x: row.x, y: row.y},
                style: {width: row.width, height: row.height},
                zIndex: row.zIndex,
                data: {...baseData, isScope: true},
            } as AppNode);
        } else {
            const nodeType = row.elementType as AppNode["type"];
            nodes.push({
                id: row.id,
                type: nodeType,
                position: {x: row.x, y: row.y},
                ...(RESIZABLE_TYPES.has(nodeType) ? {style: {width: row.width, height: row.height}} : {}),
                zIndex: row.zIndex,
                data: baseData,
                ...(parentNodeId ? {parentId: parentNodeId, extent: "parent" as const} : {}),
            } as AppNode);
        }
    }

    // Sort: group nodes first (React Flow requirement)
    nodes.sort((a, b) => {
        if (a.type === "group" && b.type !== "group") return -1;
        if (a.type !== "group" && b.type === "group") return 1;
        return 0;
    });

    return nodes;
}

// ── Convert DB relationships to React Flow edges ─────────────────────

function getMarker(direction: ConnectionDirection, end: "source" | "target"): { type: MarkerType } | undefined {
    // We can't use MarkerType directly at module level since it's from @xyflow/react
    // Use string literal that matches the enum value
    const arrow = {type: "arrowclosed" as MarkerType};

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

export function toFlowEdges(
    rows: DiagramConnectionRow[],
    elementIdToNodeId: Map<string, string>,
): AppEdge[] {
    const edges: AppEdge[] = [];

    for (const row of rows) {
        const source = elementIdToNodeId.get(row.sourceElementId);
        const target = elementIdToNodeId.get(row.targetElementId);

        // Skip edges where source/target elements are not on this diagram
        if (!source || !target) continue;

        const direction = row.direction as ConnectionDirection;
        const lineStyle = row.lineStyle as LineStyle;
        const pathType = row.pathType as PathType;
        const strokeDasharray = getStrokeDasharray(lineStyle);

        edges.push({
            id: row.id,
            source,
            target,
            type: PATH_TYPE_TO_EDGE_TYPE[pathType],
            markerEnd: getMarker(direction, "target"),
            markerStart: getMarker(direction, "source"),
            style: strokeDasharray ? {strokeDasharray} : undefined,
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
