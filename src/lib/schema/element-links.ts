import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { element } from "./elements";

export const elementLink = pgTable(
  "element_link",
  {
    id: text("id").primaryKey(),
    elementId: text("element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    label: text("label"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("element_link_element_id_idx").on(table.elementId)],
);
