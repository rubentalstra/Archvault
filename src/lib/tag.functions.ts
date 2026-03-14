import {createServerFn} from "@tanstack/react-start";
import {and, eq, sql} from "drizzle-orm";
import {db} from "./database";
import {tag, elementTag, relationshipTag} from "./schema";
import {
    createTagSchema,
    updateTagSchema,
    deleteTagSchema,
    getTagsSchema,
    addElementTagSchema,
    removeElementTagSchema,
    addRelationshipTagSchema,
    removeRelationshipTagSchema,
} from "./tag.validators";
import {assertRole, getSessionAndOrg} from "./auth.helpers";

// ── Tag CRUD ─────────────────────────────────────────────────────────

export const getTags = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getTagsSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        return db
            .select()
            .from(tag)
            .where(eq(tag.workspaceId, data.workspaceId));
    });

export const createTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(tag)
            .values({
                id,
                workspaceId: data.workspaceId,
                name: data.name,
                color: data.color,
                icon: data.icon ?? null,
            })
            .returning();

        return created;
    });

export const updateTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(tag)
            .set(updates)
            .where(eq(tag.id, id))
            .returning();

        if (!updated) throw new Error("Tag not found");
        return updated;
    });

export const deleteTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => deleteTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin"]);

        const [deleted] = await db
            .delete(tag)
            .where(eq(tag.id, data.id))
            .returning();

        if (!deleted) throw new Error("Tag not found");
        return {success: true};
    });

// ── Element tag assignment ───────────────────────────────────────────

export const addElementTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addElementTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db
            .insert(elementTag)
            .values({
                elementId: data.elementId,
                tagId: data.tagId,
            })
            .onConflictDoNothing();

        return {success: true};
    });

export const removeElementTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeElementTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db
            .delete(elementTag)
            .where(
                and(
                    eq(elementTag.elementId, data.elementId),
                    eq(elementTag.tagId, data.tagId),
                ),
            );

        return {success: true};
    });

// ── Relationship tag assignment ──────────────────────────────────────

export const addRelationshipTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addRelationshipTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db
            .insert(relationshipTag)
            .values({
                relationshipId: data.relationshipId,
                tagId: data.tagId,
            })
            .onConflictDoNothing();

        return {success: true};
    });

export const removeRelationshipTag = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeRelationshipTagSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db
            .delete(relationshipTag)
            .where(
                and(
                    eq(relationshipTag.relationshipId, data.relationshipId),
                    eq(relationshipTag.tagId, data.tagId),
                ),
            );

        return {success: true};
    });

// ── Bulk fetch helpers (used by getElements / getRelationships) ──────

export async function bulkFetchElementTags(elementIds: string[]) {
    if (elementIds.length === 0) return {tagRows: [], tags: []};

    const tagRows = await db
        .select()
        .from(elementTag)
        .where(sql`${elementTag.elementId}
        IN
        ${elementIds}`);

    const uniqueTagIds = [...new Set(tagRows.map((r) => r.tagId))];
    if (uniqueTagIds.length === 0) return {tagRows, tags: []};

    const tags = await db
        .select()
        .from(tag)
        .where(sql`${tag.id}
        IN
        ${uniqueTagIds}`);

    return {tagRows, tags};
}

export async function bulkFetchRelationshipTags(relationshipIds: string[]) {
    if (relationshipIds.length === 0) return {tagRows: [], tags: []};

    const tagRows = await db
        .select()
        .from(relationshipTag)
        .where(sql`${relationshipTag.relationshipId}
        IN
        ${relationshipIds}`);

    const uniqueTagIds = [...new Set(tagRows.map((r) => r.tagId))];
    if (uniqueTagIds.length === 0) return {tagRows, tags: []};

    const tags = await db
        .select()
        .from(tag)
        .where(sql`${tag.id}
        IN
        ${uniqueTagIds}`);

    return {tagRows, tags};
}
