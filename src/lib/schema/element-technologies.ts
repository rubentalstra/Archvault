import { pgTable, text, integer, index } from "drizzle-orm/pg-core";
import { element } from "./elements";

export const elementTechnology = pgTable(
  "element_technology",
  {
    id: text("id").primaryKey(),
    elementId: text("element_id")
      .notNull()
      .references(() => element.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    iconSlug: text("icon_slug"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [index("element_tech_element_id_idx").on(table.elementId)],
);
