import {createServerFn} from "@tanstack/react-start";
import {and, eq, isNull} from "drizzle-orm";
import {db} from "./database";
import {
    diagram,
    diagramElement,
    diagramConnection,
    element,
    technology,
    elementTechnology,
    connectionTechnology,
    connection,
} from "./schema";
import {
    createDiagramSchema,
    updateDiagramSchema,
    deleteDiagramSchema,
    getDiagramsSchema,
    getDiagramSchema,
    getDiagramDataSchema,
    getDiagramAncestrySchema,
    addDiagramElementSchema,
    updateDiagramElementSchema,
    removeDiagramElementSchema,
    addDiagramConnectionSchema,
    updateDiagramConnectionSchema,
    removeDiagramConnectionSchema,
    validateElementForDiagram,
    validateDisplayMode,
    validateChildPlacement,
} from "./diagram.validators";
import type {AncestrySegment} from "./diagram.validators";
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
                gridSize: diagram.gridSize,
                snapToGrid: diagram.snapToGrid,
                createdAt: diagram.createdAt,
                updatedAt: diagram.updatedAt,
                elementCount: sqlTag<number>`coalesce(${elementCountSubquery.count}, 0)`.as("element_count"),
            })
            .from(diagram)
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

        const connections = await db
            .select()
            .from(diagramConnection)
            .where(eq(diagramConnection.diagramId, data.id));

        return {...d, diagramElements: elements, diagramConnections: connections};
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
                displayMode: diagramElement.displayMode,
                elementName: element.name,
                elementType: element.elementType,
                displayDescription: element.displayDescription,
                status: element.status,
                external: element.external,
                parentElementId: element.parentElementId,
                iconTechnologyId: element.iconTechnologyId,
            })
            .from(diagramElement)
            .leftJoin(element, eq(diagramElement.elementId, element.id))
            .where(
                and(
                    eq(diagramElement.diagramId, data.id),
                    isNull(element.deletedAt),
                ),
            );

        const connections = await db
            .select({
                id: diagramConnection.id,
                diagramId: diagramConnection.diagramId,
                connectionId: diagramConnection.connectionId,
                pathType: diagramConnection.pathType,
                lineStyle: diagramConnection.lineStyle,
                sourceAnchor: diagramConnection.sourceAnchor,
                targetAnchor: diagramConnection.targetAnchor,
                labelPosition: diagramConnection.labelPosition,
                sourceElementId: connection.sourceElementId,
                targetElementId: connection.targetElementId,
                direction: connection.direction,
                description: connection.description,
                iconTechnologyId: connection.iconTechnologyId,
            })
            .from(diagramConnection)
            .leftJoin(
                connection,
                eq(diagramConnection.connectionId, connection.id),
            )
            .where(
                and(
                    eq(diagramConnection.diagramId, data.id),
                    isNull(connection.deletedAt),
                ),
            );

        const {inArray} = await import("drizzle-orm");

        // Fetch technologies for all elements on this diagram
        const elementIds = elements.map((e) => e.elementId);
        let elementTechMap = new Map<string, string[]>();
        if (elementIds.length > 0) {
            const techs = await db
                .select({
                    elementId: elementTechnology.elementId,
                    name: technology.name,
                    sortOrder: elementTechnology.sortOrder,
                })
                .from(elementTechnology)
                .innerJoin(technology, eq(elementTechnology.technologyId, technology.id))
                .where(inArray(elementTechnology.elementId, elementIds));

            elementTechMap = new Map<string, string[]>();
            for (const t of techs.sort((a, b) => a.sortOrder - b.sortOrder)) {
                const existing = elementTechMap.get(t.elementId) ?? [];
                existing.push(t.name);
                elementTechMap.set(t.elementId, existing);
            }
        }

        // Fetch icon technology slugs for elements
        const elementIconTechIds = [...new Set(elements.map((e) => e.iconTechnologyId).filter(Boolean))] as string[];
        const elementIconTechs = elementIconTechIds.length > 0
            ? await db.select({
                id: technology.id,
                iconSlug: technology.iconSlug
            }).from(technology).where(inArray(technology.id, elementIconTechIds))
            : [];
        const elementIconTechMap = new Map(elementIconTechs.map((t) => [t.id, t.iconSlug]));

        // Fetch technologies for all connections on this diagram
        const connectionIds = connections.map((c) => c.connectionId);
        let connTechMap = new Map<string, string[]>();
        if (connectionIds.length > 0) {
            const connTechs = await db
                .select({
                    connectionId: connectionTechnology.connectionId,
                    name: technology.name,
                    sortOrder: connectionTechnology.sortOrder,
                })
                .from(connectionTechnology)
                .innerJoin(technology, eq(connectionTechnology.technologyId, technology.id))
                .where(inArray(connectionTechnology.connectionId, connectionIds));

            connTechMap = new Map<string, string[]>();
            for (const t of connTechs.sort((a, b) => a.sortOrder - b.sortOrder)) {
                const existing = connTechMap.get(t.connectionId) ?? [];
                existing.push(t.name);
                connTechMap.set(t.connectionId, existing);
            }
        }

        // Fetch icon technology slugs for connections
        const connIconTechIds = [...new Set(connections.map((c) => c.iconTechnologyId).filter(Boolean))] as string[];
        const connIconTechs = connIconTechIds.length > 0
            ? await db.select({
                id: technology.id,
                iconSlug: technology.iconSlug
            }).from(technology).where(inArray(technology.id, connIconTechIds))
            : [];
        const connIconTechMap = new Map(connIconTechs.map((t) => [t.id, t.iconSlug]));

        const elementsWithTech = elements.map((e) => ({
            ...e,
            technologies: elementTechMap.get(e.elementId) ?? [],
            iconTechSlug: e.iconTechnologyId ? (elementIconTechMap.get(e.iconTechnologyId) ?? null) : null,
        }));

        const connectionsWithTech = connections.map((c) => ({
            ...c,
            technologies: connTechMap.get(c.connectionId) ?? [],
            iconTechSlug: c.iconTechnologyId ? (connIconTechMap.get(c.iconTechnologyId) ?? null) : null,
        }));

        // Fetch sub-flow element info for all diagrams in this workspace
        // (powers the zoom-in HoverCard navigation)
        const allDiagrams = await db
            .select({
                id: diagram.id,
                name: diagram.name,
                diagramType: diagram.diagramType,
            })
            .from(diagram)
            .where(
                and(
                    eq(diagram.workspaceId, d.workspaceId),
                    isNull(diagram.deletedAt),
                ),
            );

        const allSubFlowElements = await db
            .select({
                diagramId: diagramElement.diagramId,
                elementId: diagramElement.elementId,
            })
            .from(diagramElement)
            .where(eq(diagramElement.displayMode, "sub_flow"));

        // Build reverse map: elementId → diagrams where it's a sub-flow
        const elementToSubFlowDiagrams = new Map<string, { id: string; name: string; diagramType: string }[]>();
        const diagramLookup = new Map(allDiagrams.map((d) => [d.id, d]));
        for (const sf of allSubFlowElements) {
            const dia = diagramLookup.get(sf.diagramId);
            if (!dia) continue;
            const existing = elementToSubFlowDiagrams.get(sf.elementId) ?? [];
            existing.push({id: dia.id, name: dia.name, diagramType: dia.diagramType});
            elementToSubFlowDiagrams.set(sf.elementId, existing);
        }

        return {
            diagram: d,
            elements: elementsWithTech,
            connections: connectionsWithTech,
            subFlowDiagrams: Object.fromEntries(elementToSubFlowDiagrams),
        };
    });

