import {createServerFn} from "@tanstack/react-start";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "./database";
import {
    diagram,
    diagramElement,
    diagramRelationship,
    element,
    technology,
    elementTechnology,
    relationship,
} from "./schema";
import {
    createDiagramSchema,
    updateDiagramSchema,
    deleteDiagramSchema,
    getDiagramsSchema,
    getDiagramSchema,
    getDiagramDataSchema,
    addDiagramElementSchema,
    updateDiagramElementSchema,
    removeDiagramElementSchema,
    addDiagramRelationshipSchema,
    updateDiagramRelationshipSchema,
    removeDiagramRelationshipSchema,
    validateDiagramScope,
    validateElementForDiagram,
} from "./diagram.validators";
import type {DiagramType} from "./diagram.validators";
import type {ElementType} from "./element.validators";
import {assertRole, getSessionAndOrg} from "./auth.helpers";

// NOTE: No module-level helper functions that reference `db`.
// All helpers are inlined into handlers so the bundler can tree-shake
// server-only imports (`db`, `pg`) from the client bundle.

// ── Diagram CRUD ──────────────────────────────────────────────────────

export const getDiagrams = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getDiagramsSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const {sql: sqlTag, count} = await import("drizzle-orm");

        const elementCountSubquery = db
            .select({
                diagramId: diagramElement.diagramId,
                count: count().as("element_count"),
            })
            .from(diagramElement)
            .groupBy(diagramElement.diagramId)
            .as("ec");

        const rows = await db
            .select({
                id: diagram.id,
                workspaceId: diagram.workspaceId,
                name: diagram.name,
                description: diagram.description,
                diagramType: diagram.diagramType,
                scopeElementId: diagram.scopeElementId,
                gridSize: diagram.gridSize,
                snapToGrid: diagram.snapToGrid,
                createdAt: diagram.createdAt,
                updatedAt: diagram.updatedAt,
                scopeElementName: element.name,
                elementCount: sqlTag<number>`coalesce(${elementCountSubquery.count}, 0)`.as("element_count"),
            })
            .from(diagram)
            .leftJoin(element, eq(diagram.scopeElementId, element.id))
            .leftJoin(elementCountSubquery, eq(diagram.id, elementCountSubquery.diagramId))
            .where(
                and(
                    eq(diagram.workspaceId, data.workspaceId),
                    isNull(diagram.deletedAt),
                ),
            );

        return rows;
    });

export const getDiagram = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getDiagramSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const [d] = await db
            .select()
            .from(diagram)
            .where(and(eq(diagram.id, data.id), isNull(diagram.deletedAt)));
        if (!d) throw new Error("Diagram not found");

        const elements = await db
            .select()
            .from(diagramElement)
            .where(eq(diagramElement.diagramId, data.id));

        const relationships = await db
            .select()
            .from(diagramRelationship)
            .where(eq(diagramRelationship.diagramId, data.id));

        return {...d, diagramElements: elements, diagramRelationships: relationships};
    });

