import { z } from "zod/v4";
import type { ElementType } from "./element.validators";

export const diagramTypes = ["system_context", "container", "component"] as const;
export type DiagramType = (typeof diagramTypes)[number];

export const pathTypes = ["straight", "curved", "orthogonal"] as const;
export type PathType = (typeof pathTypes)[number];

export const lineStyles = ["solid", "dashed", "dotted"] as const;
export type LineStyle = (typeof lineStyles)[number];

export const anchorPoints = ["auto", "top", "bottom", "left", "right"] as const;
export type AnchorPoint = (typeof anchorPoints)[number];

export const displayModes = ["normal", "sub_flow"] as const;
export type DisplayMode = (typeof displayModes)[number];

// ── Diagram CRUD schemas ────────────────────────────────────────────

export const createDiagramSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  diagramType: z.enum(diagramTypes),
  gridSize: z.number().int().min(5).max(100).default(20),
  snapToGrid: z.boolean().default(true),
});

export const updateDiagramSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  gridSize: z.number().int().min(5).max(100).optional(),
  snapToGrid: z.boolean().optional(),
});

export const deleteDiagramSchema = z.object({
  id: z.string(),
});

export const getDiagramsSchema = z.object({
  workspaceId: z.string(),
});

export const getDiagramSchema = z.object({
  id: z.string(),
});

export const getDiagramDataSchema = z.object({
  id: z.string(),
});

// ── Diagram Element schemas ─────────────────────────────────────────

export const addDiagramElementSchema = z.object({
  diagramId: z.string(),
  elementId: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  zIndex: z.number().int().default(0),
  displayMode: z.enum(displayModes).default("normal"),
  styleJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateDiagramElementSchema = z.object({
  id: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  zIndex: z.number().int().optional(),
  displayMode: z.enum(displayModes).optional(),
  styleJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const removeDiagramElementSchema = z.object({
  id: z.string(),
});

// ── Diagram Connection schemas ─────────────────────────────────────

export const addDiagramConnectionSchema = z.object({
  diagramId: z.string(),
  connectionId: z.string(),
  pathType: z.enum(pathTypes).default("curved"),
  lineStyle: z.enum(lineStyles).default("solid"),
  sourceAnchor: z.enum(anchorPoints).default("auto"),
  targetAnchor: z.enum(anchorPoints).default("auto"),
  labelPosition: z.number().min(0).max(1).default(0.5),
  controlPointsJson: z.record(z.string(), z.unknown()).optional(),
  styleJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateDiagramConnectionSchema = z.object({
  id: z.string(),
  pathType: z.enum(pathTypes).optional(),
  lineStyle: z.enum(lineStyles).optional(),
  sourceAnchor: z.enum(anchorPoints).optional(),
  targetAnchor: z.enum(anchorPoints).optional(),
  labelPosition: z.number().min(0).max(1).optional(),
  controlPointsJson: z.record(z.string(), z.unknown()).nullable().optional(),
  styleJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const removeDiagramConnectionSchema = z.object({
  id: z.string(),
});

// ── Display mode validation ─────────────────────────────────────────

const VALID_SUB_FLOW_TYPES: Record<DiagramType, ElementType[]> = {
  system_context: [],
  container: ["system"],
  component: ["app"],
};

export function validateDisplayMode(
  diagramType: DiagramType,
  elementType: ElementType,
  displayMode: DisplayMode,
): { valid: boolean; message?: string } {
  if (displayMode === "normal") return { valid: true };
  const allowed = VALID_SUB_FLOW_TYPES[diagramType];
  if (!allowed.includes(elementType)) {
    return { valid: false, message: `A ${elementType} cannot be a sub-flow on a ${diagramType} diagram.` };
  }
  return { valid: true };
}

// ── Child placement validation ──────────────────────────────────────

export const REQUIRES_PARENT_SUB_FLOW: Record<DiagramType, ElementType[]> = {
  system_context: [],
  container: ["app", "store"],
  component: ["component"],
};

export function validateChildPlacement(
  diagramType: DiagramType,
  elementType: ElementType,
  parentElementId: string | null,
  subFlowElementIds: Set<string>,
): { valid: boolean; message?: string } {
  const required = REQUIRES_PARENT_SUB_FLOW[diagramType];
  if (!required.includes(elementType)) return { valid: true };

  if (!parentElementId || !subFlowElementIds.has(parentElementId)) {
    return { valid: false, message: `A ${elementType} must be placed inside a sub-flow container.` };
  }
  return { valid: true };
}

// ── Element-for-diagram validation ──────────────────────────────────

const ALLOWED_ELEMENT_TYPES: Record<DiagramType, ElementType[]> = {
  system_context: ["actor", "system"],
  container: ["actor", "system", "app", "store"],
  component: ["actor", "system", "app", "store", "component"],
};

export function validateElementForDiagram(
  diagramType: DiagramType,
  elementType: ElementType,
): { valid: boolean; message?: string } {
  const allowed = ALLOWED_ELEMENT_TYPES[diagramType];
  if (!allowed.includes(elementType)) {
    return {
      valid: false,
      message: `A ${elementType} cannot be placed on a ${diagramType} diagram.`,
    };
  }
  return { valid: true };
}