export const getDiagramAncestry = createServerFn({method: "GET"})
    .inputValidator((input: unknown) => getDiagramAncestrySchema.parse(input))
    .handler(async ({data}): Promise<AncestrySegment[]> => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor", "viewer"]);

        const {inArray} = await import("drizzle-orm");

        // Pre-fetch all diagrams and sub-flow elements for this workspace
        const allDiagrams = await db
            .select({
                id: diagram.id,
                name: diagram.name,
                diagramType: diagram.diagramType,
            })
            .from(diagram)
            .where(and(eq(diagram.workspaceId, data.workspaceId), isNull(diagram.deletedAt)));

        const diagramLookup = new Map(allDiagrams.map((d) => [d.id, d]));

        const allDiagramElements = await db
            .select({
                diagramId: diagramElement.diagramId,
                elementId: diagramElement.elementId,
                displayMode: diagramElement.displayMode,
            })
            .from(diagramElement)
            .where(
                inArray(
                    diagramElement.diagramId,
                    allDiagrams.map((d) => d.id),
                ),
            );

        // Build map: diagram → its elements
        const diagramToElements = new Map<string, { elementId: string; displayMode: string }[]>();
        for (const de of allDiagramElements) {
            const existing = diagramToElements.get(de.diagramId) ?? [];
            existing.push({elementId: de.elementId, displayMode: de.displayMode});
            diagramToElements.set(de.diagramId, existing);
        }

        // Pre-fetch all elements in workspace for lookups
        const allElements = await db
            .select({
                id: element.id,
                name: element.name,
                elementType: element.elementType,
                parentElementId: element.parentElementId,
            })
            .from(element)
            .where(and(eq(element.workspaceId, data.workspaceId), isNull(element.deletedAt)));

        const elementLookup = new Map(allElements.map((e) => [e.id, e]));

        // Build reverse map: elementId → all diagrams where it appears (any mode)
        const elementToDiagrams = new Map<string, { diagramId: string; displayMode: string }[]>();
        for (const de of allDiagramElements) {
            const existing = elementToDiagrams.get(de.elementId) ?? [];
            existing.push({diagramId: de.diagramId, displayMode: de.displayMode});
            elementToDiagrams.set(de.elementId, existing);
        }

        // Walk upward from current diagram
        const ancestry: AncestrySegment[] = [];
        let currentDiagramId = data.diagramId;
        const visited = new Set<string>();

        for (let depth = 0; depth < 5; depth++) {
            if (visited.has(currentDiagramId)) break;
            visited.add(currentDiagramId);

            const currentElements = diagramToElements.get(currentDiagramId) ?? [];

            // Find the scope element: the sub_flow element on this diagram.
            // That element also lives on the parent diagram (as a normal element).
            let parentDiagramId: string | null = null;
            let linkElementId: string | null = null;

            const subFlowOnCurrent = currentElements.filter(
                (de) => de.displayMode === "sub_flow",
            );

            for (const sf of subFlowOnCurrent) {
                // Find another diagram where this element appears
                const appearances = elementToDiagrams.get(sf.elementId) ?? [];
                const otherDiagram = appearances.find(
                    (a) => a.diagramId !== currentDiagramId,
                );
                if (otherDiagram) {
                    parentDiagramId = otherDiagram.diagramId;
                    linkElementId = sf.elementId;
                    break;
                }
            }

            if (!parentDiagramId || !linkElementId) break;

            const parentDiagram = diagramLookup.get(parentDiagramId);
            const linkElement = elementLookup.get(linkElementId);
            if (!parentDiagram || !linkElement) break;

            // Siblings: elements on the parent diagram that also appear as
            // sub_flow on other diagrams (i.e. can be "drilled into")
            const parentDiagramElems = diagramToElements.get(parentDiagramId) ?? [];
            const siblings = parentDiagramElems
                .map((de) => {
                    const el = elementLookup.get(de.elementId);
                    if (!el) return null;

                    // Check if this element appears as sub_flow on another diagram
                    const appearances = elementToDiagrams.get(el.id) ?? [];
                    const subFlowAppearance = appearances.find(
                        (a) =>
                            a.diagramId !== parentDiagramId &&
                            a.displayMode === "sub_flow",
                    );
                    if (!subFlowAppearance) return null;

                    // The deeper diagram is where this element is sub_flow
                    const dInfo = diagramLookup.get(subFlowAppearance.diagramId);

                    return {
                        elementId: el.id,
                        elementName: el.name,
                        elementType: el.elementType,
                        deeperDiagramId: dInfo?.id ?? null,
                        deeperDiagramName: dInfo?.name ?? null,
                    };
                })
                .filter((s): s is NonNullable<typeof s> => s !== null);

            ancestry.unshift({
                diagramId: parentDiagramId,
                diagramName: parentDiagram.name,
                diagramType: parentDiagram.diagramType,
                linkElementId,
                linkElementName: linkElement.name,
                linkElementType: linkElement.elementType,
                siblings,
            });

            currentDiagramId = parentDiagramId;
        }

        return ancestry;
    });

