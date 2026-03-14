import {createServerFn} from "@tanstack/react-start";
import {and, eq, isNull, inArray, desc} from "drizzle-orm";
import {db} from "./database";
import {element, technology, elementTechnology, elementLink, tag, elementTag, elementGroup} from "./schema";
import {
    createElementSchema,
    updateElementSchema,
    deleteElementSchema,
    getElementsSchema,
    addElementToGroupSchema,
    removeElementFromGroupSchema,
    addTechnologySchema,
    removeTechnologySchema,
    addLinkSchema,
    updateLinkSchema,
    removeLinkSchema,
    validateElementHierarchy,
} from "./element.validators";
import type {ElementType} from "./element.validators";
import {assertRole, getSessionAndOrg} from "./auth.helpers";

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
            .select({
                elementId: elementTechnology.elementId,
                technologyId: elementTechnology.technologyId,
                sortOrder: elementTechnology.sortOrder,
                name: technology.name,
                iconSlug: technology.iconSlug,
            })
            .from(elementTechnology)
            .innerJoin(technology, eq(elementTechnology.technologyId, technology.id))
            .where(inArray(elementTechnology.elementId, elementIds));

        const links = await db
            .select()
            .from(elementLink)
            .where(inArray(elementLink.elementId, elementIds));

        const tagRows = await db
            .select()
            .from(elementTag)
            .where(inArray(elementTag.elementId, elementIds));
        const uniqueTagIds = [...new Set(tagRows.map((r) => r.tagId))];
        const tags = uniqueTagIds.length > 0
            ? await db.select().from(tag).where(inArray(tag.id, uniqueTagIds))
            : [];
        const tagMap = new Map(tags.map((t) => [t.id, t]));

        const groupRows = await db
            .select({
                elementId: elementGroup.elementId,
                groupElementId: elementGroup.groupElementId,
                groupName: element.name,
            })
            .from(elementGroup)
            .innerJoin(element, eq(elementGroup.groupElementId, element.id))
            .where(inArray(elementGroup.elementId, elementIds));

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
            groups: groupRows
                .filter((g) => g.elementId === el.id)
                .map((g) => ({id: g.groupElementId, name: g.groupName})),
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
            .select({
                technologyId: elementTechnology.technologyId,
                sortOrder: elementTechnology.sortOrder,
                name: technology.name,
                iconSlug: technology.iconSlug,
            })
            .from(elementTechnology)
            .innerJoin(technology, eq(elementTechnology.technologyId, technology.id))
            .where(eq(elementTechnology.elementId, el.id));

        const links = await db
            .select()
            .from(elementLink)
            .where(eq(elementLink.elementId, el.id));

        const groups = await db
            .select({
                id: elementGroup.groupElementId,
                name: element.name,
            })
            .from(elementGroup)
            .innerJoin(element, eq(elementGroup.groupElementId, element.id))
            .where(eq(elementGroup.elementId, el.id));

        return {
            ...el,
            technologies: technologies.sort((a, b) => a.sortOrder - b.sortOrder),
            links: links.sort((a, b) => a.sortOrder - b.sortOrder),
            groups,
        };
    });

export const createElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createElementSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        // Inline helper: get parent element type
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

        // Inline helpers
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

        const {id, ...updates} = data;

        const [existing] = await db
            .select()
            .from(element)
            .where(and(eq(element.id, id), isNull(element.deletedAt)));
        if (!existing) throw new Error("Element not found");

        if (updates.parentElementId !== undefined) {
            const newParentId = updates.parentElementId;
            if (newParentId) {
                await checkCircularRef(id, newParentId);
                const parentType = await getParentType(newParentId, existing.workspaceId);
                const hierarchy = validateElementHierarchy(existing.elementType, parentType);
                if (!hierarchy.valid) throw new Error(hierarchy.message);
            } else {
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

        const {sql: sqlTag} = await import("drizzle-orm");
        await db.execute(sqlTag`
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

// ── Technology CRUD ──────────��────────────────────────────────────────

export const addTechnology = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addTechnologySchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [el] = await db
            .select({workspaceId: element.workspaceId})
            .from(element)
            .where(and(eq(element.id, data.elementId), isNull(element.deletedAt)));
        if (!el) throw new Error("Element not found");

        const [lastTechnology] = await db
            .select({sortOrder: elementTechnology.sortOrder})
            .from(elementTechnology)
            .where(eq(elementTechnology.elementId, data.elementId))
            .orderBy(desc(elementTechnology.sortOrder))
            .limit(1);

        const technologyId = crypto.randomUUID();
        const [createdTech] = await db
            .insert(technology)
            .values({
                id: technologyId,
                workspaceId: el.workspaceId,
                name: data.name,
                iconSlug: data.iconSlug ?? null,
            })
            .returning();

        await db.insert(elementTechnology).values({
            elementId: data.elementId,
            technologyId,
            sortOrder: Number(lastTechnology?.sortOrder ?? -1) + 1,
        });

        return createdTech;
    });

export const removeTechnology = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeTechnologySchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db.delete(elementTechnology).where(eq(elementTechnology.technologyId, data.id));
        await db.delete(technology).where(eq(technology.id, data.id));

        return {success: true};
    });

// ── Group assignment CRUD ────────────────────────────────────────────

export const addElementToGroup = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addElementToGroupSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        if (data.elementId === data.groupElementId) {
            throw new Error("An element cannot be assigned to itself as a group.");
        }

        const [memberElement] = await db
            .select({id: element.id, workspaceId: element.workspaceId, elementType: element.elementType})
            .from(element)
            .where(and(eq(element.id, data.elementId), isNull(element.deletedAt)));
        const [groupElement] = await db
            .select({id: element.id, workspaceId: element.workspaceId, elementType: element.elementType})
            .from(element)
            .where(and(eq(element.id, data.groupElementId), isNull(element.deletedAt)));

        if (!memberElement || !groupElement) throw new Error("Element not found");
        if (memberElement.workspaceId !== groupElement.workspaceId) {
            throw new Error("Elements must belong to the same workspace.");
        }
        if (groupElement.elementType !== "group") {
            throw new Error("Group assignment target must be a group element.");
        }
        if (memberElement.elementType === "group") {
            throw new Error("Groups cannot be assigned to groups.");
        }

        await db.insert(elementGroup).values({
            elementId: data.elementId,
            groupElementId: data.groupElementId,
        }).onConflictDoNothing();

        return {success: true};
    });

export const removeElementFromGroup = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeElementFromGroupSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        await db.delete(elementGroup).where(
            and(
                eq(elementGroup.elementId, data.elementId),
                eq(elementGroup.groupElementId, data.groupElementId),
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
