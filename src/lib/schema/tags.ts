import {
  pgTable,
  text,
  varchar,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { workspace } from "./workspaces";
import { element } from "./elements";
import { relationship } from "./relationships";

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: varchar("color", { length: 7 }).notNull(),
    icon: text("icon"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("tag_workspace_id_idx").on(table.workspaceId)],
);

export const elementTag = pgTable(
  "element_tag",
  {
    elementId: text("element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.elementId, table.tagId] }),
    index("element_tag_tag_id_idx").on(table.tagId),
  ],
);

export const relationshipTag = pgTable(
  "relationship_tag",
  {
    relationshipId: text("relationship_id")
      .notNull()
      .references(() => relationship.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.relationshipId, table.tagId] }),
    index("relationship_tag_tag_id_idx").on(table.tagId),
  ],
);
