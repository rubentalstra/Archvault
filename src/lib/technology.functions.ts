import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { db } from "./database";
import { technology, elementTechnology } from "./schema";
import {
  createTechnologySchema,
  updateTechnologySchema,
  deleteTechnologySchema,
  getTechnologiesSchema,
  addElementTechnologySchema,
  removeElementTechnologySchema,
  reorderElementTechnologiesSchema,
} from "./technology.validators";
import { assertRole, getSessionAndOrg } from "./auth.helpers";

// ── Technology CRUD ─────────────────────────────────────────────────

export const getTechnologies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => getTechnologiesSchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

    const { count, sql: sqlTag } = await import("drizzle-orm");

    const assignmentCount = db
      .select({
        technologyId: elementTechnology.technologyId,
        count: count().as("assignment_count"),
      })
      .from(elementTechnology)
      .groupBy(elementTechnology.technologyId)
      .as("ac");

    return db
      .select({
        id: technology.id,
        workspaceId: technology.workspaceId,
        name: technology.name,
        description: technology.description,
        website: technology.website,
        iconSlug: technology.iconSlug,
        createdAt: technology.createdAt,
        updatedAt: technology.updatedAt,
        assignedCount: sqlTag<number>`coalesce(${assignmentCount.count}, 0)`.as(
          "assigned_count",
        ),
      })
      .from(technology)
      .leftJoin(
        assignmentCount,
        eq(technology.id, assignmentCount.technologyId),
      )
      .where(eq(technology.workspaceId, data.workspaceId));
  });

export const createTechnology = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createTechnologySchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    const id = crypto.randomUUID();
    const [created] = await db
      .insert(technology)
      .values({
        id,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        website: data.website ?? null,
        iconSlug: data.iconSlug ?? null,
      })
      .returning();

    return created;
  });

export const updateTechnology = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => updateTechnologySchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    const { id, ...updates } = data;
    const [updated] = await db
      .update(technology)
      .set(updates)
      .where(eq(technology.id, id))
      .returning();

    if (!updated) throw new Error("Technology not found");
    return updated;
  });

export const deleteTechnology = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteTechnologySchema.parse(input))
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin"]);

    const [deleted] = await db
      .delete(technology)
      .where(eq(technology.id, data.id))
      .returning();

    if (!deleted) throw new Error("Technology not found");
    return { success: true };
  });

// ── Element technology assignment ───────────────────────────────────

export const addElementTechnology = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    addElementTechnologySchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    await db
      .insert(elementTechnology)
      .values({
        elementId: data.elementId,
        technologyId: data.technologyId,
        sortOrder: data.sortOrder,
      })
      .onConflictDoNothing();

    return { success: true };
  });

export const removeElementTechnology = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    removeElementTechnologySchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    await db
      .delete(elementTechnology)
      .where(
        and(
          eq(elementTechnology.elementId, data.elementId),
          eq(elementTechnology.technologyId, data.technologyId),
        ),
      );

    return { success: true };
  });

export const reorderElementTechnologies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    reorderElementTechnologiesSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { memberRole } = await getSessionAndOrg();
    assertRole(memberRole, ["owner", "admin", "editor"]);

    await Promise.all(
      data.orderedTechnologyIds.map((technologyId, index) =>
        db
          .update(elementTechnology)
          .set({ sortOrder: index })
          .where(
            and(
              eq(elementTechnology.elementId, data.elementId),
              eq(elementTechnology.technologyId, technologyId),
            ),
          ),
      ),
    );

    return { success: true };
  });
