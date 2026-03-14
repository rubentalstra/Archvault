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
import {connection} from "./connections";
import {tag, elementTag, connectionTag} from "./tags";
import {group, groupMembership, diagramGroup} from "./groups";
import {diagram} from "./diagrams";
import {diagramElement} from "./diagram-elements";
import {diagramConnection} from "./diagram-connections";
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
        connection,
        tag,
        elementTag,
        connectionTag,
        group,
        groupMembership,
        diagramGroup,
        diagram,
        diagramElement,
        diagramConnection,
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
            // connection has TWO FKs to user (createdBy & updatedBy) → aliases required
            createdConnections: r.many.connection({
                from: r.user.id,
                to: r.connection.createdBy,
                alias: "connection_created_by",
            }),
            updatedConnections: r.many.connection({
                from: r.user.id,
                to: r.connection.updatedBy,
                alias: "connection_updated_by",
            }),
            // group has TWO FKs to user (createdBy & updatedBy) → aliases required
            createdGroups: r.many.group({
                from: r.user.id,
                to: r.group.createdBy,
                alias: "group_created_by",
            }),
            updatedGroups: r.many.group({
                from: r.user.id,
                to: r.group.updatedBy,
                alias: "group_updated_by",
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
            connections: r.many.connection(),
            tags: r.many.tag(),
            groups: r.many.group(),
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
            // Two FKs from connection to element → aliases required
            sourceConnections: r.many.connection({
                from: r.element.id,
                to: r.connection.sourceElementId,
                alias: "connection_source",
            }),
            targetConnections: r.many.connection({
                from: r.element.id,
                to: r.connection.targetElementId,
                alias: "connection_target",
            }),
            // Many-to-many via elementTag junction table
            tags: r.many.tag({
                from: r.element.id.through(r.elementTag.elementId),
                to: r.tag.id.through(r.elementTag.tagId),
            }),
            // Many-to-many via groupMembership junction table
            groups: r.many.group({
                from: r.element.id.through(r.groupMembership.elementId),
                to: r.group.id.through(r.groupMembership.groupId),
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
        // connection
        // ─────────────────────────────────────────────────────────────────
        connection: {
            workspace: r.one.workspace({
                from: r.connection.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            // Two FKs to element → aliases required
            sourceElement: r.one.element({
                from: r.connection.sourceElementId,
                to: r.element.id,
                optional: false,
                alias: "connection_source",
            }),
            targetElement: r.one.element({
                from: r.connection.targetElementId,
                to: r.element.id,
                optional: false,
                alias: "connection_target",
            }),
            // Two FKs to user → aliases required
            createdByUser: r.one.user({
                from: r.connection.createdBy,
                to: r.user.id,
                alias: "connection_created_by",
            }),
            updatedByUser: r.one.user({
                from: r.connection.updatedBy,
                to: r.user.id,
                alias: "connection_updated_by",
            }),
            // Many-to-many via connectionTag junction table
            tags: r.many.tag({
                from: r.connection.id.through(r.connectionTag.connectionId),
                to: r.tag.id.through(r.connectionTag.tagId),
            }),
            // diagram_connection junction
            diagramConnections: r.many.diagramConnection(),
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
            connections: r.many.connection({
                from: r.tag.id.through(r.connectionTag.tagId),
                to: r.connection.id.through(r.connectionTag.connectionId),
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
            diagramConnections: r.many.diagramConnection(),
            diagramGroups: r.many.diagramGroup(),
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
        // diagramConnection
        // ─────────────────────────────────────────────────────────────────
        diagramConnection: {
            diagram: r.one.diagram({
                from: r.diagramConnection.diagramId,
                to: r.diagram.id,
                optional: false,
            }),
            connection: r.one.connection({
                from: r.diagramConnection.connectionId,
                to: r.connection.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // group
        // ─────────────────────────────────────────────────────────────────
        group: {
            workspace: r.one.workspace({
                from: r.group.workspaceId,
                to: r.workspace.id,
                optional: false,
            }),
            // Self-referential parent/children — alias required
            parent: r.one.group({
                from: r.group.parentGroupId,
                to: r.group.id,
                alias: "group_parent",
            }),
            children: r.many.group({
                from: r.group.id,
                to: r.group.parentGroupId,
                alias: "group_parent",
            }),
            // Two FKs to user → aliases required
            createdByUser: r.one.user({
                from: r.group.createdBy,
                to: r.user.id,
                alias: "group_created_by",
            }),
            updatedByUser: r.one.user({
                from: r.group.updatedBy,
                to: r.user.id,
                alias: "group_updated_by",
            }),
            // Many-to-many reverse side
            elements: r.many.element({
                from: r.group.id.through(r.groupMembership.groupId),
                to: r.element.id.through(r.groupMembership.elementId),
            }),
            // diagram_group junction
            diagramGroups: r.many.diagramGroup(),
        },

        // ─────────────────────────────────────────────────────────────────
        // groupMembership
        // ─────────────────────────────────────────────────────────────────
        groupMembership: {
            element: r.one.element({
                from: r.groupMembership.elementId,
                to: r.element.id,
                optional: false,
            }),
            group: r.one.group({
                from: r.groupMembership.groupId,
                to: r.group.id,
                optional: false,
            }),
        },

        // ─────────────────────────────────────────────────────────────────
        // diagramGroup
        // ─────────────────────────────────────────────────────────────────
        diagramGroup: {
            diagram: r.one.diagram({
                from: r.diagramGroup.diagramId,
                to: r.diagram.id,
                optional: false,
            }),
            group: r.one.group({
                from: r.diagramGroup.groupId,
                to: r.group.id,
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
