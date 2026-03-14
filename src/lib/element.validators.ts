import { z } from "zod/v4";

export const elementTypes = ["person", "system", "container", "component"] as const;
export type ElementType = (typeof elementTypes)[number];

export const elementStatuses = ["planned", "live", "deprecated"] as const;
export type ElementStatus = (typeof elementStatuses)[number];

// ── Element CRUD schemas ───────────────────────────────────────────────

export const createElementSchema = z.object({
  workspaceId: z.string(),
  parentElementId: z.string().optional(),
  elementType: z.enum(elementTypes),
  name: z.string().min(1).max(100),
  displayDescription: z.string().max(120).optional(),
  description: z.string().optional(),
  status: z.enum(elementStatuses).default("live"),
  external: z.boolean().default(false),
  metadataJson: z.record(z.string(), z.unknown()).optional(),
});

export const updateElementSchema = z.object({
  id: z.string(),
  parentElementId: z.string().nullable().optional(),
  name: z.string().min(1).max(100).optional(),
  displayDescription: z.string().max(120).nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(elementStatuses).optional(),
  external: z.boolean().optional(),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const deleteElementSchema = z.object({
  id: z.string(),
});

export const getElementsSchema = z.object({
  workspaceId: z.string(),
});

// ── Technology schemas ─────────────────────────────────────────────────

export const addTechnologySchema = z.object({
  elementId: z.string(),
  name: z.string().min(1).max(100),
  iconSlug: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateTechnologySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  iconSlug: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const removeTechnologySchema = z.object({
  id: z.string(),
});

export const reorderTechnologiesSchema = z.object({
  elementId: z.string(),
  orderedIds: z.array(z.string()),
});

// ── Link schemas ───────────────────────────────────────────────────────

export const addLinkSchema = z.object({
  elementId: z.string(),
  url: z.string().url(),
  label: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateLinkSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  label: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const removeLinkSchema = z.object({
  id: z.string(),
});

// ── Hierarchy validation ───────────────────────────────────────────────

const VALID_PARENTS: Record<ElementType, ElementType[] | null> = {
  person: null,
  system: ["system"],
  container: ["system"],
  component: ["container"],
};

export function validateElementHierarchy(
  elementType: ElementType,
  parentType: ElementType | null | undefined,
): { valid: boolean; message?: string } {
  const allowedParents = VALID_PARENTS[elementType];

  if (allowedParents === null) {
    // person: no parent allowed
    if (parentType) {
      return { valid: false, message: `A ${elementType} cannot have a parent element.` };
    }
    return { valid: true };
  }

  if (elementType === "system") {
    // system: no parent OR parent is system
    if (!parentType) return { valid: true };
    if (allowedParents.includes(parentType)) return { valid: true };
    return { valid: false, message: "A system can only be nested under another system." };
  }

  // container/component: parent is required
  if (!parentType) {
    const required = elementType === "container" ? "system" : "container";
    return { valid: false, message: `A ${elementType} must have a ${required} as its parent.` };
  }

  if (!allowedParents.includes(parentType)) {
    const required = elementType === "container" ? "system" : "container";
    return { valid: false, message: `A ${elementType} must have a ${required} as its parent, not a ${parentType}.` };
  }

  return { valid: true };
}