export const getDiagramData = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getDiagramDataSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const [d] = await db
            .select()
            .from(diagram)
            .where(and(eq(diagram.id, data.id), isNull(diagram.deletedAt)));
        if (!d) throw new Error("Diagram not found");

        const elements = await db
            .select({
                id: diagramElement.id,
                diagramId: diagramElement.diagramId,
                elementId: diagramElement.elementId,
                x: diagramElement.x,
                y: diagramElement.y,
                width: diagramElement.width,
                height: diagramElement.height,
                zIndex: diagramElement.zIndex,
                elementName: element.name,
                elementType: element.elementType,
                displayDescription: element.displayDescription,
                status: element.status,
                external: element.external,
                parentElementId: element.parentElementId,
            })
            .from(diagramElement)
            .leftJoin(element, eq(diagramElement.elementId, element.id))
            .where(
                and(
                    eq(diagramElement.diagramId, data.id),
                    isNull(element.deletedAt),
                ),
            );

        const relationships = await db
            .select({
                id: diagramRelationship.id,
                diagramId: diagramRelationship.diagramId,
                relationshipId: diagramRelationship.relationshipId,
                pathType: diagramRelationship.pathType,
                lineStyle: diagramRelationship.lineStyle,
                sourceAnchor: diagramRelationship.sourceAnchor,
                targetAnchor: diagramRelationship.targetAnchor,
                labelPosition: diagramRelationship.labelPosition,
                sourceElementId: relationship.sourceElementId,
                targetElementId: relationship.targetElementId,
                direction: relationship.direction,
                description: relationship.description,
                technology: relationship.technology,
            })
            .from(diagramRelationship)
            .leftJoin(
                relationship,
                eq(diagramRelationship.relationshipId, relationship.id),
            )
            .where(
                and(
                    eq(diagramRelationship.diagramId, data.id),
                    isNull(relationship.deletedAt),
                ),
            );

        // Fetch technologies for all elements on this diagram
        const elementIds = elements.map((e) => e.elementId);
        let techMap = new Map<string, string[]>();
        if (elementIds.length > 0) {
            const {inArray} = await import("drizzle-orm");
            const techs = await db
                .select({
                    elementId: elementTechnology.elementId,
                    name: technology.name,
                    sortOrder: elementTechnology.sortOrder,
                })
                .from(elementTechnology)
                .innerJoin(technology, eq(elementTechnology.technologyId, technology.id))
                .where(inArray(elementTechnology.elementId, elementIds));

            techMap = new Map<string, string[]>();
            for (const t of techs.sort((a, b) => a.sortOrder - b.sortOrder)) {
                const existing = techMap.get(t.elementId) ?? [];
                existing.push(t.name);
                techMap.set(t.elementId, existing);
            }
        }

        const elementsWithTech = elements.map((e) => ({
            ...e,
            technologies: techMap.get(e.elementId) ?? [],
        }));

        return {diagram: d, elements: elementsWithTech, relationships};
    });

export const createDiagram = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createDiagramSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        // Inline helper: fetch element type
        async function fetchElementType(elementId: string): Promise<{ type: ElementType; workspaceId: string }> {
            const [el] = await db
                .select({type: element.elementType, workspaceId: element.workspaceId})
                .from(element)
                .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
            if (!el) throw new Error("Element not found");
            return {type: el.type, workspaceId: el.workspaceId};
        }

        if (data.scopeElementId) {
            const scopeEl = await fetchElementType(data.scopeElementId);
            const validation = validateDiagramScope(
                data.diagramType,
                scopeEl.type,
            );
            if (!validation.valid) throw new Error(validation.message);
        } else {
            const validation = validateDiagramScope(
                data.diagramType,
                null,
            );
            if (!validation.valid) throw new Error(validation.message);
        }

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(diagram)
            .values({
                id,
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description ?? null,
                diagramType: data.diagramType,
                scopeElementId: data.scopeElementId ?? null,
                gridSize: data.gridSize,
                snapToGrid: data.snapToGrid,
                createdBy: session.user.id,
                updatedBy: session.user.id,
            })
            .returning();

        return created;
    });

export const updateDiagram = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateDiagramSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        // Inline helper
        async function fetchElementType(elementId: string): Promise<{ type: ElementType; workspaceId: string }> {
            const [el] = await db
                .select({type: element.elementType, workspaceId: element.workspaceId})
                .from(element)
                .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
            if (!el) throw new Error("Element not found");
            return {type: el.type, workspaceId: el.workspaceId};
        }

        const {id, ...updates} = data;

        const [existing] = await db
            .select()
            .from(diagram)
            .where(and(eq(diagram.id, id), isNull(diagram.deletedAt)));
        if (!existing) throw new Error("Diagram not found");

        if (updates.scopeElementId !== undefined) {
            if (updates.scopeElementId) {
                const scopeEl = await fetchElementType(updates.scopeElementId);
                const validation = validateDiagramScope(
                    existing.diagramType,
                    scopeEl.type,
                );
                if (!validation.valid) throw new Error(validation.message);
            } else {
                const validation = validateDiagramScope(
                    existing.diagramType,
                    null,
                );
                if (!validation.valid) throw new Error(validation.message);
            }
        }

        const [updated] = await db
            .update(diagram)
            .set({...updates, updatedBy: session.user.id})
            .where(eq(diagram.id, id))
            .returning();

        if (!updated) throw new Error("Diagram not found");
        return updated;
    });

