import {
    pgTable,
    pgEnum,
    text,
    timestamp,
    index,
} from "drizzle-orm/pg-core";
import {workspace} from "./workspaces";
import {element} from "./elements";
import {user} from "./auth-schema";

export const relationshipDirectionEnum = pgEnum("relationship_direction", [
    "outgoing",
    "incoming",
    "bidirectional",
    "none",
]);

export const relationship = pgTable(
    "relationship",
    {
        id: text("id").primaryKey(),
        workspaceId: text("workspace_id")
            .notNull()
            .references(() => workspace.id, {onDelete: "cascade"}),
        sourceElementId: text("source_element_id")
            .notNull()
            .references(() => element.id, {onDelete: "cascade"}),
        targetElementId: text("target_element_id")
            .notNull()
            .references(() => element.id, {onDelete: "cascade"}),
        direction: relationshipDirectionEnum("direction")
            .default("outgoing")
            .notNull(),
        description: text("description"),
        technology: text("technology"),
        sourceBlockInstallationId: text("source_block_installation_id"),
        createdBy: text("created_by").references(() => user.id, {
            onDelete: "set null",
        }),
        updatedBy: text("updated_by").references(() => user.id, {
            onDelete: "set null",
        }),
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("relationship_workspace_id_idx").on(table.workspaceId),
        index("relationship_source_element_id_idx").on(table.sourceElementId),
        index("relationship_target_element_id_idx").on(table.targetElementId),
    ],
);
