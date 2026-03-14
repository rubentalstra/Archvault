import {
    pgTable,
    pgEnum,
    text,
    varchar,
    boolean,
    timestamp,
    jsonb,
    index,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {workspace} from "./workspaces";
import {user} from "./auth-schema";

export const elementTypeEnum = pgEnum("element_type", [
    "actor",
    "group",
    "system",
    "app",
    "store",
    "component",
]);

export const elementStatusEnum = pgEnum("element_status", [
    "planned",
    "live",
    "deprecated",
]);

export const element = pgTable(
    "element",
    {
        id: text("id").primaryKey(),
        workspaceId: text("workspace_id")
            .notNull()
            .references(() => workspace.id, {onDelete: "cascade"}),
        parentElementId: text("parent_element_id").references(
            (): AnyPgColumn => element.id,
            {onDelete: "set null"},
        ),
        elementType: elementTypeEnum("element_type").notNull(),
        name: text("name").notNull(),
        displayDescription: varchar("display_description", {length: 120}),
        description: text("description"),
        status: elementStatusEnum("status").default("live").notNull(),
        external: boolean("external").default(false).notNull(),
        metadataJson: jsonb("metadata_json"),
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
        index("element_workspace_id_idx").on(table.workspaceId),
        index("element_parent_id_idx").on(table.parentElementId),
        index("element_workspace_type_idx").on(
            table.workspaceId,
            table.elementType,
        ),
    ],
);
