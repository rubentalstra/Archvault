import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { element } from "./elements";

// Group assignment table: any non-group element can belong to one or many groups.
export const elementGroup = pgTable(
  "element_group",
  {
    elementId: text("element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    groupElementId: text("group_element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.elementId, table.groupElementId] }),
    index("element_group_group_idx").on(table.groupElementId),
  ],
);

