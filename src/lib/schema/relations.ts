import {defineRelations} from "drizzle-orm";

import {
    user,
    session,
    account,
    verification,
    organization,
    team,
    teamMember,
    member,
    invitation,
    twoFactor,
    ssoProvider,
    scimProvider,
} from "./auth-schema";
import {workspace} from "./workspaces";
import {element} from "./elements";
import {technology, elementTechnology} from "./element-technologies";
import {elementLink} from "./element-links";
import {relationship} from "./relationships";
import {tag, elementTag, relationshipTag} from "./tags";
import {diagram} from "./diagrams";
import {diagramElement} from "./diagram-elements";
import {diagramRelationship} from "./diagram-relationships";
import {diagramRevision} from "./diagram-revisions";

export const relations = defineRelations(
    {
        user,
        session,
        account,
        verification,
        organization,
        team,
        teamMember,
        member,
        invitation,
        twoFactor,
        ssoProvider,
        scimProvider,
        workspace,
        element,
        technology,
        elementTechnology,
        elementLink,
        relationship,
        tag,
        elementTag,
        relationshipTag,
        diagram,
        diagramElement,
        diagramRelationship,
        diagramRevision,
    },
    (r) => ({
        // ─────────────────────────────────────────────────────────────────
        // user
        // ─────────────────────────────────────────────────────────────────
        user: {
            sessions: r.many.session(),
            accounts: r.many.account(),
            teamMembers: r.many.teamMember(),
            members: r.many.member(),
            invitations: r.many.invitation(),
            twoFactors: r.many.twoFactor(),
            ssoProviders: r.many.ssoProvider(),
            // workspace.createdBy → user.id  (single FK, no alias needed)
            workspaces: r.many.workspace(),
            // element has TWO FKs to user (createdBy & updatedBy) → aliases required
            createdElements: r.many.element({
                from: r.user.id,
                to: r.element.createdBy,
                alias: "element_created_by",
            }),
            updatedElements: r.many.element({
                from: r.user.id,
                to: r.element.updatedBy,
                alias: "element_updated_by",
            }),
            // relationship has TWO FKs to user (createdBy & updatedBy) → aliases required
            createdRelationships: r.many.relationship({
                from: r.user.id,
                to: r.relationship.createdBy,
                alias: "relationship_created_by",
            }),
            updatedRelationships: r.many.relationship({
                from: r.user.id,
                to: r.relationship.updatedBy,
                alias: "relationship_updated_by",
            }),
            // diagram has TWO FKs to user (createdBy & updatedBy) → aliases required
            createdDiagrams: r.many.diagram({
                from: r.user.id,
                to: r.diagram.createdBy,
                alias: "diagram_created_by",
            }),
            updatedDiagrams: r.many.diagram({
                from: r.user.id,
                to: r.diagram.updatedBy,
                alias: "diagram_updated_by",
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // session
        // ─────────────────────────────────────────────────────────────────
        session: {
            user: r.one.user({
                from: r.session.userId,
                to: r.user.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // account
        // ─────────────────────────────────────────────────────────────────
        account: {
            user: r.one.user({
                from: r.account.userId,
                to: r.user.id,
                optional: false,
            }),
        },

        // verification has no foreign-key relations
        verification: {},

        // ─────────────────────────────────────────────────────────────────
        // organization
        // ─────────────────────────────────────────────────────────────────
        organization: {
            teams: r.many.team(),
            members: r.many.member(),
            invitations: r.many.invitation(),
            workspaces: r.many.workspace(),
            ssoProviders: r.many.ssoProvider(),
            scimProviders: r.many.scimProvider(),
        },

        // ─────────────────────────────────────────────────────────────────
        // team
        // ─────────────────────────────────────────────────────────────────
        team: {
            organization: r.one.organization({
                from: r.team.organizationId,
                to: r.organization.id,
                optional: false,
            }),
            teamMembers: r.many.teamMember(),
        },

        // ─────────────────────────────────────────────────────────────────
        // teamMember
        // ─────────────────────────────────────────────────────────────────
        teamMember: {
            team: r.one.team({
                from: r.teamMember.teamId,
                to: r.team.id,
                optional: false,
            }),
            user: r.one.user({
                from: r.teamMember.userId,
                to: r.user.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // member
        // ─────────────────────────────────────────────────────────────────
        member: {
            organization: r.one.organization({
                from: r.member.organizationId,
                to: r.organization.id,
                optional: false,
            }),
            user: r.one.user({
                from: r.member.userId,
                to: r.user.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // invitation
        // ─────────────────────────────────────────────────────────────────
        invitation: {
            organization: r.one.organization({
                from: r.invitation.organizationId,
                to: r.organization.id,
                optional: false,
            }),
            inviter: r.one.user({
                from: r.invitation.inviterId,
                to: r.user.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // twoFactor
        // ─────────────────────────────────────────────────────────────────
        twoFactor: {
            user: r.one.user({
                from: r.twoFactor.userId,
                to: r.user.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // ssoProvider
        // Note: organizationId is a plain text column (no DB FK constraint),
        // but we can still express the application-level relation.
        // ─────────────────────────────────────────────────────────────────
        ssoProvider: {
            user: r.one.user({
                from: r.ssoProvider.userId,
                to: r.user.id,
            }),
            organization: r.one.organization({
                from: r.ssoProvider.organizationId,
                to: r.organization.id,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // scimProvider
        // Note: both columns are plain text (no DB FK constraints).
        // ─────────────────────────────────────────────────────────────────
        scimProvider: {
            organization: r.one.organization({
                from: r.scimProvider.organizationId,
                to: r.organization.id,
            }),
            user: r.one.user({
                from: r.scimProvider.userId,
                to: r.user.id,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // workspace
        // ─────────────────────────────────────────────────────────────────
        workspace: {
            organization: r.one.organization({
                from: r.workspace.organizationId,
                to: r.organization.id,
                optional: false,
            }),
            createdByUser: r.one.user({
                from: r.workspace.createdBy,
                to: r.user.id,
            }),
            elements: r.many.element(),
            relationships: r.many.relationship(),
            tags: r.many.tag(),
            technologies: r.many.technology(),
            diagrams: r.many.diagram(),
        },

        // ─────────────────────────────────────────────────────────────────
        // element
        // ─────────────────────────────────────────────────────────────────
        element: {
            workspace: r.one.workspace({
                from: r.element.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            // Self-referential parent/children — alias required
            parent: r.one.element({
                from: r.element.parentElementId,
                to: r.element.id,
                alias: "element_parent",
            }),
            children: r.many.element({
                from: r.element.id,
                to: r.element.parentElementId,
                alias: "element_parent",
            }),
            // Two FKs to user → aliases required
            createdByUser: r.one.user({
                from: r.element.createdBy,
                to: r.user.id,
                alias: "element_created_by",
            }),
            updatedByUser: r.one.user({
                from: r.element.updatedBy,
                to: r.user.id,
                alias: "element_updated_by",
            }),
            technologies: r.many.technology({
                from: r.element.id.through(r.elementTechnology.elementId),
                to: r.technology.id.through(r.elementTechnology.technologyId),
            }),
            links: r.many.elementLink(),
            // Two FKs from relationship to element → aliases required
            sourceRelationships: r.many.relationship({
                from: r.element.id,
                to: r.relationship.sourceElementId,
                alias: "relationship_source",
            }),
            targetRelationships: r.many.relationship({
                from: r.element.id,
                to: r.relationship.targetElementId,
                alias: "relationship_target",
            }),
            // Many-to-many via elementTag junction table
            tags: r.many.tag({
                from: r.element.id.through(r.elementTag.elementId),
                to: r.tag.id.through(r.elementTag.tagId),
            }),
            // diagram_element junction
            diagramElements: r.many.diagramElement(),
            // diagrams scoped to this element
            scopedDiagrams: r.many.diagram({
                from: r.element.id,
                to: r.diagram.scopeElementId,
                alias: "diagram_scope",
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // elementTechnology
        // ─────────────────────────────────────────────────────────────────
        elementTechnology: {
            element: r.one.element({
                from: r.elementTechnology.elementId,
                to: r.element.id,
                optional: false,
            }),
            technology: r.one.technology({
                from: r.elementTechnology.technologyId,
                to: r.technology.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // technology
        // ─────────────────────────────────────────────────────────────────
        technology: {
            workspace: r.one.workspace({
                from: r.technology.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            elements: r.many.element({
                from: r.technology.id.through(r.elementTechnology.technologyId),
                to: r.element.id.through(r.elementTechnology.elementId),
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // elementLink
        // ─────────────────────────────────────────────────────────────────
        elementLink: {
            element: r.one.element({
                from: r.elementLink.elementId,
                to: r.element.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // relationship
        // ─────────────────────────────────────────────────────────────────
        relationship: {
            workspace: r.one.workspace({
                from: r.relationship.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            // Two FKs to element → aliases required
            sourceElement: r.one.element({
                from: r.relationship.sourceElementId,
                to: r.element.id,
                optional: false,
                alias: "relationship_source",
            }),
            targetElement: r.one.element({
                from: r.relationship.targetElementId,
                to: r.element.id,
                optional: false,
                alias: "relationship_target",
            }),
            // Two FKs to user → aliases required
            createdByUser: r.one.user({
                from: r.relationship.createdBy,
                to: r.user.id,
                alias: "relationship_created_by",
            }),
            updatedByUser: r.one.user({
                from: r.relationship.updatedBy,
                to: r.user.id,
                alias: "relationship_updated_by",
            }),
            // Many-to-many via relationshipTag junction table
            tags: r.many.tag({
                from: r.relationship.id.through(r.relationshipTag.relationshipId),
                to: r.tag.id.through(r.relationshipTag.tagId),
            }),
            // diagram_relationship junction
            diagramRelationships: r.many.diagramRelationship(),
        },

        // ─────────────────────────────────────────────────────────────────
        // tag
        // ─────────────────────────────────────────────────────────────────
        tag: {
            workspace: r.one.workspace({
                from: r.tag.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            // Many-to-many reverse sides
            elements: r.many.element({
                from: r.tag.id.through(r.elementTag.tagId),
                to: r.element.id.through(r.elementTag.elementId),
            }),
            relationships: r.many.relationship({
                from: r.tag.id.through(r.relationshipTag.tagId),
                to: r.relationship.id.through(r.relationshipTag.relationshipId),
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // diagram
        // ─────────────────────────────────────────────────────────────────
        diagram: {
            workspace: r.one.workspace({
                from: r.diagram.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            scopeElement: r.one.element({
                from: r.diagram.scopeElementId,
                to: r.element.id,
                alias: "diagram_scope",
            }),
            currentRevision: r.one.diagramRevision({
                from: r.diagram.currentRevisionId,
                to: r.diagramRevision.id,
            }),
            createdByUser: r.one.user({
                from: r.diagram.createdBy,
                to: r.user.id,
                alias: "diagram_created_by",
            }),
            updatedByUser: r.one.user({
                from: r.diagram.updatedBy,
                to: r.user.id,
                alias: "diagram_updated_by",
            }),
            diagramElements: r.many.diagramElement(),
            diagramRelationships: r.many.diagramRelationship(),
            revisions: r.many.diagramRevision(),
        },

        // ─────────────────────────────────────────────────────────────────
        // diagramElement
        // ─────────────────────────────────────────────────────────────────
        diagramElement: {
            diagram: r.one.diagram({
                from: r.diagramElement.diagramId,
                to: r.diagram.id,
                optional: false,
            }),
            element: r.one.element({
                from: r.diagramElement.elementId,
                to: r.element.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // diagramRelationship
        // ─────────────────────────────────────────────────────────────────
        diagramRelationship: {
            diagram: r.one.diagram({
                from: r.diagramRelationship.diagramId,
                to: r.diagram.id,
                optional: false,
            }),
            relationship: r.one.relationship({
                from: r.diagramRelationship.relationshipId,
                to: r.relationship.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // diagramRevision
        // ─────────────────────────────────────────────────────────────────
        diagramRevision: {
            diagram: r.one.diagram({
                from: r.diagramRevision.diagramId,
                to: r.diagram.id,
                optional: false,
            }),
            createdByUser: r.one.user({
                from: r.diagramRevision.createdBy,
                to: r.user.id,
            }),
        },
    }),
);

