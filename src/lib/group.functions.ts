import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./database";
import { group, groupMembership } from "./schema";
import {
  createGroupSchema,
  updateGroupSchema,
  deleteGroupSchema,
  getGroupsSchema,
  addGroupMembershipSchema,
  removeGroupMembershipSchema,
  validateGroupParent,
} from "./group.validators";
import { assertRole, getSessionAndOrg } from "./auth.helpers";

// ── Group CRUD ──────────────────────────────────────────────────────

export const getGroups = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => getGroupsSchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

    return db
      .select()
      .from(group)
      .where(
        and(
          eq(group.workspaceId, data.workspaceId),
          isNull(group.deletedAt),
        ),
      );
  });

export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createGroupSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    if (data.parentGroupId) {
      const allGroups = await db
        .select({ id: group.id, parentGroupId: group.parentGroupId })
        .from(group)
        .where(
          and(
            eq(group.workspaceId, data.workspaceId),
            isNull(group.deletedAt),
          ),
        );
      const validation = validateGroupParent("", data.parentGroupId, allGroups);
      if (!validation.valid) throw new Error(validation.message);
    }

    const id = crypto.randomUUID();
    const [created] = await db
      .insert(group)
      .values({
        id,
        workspaceId: data.workspaceId,
        name: data.name,
        color: data.color,
        parentGroupId: data.parentGroupId ?? null,
        description: data.description ?? null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return created;
  });

export const updateGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateGroupSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    const { id, ...updates } = data;

    if (updates.parentGroupId !== undefined) {
      const [existing] = await db
        .select({ workspaceId: group.workspaceId })
        .from(group)
        .where(eq(group.id, id));
      if (!existing) throw new Error("Group not found");

      const allGroups = await db
        .select({ id: group.id, parentGroupId: group.parentGroupId })
        .from(group)
        .where(
          and(
            eq(group.workspaceId, existing.workspaceId),
            isNull(group.deletedAt),
          ),
        );
      const validation = validateGroupParent(id, updates.parentGroupId, allGroups);
      if (!validation.valid) throw new Error(validation.message);
    }

    const [updated] = await db
      .update(group)
      .set({ ...updates, updatedBy: session.user.id })
      .where(eq(group.id, id))
      .returning();

    if (!updated) throw new Error("Group not found");
    return updated;
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteGroupSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin"]);

    const [updated] = await db
      .update(group)
      .set({ deletedAt: new Date(), updatedBy: session.user.id })
      .where(and(eq(group.id, data.id), isNull(group.deletedAt)))
      .returning();

    if (!updated) throw new Error("Group not found");
    return { success: true };
  });

// ── Group membership ────────────────────────────────────────────────

export const addGroupMembership = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => addGroupMembershipSchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    await db
      .insert(groupMembership)
      .values({
        elementId: data.elementId,
        groupId: data.groupId,
      })
      .onConflictDoNothing();

    return { success: true };
  });

export const removeGroupMembership = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => removeGroupMembershipSchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    await db
      .delete(groupMembership)
      .where(
        and(
          eq(groupMembership.elementId, data.elementId),
          eq(groupMembership.groupId, data.groupId),
        ),
      );

    return { success: true };
  });

