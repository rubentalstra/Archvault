import {createServerFn} from "@tanstack/react-start";
import {and, eq, isNull, sql} from "drizzle-orm";
import {db} from "./database";
import {element, elementTechnology, elementLink} from "./schema";
import {
    createElementSchema,
    updateElementSchema,
    deleteElementSchema,
    getElementsSchema,
    addTechnologySchema,
    updateTechnologySchema,
    removeTechnologySchema,
    reorderTechnologiesSchema,
    addLinkSchema,
    updateLinkSchema,
    removeLinkSchema,
    validateElementHierarchy,
} from "./element.validators";
import type {ElementType} from "./element.validators";
import {assertRole, getSessionAndOrg} from "./auth.helpers";
import {bulkFetchElementTags} from "./tag.functions";

// ── Helpers ────────────────────────────────────────────────────────────

async function getParentType(
    parentId: string | null | undefined,
    workspaceId: string,
): Promise<ElementType | null> {
    if (!parentId) return null;
    const [parent] = await db
        .select({elementType: element.elementType, workspaceId: element.workspaceId})
        .from(element)
        .where(and(eq(element.id, parentId), isNull(element.deletedAt)));
    if (!parent) throw new Error("Parent element not found");
    if (parent.workspaceId !== workspaceId)
        throw new Error("Parent element belongs to a different workspace");
    return parent.elementType;
}

async function checkCircularRef(elementId: string, newParentId: string) {
    let currentId: string | null = newParentId;
    const visited = new Set<string>();
    while (currentId) {
        if (currentId === elementId) throw new Error("Circular reference detected");
        if (visited.has(currentId)) break;
        visited.add(currentId);
        const [row] = await db
            .select({parentElementId: element.parentElementId})
            .from(element)
            .where(eq(element.id, currentId));
        currentId = row?.parentElementId ?? null;
    }
}

async function assertElementOwnership(elementId: string, orgWorkspaceIds: string[]) {
    const [el] = await db
        .select({workspaceId: element.workspaceId})
        .from(element)
        .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
    if (!el) throw new Error("Element not found");
    if (!orgWorkspaceIds.includes(el.workspaceId))
        throw new Error("Element not found");
    return el;
}

// ── Element CRUD ───────────────────────────────────────────────────────

export const getElements = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getElementsSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const elements = await db
            .select()
            .from(element)
            .where(
                and(
                    eq(element.workspaceId, data.workspaceId),
                    isNull(element.deletedAt),
                ),
            );

        const elementIds = elements.map((e) => e.id);
        if (elementIds.length === 0) return [];

        const technologies = await db
            .select()
            .from(elementTechnology)
            .where(
                sql`${elementTechnology.elementId}
                IN
                ${elementIds}`,
            );

        const links = await db
            .select()
            .from(elementLink)
            .where(
                sql`${elementLink.elementId}
                IN
                ${elementIds}`,
            );

        const {tagRows, tags} = await bulkFetchElementTags(elementIds);
        const tagMap = new Map(tags.map((t) => [t.id, t]));

        return elements.map((el) => ({
            ...el,
            technologies: technologies
                .filter((t) => t.elementId === el.id)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            links: links
                .filter((l) => l.elementId === el.id)
                .sort((a, b) => a.sortOrder - b.sortOrder),
            tags: tagRows
                .filter((r) => r.elementId === el.id)
                .map((r) => tagMap.get(r.tagId))
                .filter(Boolean),
        }));
    });

export const getElementById = createServerFn({method: "GET"})
    .inputValidator((input: { id: string }) => input)
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const [el] = await db
            .select()
            .from(element)
            .where(and(eq(element.id, data.id), isNull(element.deletedAt)));

        if (!el) throw new Error("Element not found");

        const technologies = await db
            .select()
            .from(elementTechnology)
            .where(eq(elementTechnology.elementId, el.id));

        const links = await db
            .select()
            .from(elementLink)
            .where(eq(elementLink.elementId, el.id));

        return {
            ...el,
            technologies: technologies.sort((a, b) => a.sortOrder - b.sortOrder),
            links: links.sort((a, b) => a.sortOrder - b.sortOrder),
        };
    });

