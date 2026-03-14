import {
    pgTable,
    text,
    timestamp,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import {organization, user} from "./auth-schema";

export const workspace = pgTable(
    "workspace",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, {onDelete: "cascade"}),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        description: text("description"),
        status: text("status").default("active").notNull(),
        iconEmoji: text("icon_emoji"),
        settingsJson: text("settings_json"),
        createdBy: text("created_by").references(() => user.id, {
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
        index("workspace_org_id_idx").on(table.organizationId),
        uniqueIndex("workspace_org_slug_uidx").on(
            table.organizationId,
            table.slug,
        ),
        index("workspace_created_by_idx").on(table.createdBy),
    ],
);
