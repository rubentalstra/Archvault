import {createServerFn} from "@tanstack/react-start";
import {and, eq, isNull, inArray} from "drizzle-orm";
import {db} from "./database";
import {relationship, element, tag, relationshipTag} from "./schema";
import {
    createRelationshipSchema,
    updateRelationshipSchema,
    deleteRelationshipSchema,
    getRelationshipsSchema,
    validateRelationshipEndpoints,
} from "./relationship.validators";
import {assertRole, getSessionAndOrg} from "./auth.helpers";

// ── Helpers ────────────────────────────────────────────────────────────

async function assertElementInWorkspace(elementId: string, workspaceId: string) {
    const [el] = await db
        .select({id: element.id, workspaceId: element.workspaceId})
        .from(element)
        .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
    if (!el) throw new Error("Element not found");
    if (el.workspaceId !== workspaceId)
        throw new Error("Element belongs to a different workspace");
    return el;
}

// ── Relationship CRUD ─────────────────────────────────────────────────

export const getRelationships = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getRelationshipsSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const relationships = await db
            .select()
            .from(relationship)
            .where(
                and(
                    eq(relationship.workspaceId, data.workspaceId),
                    isNull(relationship.deletedAt),
                ),
            );

        const relationshipIds = relationships.map((r) => r.id);

        const tagRows = relationshipIds.length > 0
            ? await db.select().from(relationshipTag).where(inArray(relationshipTag.relationshipId, relationshipIds))
            : [];
        const uniqueTagIds = [...new Set(tagRows.map((r) => r.tagId))];
        const tags = uniqueTagIds.length > 0
            ? await db.select().from(tag).where(inArray(tag.id, uniqueTagIds))
            : [];
        const tagMap = new Map(tags.map((t) => [t.id, t]));

        return relationships.map((rel) => ({
            ...rel,
            tags: tagRows
                .filter((r) => r.relationshipId === rel.id)
                .map((r) => tagMap.get(r.tagId))
                .filter(Boolean),
        }));
    });

export const createRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const endpoints = validateRelationshipEndpoints(data.sourceElementId, data.targetElementId);
        if (!endpoints.valid) throw new Error(endpoints.message);

        await assertElementInWorkspace(data.sourceElementId, data.workspaceId);
        await assertElementInWorkspace(data.targetElementId, data.workspaceId);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(relationship)
            .values({
                id,
                workspaceId: data.workspaceId,
                sourceElementId: data.sourceElementId,
                targetElementId: data.targetElementId,
                direction: data.direction,
                description: data.description ?? null,
                technology: data.technology ?? null,
                createdBy: session.user.id,
                updatedBy: session.user.id,
            })
            .returning();

        return created;
    });

export const updateRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;

        const [existing] = await db
            .select()
            .from(relationship)
            .where(and(eq(relationship.id, id), isNull(relationship.deletedAt)));
        if (!existing) throw new Error("Relationship not found");

        const newSourceId = updates.sourceElementId ?? existing.sourceElementId;
        const newTargetId = updates.targetElementId ?? existing.targetElementId;

        const endpoints = validateRelationshipEndpoints(newSourceId, newTargetId);
        if (!endpoints.valid) throw new Error(endpoints.message);

        if (updates.sourceElementId) {
            await assertElementInWorkspace(updates.sourceElementId, existing.workspaceId);
        }
        if (updates.targetElementId) {
            await assertElementInWorkspace(updates.targetElementId, existing.workspaceId);
        }

        const [updated] = await db
            .update(relationship)
            .set({...updates, updatedBy: session.user.id})
            .where(eq(relationship.id, id))
            .returning();

        if (!updated) throw new Error("Relationship not found");
        return updated;
    });

export const deleteRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => deleteRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin"]);

        const [updated] = await db
            .update(relationship)
            .set({deletedAt: new Date(), updatedBy: session.user.id})
            .where(and(eq(relationship.id, data.id), isNull(relationship.deletedAt)))
            .returning();

        if (!updated) throw new Error("Relationship not found");
        return {success: true};
    });
