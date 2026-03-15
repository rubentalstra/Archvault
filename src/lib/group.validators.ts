import { z } from "zod/v4";
import { TAG_COLOR_PRESETS } from "./tag.validators";

// ── Group CRUD schemas ──────────────────────────────────────────────

export const createGroupSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  parentGroupId: z.string().optional(),
  description: z.string().optional(),
});

export const updateGroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  parentGroupId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const deleteGroupSchema = z.object({
  id: z.string(),
});

export const getGroupsSchema = z.object({
  workspaceId: z.string(),
});

// ── Group membership schemas ────────────────────────────────────────

export const addGroupMembershipSchema = z.object({
  elementId: z.string(),
  groupId: z.string(),
});

export const removeGroupMembershipSchema = z.object({
  elementId: z.string(),
  groupId: z.string(),
});

// ── Constants ───────────────────────────────────────────────────────

export const GROUP_COLOR_PRESETS = TAG_COLOR_PRESETS;

// ── Circular reference validation ───────────────────────────────────

export function validateGroupParent(
  groupId: string,
  parentGroupId: string | null,
  allGroups: { id: string; parentGroupId: string | null }[],
): { valid: boolean; message?: string } {
  if (!parentGroupId) return { valid: true };
  if (parentGroupId === groupId) {
    return { valid: false, message: "A group cannot be its own parent." };
  }

  const groupMap = new Map(allGroups.map((g) => [g.id, g.parentGroupId]));
  const visited = new Set<string>();
  let current: string | null = parentGroupId;

  while (current) {
    if (current === groupId) {
      return { valid: false, message: "Cannot set parent: would create a circular reference." };
    }
    if (visited.has(current)) break;
    visited.add(current);
    current = groupMap.get(current) ?? null;
  }

  return { valid: true };
}
