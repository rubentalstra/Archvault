import { z } from "zod/v4";

// ── Tag CRUD schemas ─────────────────────────────────────────────────

export const createTagSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional(),
});

export const updateTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().nullable().optional(),
});

export const deleteTagSchema = z.object({
  id: z.string(),
});

export const getTagsSchema = z.object({
  workspaceId: z.string(),
});

// ── Tag assignment schemas ───────────────────────────────────────────

export const addElementTagSchema = z.object({
  elementId: z.string(),
  tagId: z.string(),
});

export const removeElementTagSchema = z.object({
  elementId: z.string(),
  tagId: z.string(),
});

export const addRelationshipTagSchema = z.object({
  relationshipId: z.string(),
  tagId: z.string(),
});

export const removeRelationshipTagSchema = z.object({
  relationshipId: z.string(),
  tagId: z.string(),
});

// ── Constants ────────────────────────────────────────────────────────

export const TAG_ICONS = [
  "globe",
  "database",
  "server",
  "cloud",
  "lock",
  "shield",
  "network",
  "monitor",
  "cpu",
  "hard-drive",
  "wifi",
  "smartphone",
  "tablet",
  "laptop",
  "container",
  "box",
  "archive",
  "folder",
  "file",
  "code",
  "terminal",
  "git-branch",
  "layers",
  "layout",
  "grid",
  "zap",
  "activity",
  "bar-chart",
  "pie-chart",
  "users",
  "user",
  "key",
  "settings",
  "wrench",
  "bug",
  "bell",
  "mail",
  "message-square",
  "search",
  "eye",
] as const;

export type TagIconName = (typeof TAG_ICONS)[number];

export const TAG_COLOR_PRESETS = [
  "#16D17D",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#14B8A6",
  "#64748B",
] as const;
