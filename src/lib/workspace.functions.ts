import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./database";
import { workspace } from "./schema";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "./workspace.validators";
import { assertRole, getSessionAndOrg } from "./auth.helpers";

export const getWorkspaces = createServerFn({ method: "GET" }).handler(
  async () => {
    const { org, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

    return db
      .select()
      .from(workspace)
      .where(
        and(
          eq(workspace.organizationId, org.id),
          isNull(workspace.deletedAt),
        ),
      );
  },
);

export const getWorkspaceBySlug = createServerFn({ method: "GET" })
  .validator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { org, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

    const [ws] = await db
      .select()
      .from(workspace)
      .where(
        and(
          eq(workspace.organizationId, org.id),
          eq(workspace.slug, data.slug),
          isNull(workspace.deletedAt),
        ),
      );

    if (!ws) throw new Error("Workspace not found");
    return ws;
  });

export const createWorkspace = createServerFn({ method: "POST" })
  .validator((input: unknown) => createWorkspaceSchema.parse(input))
  .handler(async ({ data }) => {
    const { session, org, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    const id = crypto.randomUUID();

    const [created] = await db
      .insert(workspace)
      .values({
        id,
        organizationId: org.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        iconEmoji: data.iconEmoji,
        createdBy: session.user.id,
      })
      .returning();

    return created;
  });

export const updateWorkspace = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateWorkspaceSchema.parse(input))
  .handler(async ({ data }) => {
    const { org, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    const { id, ...updates } = data;

    const [updated] = await db
      .update(workspace)
      .set(updates)
      .where(
        and(eq(workspace.id, id), eq(workspace.organizationId, org.id)),
      )
      .returning();

    if (!updated) throw new Error("Workspace not found");
    return updated;
  });

export const deleteWorkspace = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { org, memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin"]);

    const [deleted] = await db
      .update(workspace)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(workspace.id, data.id), eq(workspace.organizationId, org.id)),
      )
      .returning();

    if (!deleted) throw new Error("Workspace not found");
    return deleted;
  });