export const deleteDiagram = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => deleteDiagramSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin"]);

        const [updated] = await db
            .update(diagram)
            .set({deletedAt: new Date(), updatedBy: session.user.id})
            .where(and(eq(diagram.id, data.id), isNull(diagram.deletedAt)))
            .returning();

        if (!updated) throw new Error("Diagram not found");
        return {success: true};
    });

// ── Diagram Element CRUD ─────────────────────────────────────────────

export const addDiagramElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addDiagramElementSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        // Inline helpers
        async function assertDiagramInWorkspace(diagramId: string) {
            const [d] = await db
                .select({
                    id: diagram.id,
                    workspaceId: diagram.workspaceId,
                    diagramType: diagram.diagramType,
                })
                .from(diagram)
                .where(and(eq(diagram.id, diagramId), isNull(diagram.deletedAt)));
            if (!d) throw new Error("Diagram not found");
            return d;
        }

        async function fetchElementType(elementId: string): Promise<{ type: ElementType; workspaceId: string }> {
            const [el] = await db
                .select({type: element.elementType, workspaceId: element.workspaceId})
                .from(element)
                .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
            if (!el) throw new Error("Element not found");
            return {type: el.type, workspaceId: el.workspaceId};
        }

        const d = await assertDiagramInWorkspace(data.diagramId);
        const el = await fetchElementType(data.elementId);

        const validation = validateElementForDiagram(
            d.diagramType,
            el.type,
        );
        if (!validation.valid) throw new Error(validation.message);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(diagramElement)
            .values({
                id,
                diagramId: data.diagramId,
                elementId: data.elementId,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
                zIndex: data.zIndex,
                styleJson: data.styleJson ?? null,
            })
            .onConflictDoNothing()
            .returning();

        return created ?? null;
    });

export const updateDiagramElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateDiagramElementSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(diagramElement)
            .set(updates)
            .where(eq(diagramElement.id, id))
            .returning();

        if (!updated) throw new Error("Diagram element not found");
        return updated;
    });

export const removeDiagramElement = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeDiagramElementSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [deleted] = await db
            .delete(diagramElement)
            .where(eq(diagramElement.id, data.id))
            .returning();

        if (!deleted) throw new Error("Diagram element not found");
        return {success: true};
    });

// ── Diagram Relationship CRUD ────────────────────────────────────────

export const addDiagramRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addDiagramRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(diagramRelationship)
            .values({
                id,
                diagramId: data.diagramId,
                relationshipId: data.relationshipId,
                pathType: data.pathType,
                lineStyle: data.lineStyle,
                sourceAnchor: data.sourceAnchor,
                targetAnchor: data.targetAnchor,
                labelPosition: data.labelPosition,
                controlPointsJson: data.controlPointsJson ?? null,
                styleJson: data.styleJson ?? null,
            })
            .onConflictDoNothing()
            .returning();

        return created ?? null;
    });

export const updateDiagramRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateDiagramRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(diagramRelationship)
            .set(updates)
            .where(eq(diagramRelationship.id, id))
            .returning();

        if (!updated) throw new Error("Diagram relationship not found");
        return updated;
    });

export const removeDiagramRelationship = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeDiagramRelationshipSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [deleted] = await db
            .delete(diagramRelationship)
            .where(eq(diagramRelationship.id, data.id))
            .returning();

        if (!deleted) throw new Error("Diagram relationship not found");
        return {success: true};
    });