export const createDiagram = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => createDiagramSchema.parse(input))
    .handler(async ({data}) => {
        const {session, memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(diagram)
            .values({
                id,
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description ?? null,
                diagramType: data.diagramType,
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

        const {id, ...updates} = data;

        const [existing] = await db
            .select()
            .from(diagram)
            .where(and(eq(diagram.id, id), isNull(diagram.deletedAt)));
        if (!existing) throw new Error("Diagram not found");

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

        async function fetchElementInfo(elementId: string): Promise<{
            type: ElementType;
            workspaceId: string;
            parentElementId: string | null
        }> {
            const [el] = await db
                .select({
                    type: element.elementType,
                    workspaceId: element.workspaceId,
                    parentElementId: element.parentElementId
                })
                .from(element)
                .where(and(eq(element.id, elementId), isNull(element.deletedAt)));
            if (!el) throw new Error("Element not found");
            return {type: el.type, workspaceId: el.workspaceId, parentElementId: el.parentElementId};
        }

        const d = await assertDiagramInWorkspace(data.diagramId);
        const el = await fetchElementInfo(data.elementId);
        const displayMode = (data.displayMode ?? "normal");

        // Validate element type for diagram
        const typeValidation = validateElementForDiagram(d.diagramType, el.type);
        if (!typeValidation.valid) throw new Error(typeValidation.message);

        // Validate display mode
        const modeValidation = validateDisplayMode(d.diagramType, el.type, displayMode);
        if (!modeValidation.valid) throw new Error(modeValidation.message);

        // Validate child placement (apps/stores need parent system as sub-flow, etc.)
        if (el.parentElementId) {
            const {inArray} = await import("drizzle-orm");
            const subFlowElements = await db
                .select({elementId: diagramElement.elementId})
                .from(diagramElement)
                .where(
                    and(
                        eq(diagramElement.diagramId, data.diagramId),
                        eq(diagramElement.displayMode, "sub_flow"),
                    ),
                );
            const subFlowIds = new Set(subFlowElements.map((e) => e.elementId));
            const childValidation = validateChildPlacement(d.diagramType, el.type, el.parentElementId, subFlowIds);
            if (!childValidation.valid) throw new Error(childValidation.message);
        }

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
                displayMode,
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

        // If changing display mode, validate it
        if (updates.displayMode) {
            const [de] = await db
                .select({
                    diagramId: diagramElement.diagramId,
                    elementId: diagramElement.elementId,
                })
                .from(diagramElement)
                .where(eq(diagramElement.id, id));
            if (!de) throw new Error("Diagram element not found");

            const [d] = await db
                .select({diagramType: diagram.diagramType})
                .from(diagram)
                .where(eq(diagram.id, de.diagramId));
            if (!d) throw new Error("Diagram not found");

            const [el] = await db
                .select({type: element.elementType})
                .from(element)
                .where(eq(element.id, de.elementId));
            if (!el) throw new Error("Element not found");

            const validation = validateDisplayMode(d.diagramType, el.type, updates.displayMode);
            if (!validation.valid) throw new Error(validation.message);
        }

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

// ── Diagram Connection CRUD ─────────────────────────────────────────

export const addDiagramConnection = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => addDiagramConnectionSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const id = crypto.randomUUID();
        const [created] = await db
            .insert(diagramConnection)
            .values({
                id,
                diagramId: data.diagramId,
                connectionId: data.connectionId,
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

export const updateDiagramConnection = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => updateDiagramConnectionSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const {id, ...updates} = data;
        const [updated] = await db
            .update(diagramConnection)
            .set(updates)
            .where(eq(diagramConnection.id, id))
            .returning();

        if (!updated) throw new Error("Diagram connection not found");
        return updated;
    });

export const removeDiagramConnection = createServerFn({method: "POST"})
    .inputValidator((input: unknown) => removeDiagramConnectionSchema.parse(input))
    .handler(async ({data}) => {
        const {memberRole} = await getSessionAndOrg();
        assertRole(memberRole, ["owner", "admin", "editor"]);

        const [deleted] = await db
            .delete(diagramConnection)
            .where(eq(diagramConnection.id, data.id))
            .returning();

        if (!deleted) throw new Error("Diagram connection not found");
        return {success: true};
    });
