import {
  pgTable,
  text,
  varchar,
  real,
  integer,
  jsonb,
  timestamp,
  index,
  primaryKey,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { workspace } from "./workspaces";
import { element } from "./elements";
import { diagram } from "./diagrams";
import { user } from "./auth-schema";

export const group = pgTable(
  "group",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    parentGroupId: text("parent_group_id").references(
      (): AnyPgColumn => group.id,
      { onDelete: "set null" },
    ),
    description: text("description"),
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
    index("group_workspace_id_idx").on(table.workspaceId),
    index("group_parent_group_id_idx").on(table.parentGroupId),
  ],
);

export const groupMembership = pgTable(
  "group_membership",
  {
    elementId: text("element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.elementId, table.groupId] }),
    index("group_membership_group_id_idx").on(table.groupId),
  ],
);

export const diagramGroup = pgTable(
  "diagram_group",
  {
    id: text("id").primaryKey(),
    diagramId: text("diagram_id")
      .notNull()
      .references(() => diagram.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    x: real("x").notNull(),
    y: real("y").notNull(),
    width: real("width").notNull(),
    height: real("height").notNull(),
    zIndex: integer("z_index").default(-1).notNull(),
    styleJson: jsonb("style_json"),
  },
  (table) => [
    unique("diagram_group_diagram_group_uidx").on(
      table.diagramId,
      table.groupId,
    ),
    index("diagram_group_diagram_id_idx").on(table.diagramId),
    index("diagram_group_group_id_idx").on(table.groupId),
  ],
);
