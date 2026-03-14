import { z } from "zod/v4";

export const elementTypes = ["actor", "group", "system", "app", "store", "component"] as const;
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

export const addElementToGroupSchema = z.object({
  elementId: z.string(),
  groupElementId: z.string(),
});

export const removeElementFromGroupSchema = z.object({
  elementId: z.string(),
  groupElementId: z.string(),
});

export const addTechnologySchema = z.object({
  elementId: z.string(),
  name: z.string().min(1).max(100),
  iconSlug: z.string().optional(),
});

export const removeTechnologySchema = z.object({
  id: z.string(),
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
  actor: ["group"],
  group: ["group"],
  system: ["group"],
  app: ["system"],
  store: ["system"],
  component: ["app"],
};

export function validateElementHierarchy(
  elementType: ElementType,
  parentType: ElementType | null | undefined,
): { valid: boolean; message?: string } {
  const allowedParents = VALID_PARENTS[elementType];

  if (!allowedParents) {
    return parentType
      ? { valid: false, message: `A ${elementType} cannot have a parent element.` }
      : { valid: true };
  }

  if (!parentType) {
    if (elementType === "app" || elementType === "store" || elementType === "component") {
      return {
        valid: false,
        message: `A ${elementType} must be nested under ${allowedParents.join(" or ")}.`,
      };
    }
    return { valid: true };
  }

  if (!allowedParents.includes(parentType)) {
    return {
      valid: false,
      message: `A ${elementType} must be nested under ${allowedParents.join(" or ")}, not ${parentType}.`,
    };
  }

  return { valid: true };
}
