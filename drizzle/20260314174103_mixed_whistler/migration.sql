CREATE TABLE "technology" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website" text,
	"icon_slug" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_group" (
	"element_id" text,
	"group_element_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "element_group_pkey" PRIMARY KEY("element_id","group_element_id")
);
--> statement-breakpoint
DROP INDEX "element_tech_element_id_idx";--> statement-breakpoint
ALTER TABLE "element_technology" ADD COLUMN "technology_id" text;--> statement-breakpoint
ALTER TABLE "element" ALTER COLUMN "element_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "element_type";--> statement-breakpoint
CREATE TYPE "element_type" AS ENUM('actor', 'group', 'system', 'app', 'store', 'component');--> statement-breakpoint
ALTER TABLE "element" ALTER COLUMN "element_type" SET DATA TYPE "element_type" USING "element_type"::"element_type";--> statement-breakpoint
ALTER TABLE "element_technology" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "element_technology" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "element_technology" DROP COLUMN "icon_slug";--> statement-breakpoint
ALTER TABLE "element_technology" ADD PRIMARY KEY ("element_id","technology_id");--> statement-breakpoint
CREATE INDEX "element_technology_technology_id_idx" ON "element_technology" ("technology_id");--> statement-breakpoint
CREATE INDEX "technology_workspace_id_idx" ON "technology" ("workspace_id");--> statement-breakpoint
CREATE INDEX "element_group_group_idx" ON "element_group" ("group_element_id");--> statement-breakpoint
ALTER TABLE "element_technology" ADD CONSTRAINT "element_technology_technology_id_technology_id_fkey" FOREIGN KEY ("technology_id") REFERENCES "technology"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "technology" ADD CONSTRAINT "technology_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "element_group" ADD CONSTRAINT "element_group_element_id_element_id_fkey" FOREIGN KEY ("element_id") REFERENCES "element"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "element_group" ADD CONSTRAINT "element_group_group_element_id_element_id_fkey" FOREIGN KEY ("group_element_id") REFERENCES "element"("id") ON DELETE CASCADE;