export const createElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createElementSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const parentType = await getParentType(data.parentElementId, data.workspaceId);
        const hierarchy = validateElementHierarchy(data.elementType, parentType);
        if (!hierarchy.valid) throw new Error(hierarchy.message);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(element)
            .values({
                id,
                workspaceId: data.workspaceId,
                parentElementId: data.parentElementId ?? null,
                elementType: data.elementType,
                name: data.name,
                displayDescription: data.displayDescription ?? null,
                description: data.description ?? null,
                status: data.status,
                external: data.external,
                metadataJson: data.metadataJson ?? null,
                createdBy: session.user.id,
                updatedBy: session.user.id,
            })
            .returning();

        return created;
    });

export const updateElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateElementSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;

        const [existing] = await db
            .select()
            .from(element)
            .where(and(eq(element.id, id), isNull(element.deletedAt)));
        if (!existing) throw new Error("Element not found");

        // If parent is changing, validate hierarchy and circular refs
        if (updates.parentElementId !== undefined) {
            const newParentId = updates.parentElementId;
            if (newParentId) {
                await checkCircularRef(id, newParentId);
                const parentType = await getParentType(newParentId, existing.workspaceId);
                const hierarchy = validateElementHierarchy(existing.elementType, parentType);
                if (!hierarchy.valid) throw new Error(hierarchy.message);
            } else {
                // Removing parent — validate that element type allows no parent
                const hierarchy = validateElementHierarchy(existing.elementType, null);
                if (!hierarchy.valid) throw new Error(hierarchy.message);
            }
        }

        const [updated] = await db
            .update(element)
            .set({...updates, updatedBy: session.user.id})
            .where(eq(element.id, id))
            .returning();

        if (!updated) throw new Error("Element not found");
        return updated;
    });

export const deleteElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => deleteElementSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin"]);

        // Recursive soft-delete via CTE
        await db.execute(sql`
            WITH RECURSIVE descendants AS (SELECT id
                                           FROM element
                                           WHERE id = ${data.id}
                                           UNION ALL
                                           SELECT e.id
                                           FROM element e
                                                    JOIN descendants d ON e.parent_element_id = d.id
                                           WHERE e.deleted_at IS NULL)
            UPDATE element
            SET deleted_at = NOW(),
                updated_by = ${session.user.id}
            WHERE id IN (SELECT id FROM descendants)
        `);

        return {success: true};
    });

// ── Technology CRUD ────────────────────────────────────────────────────

export const addTechnology = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addTechnologySchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(elementTechnology)
            .values({
                id,
                elementId: data.elementId,
                name: data.name,
                iconSlug: data.iconSlug ?? null,
                sortOrder: data.sortOrder,
            })
            .returning();

        return created;
    });

export const updateTechnology = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateTechnologySchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(elementTechnology)
            .set(updates)
            .where(eq(elementTechnology.id, id))
            .returning();

        if (!updated) throw new Error("Technology not found");
        return updated;
    });

export const removeTechnology = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeTechnologySchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [deleted] = await db
            .delete(elementTechnology)
            .where(eq(elementTechnology.id, data.id))
            .returning();

        if (!deleted) throw new Error("Technology not found");
        return {success: true};
    });

export const reorderTechnologies = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => reorderTechnologiesSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await Promise.all(
            data.orderedIds.map((id, index) =>
                db
                    .update(elementTechnology)
                    .set({sortOrder: index})
                    .where(
                        and(
                            eq(elementTechnology.id, id),
                            eq(elementTechnology.elementId, data.elementId),
                        ),
                    ),
            ),
        );

        return {success: true};
    });

// ── Link CRUD ──────────────────────────────────────────────────────────

export const addLink = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addLinkSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(elementLink)
            .values({
                id,
                elementId: data.elementId,
                url: data.url,
                label: data.label ?? null,
                sortOrder: data.sortOrder,
            })
            .returning();

        return created;
    });

export const updateLink = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateLinkSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(elementLink)
            .set(updates)
            .where(eq(elementLink.id, id))
            .returning();

        if (!updated) throw new Error("Link not found");
        return updated;
    });

export const removeLink = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeLinkSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [deleted] = await db
            .delete(elementLink)
            .where(eq(elementLink.id, data.id))
            .returning();

        if (!deleted) throw new Error("Link not found");
        return {success: true};
    });
