CREATE TYPE "element_status" AS ENUM('planned', 'live', 'deprecated');--> statement-breakpoint
CREATE TYPE "element_type" AS ENUM('person', 'system', 'container', 'component');--> statement-breakpoint
CREATE TABLE "element_link" (
	"id" text PRIMARY KEY,
	"element_id" text NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element_technology" (
	"id" text PRIMARY KEY,
	"element_id" text NOT NULL,
	"name" text NOT NULL,
	"icon_slug" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "element" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"parent_element_id" text,
	"element_type" "element_type" NOT NULL,
	"name" text NOT NULL,
	"display_description" varchar(120),
	"description" text,
	"status" "element_status" DEFAULT 'live'::"element_status" NOT NULL,
	"external" boolean DEFAULT false NOT NULL,
	"metadata_json" jsonb,
	"source_block_installation_id" text,
	"created_by" text,
	"updated_by" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "element_link_element_id_idx" ON "element_link" ("element_id");--> statement-breakpoint
CREATE INDEX "element_tech_element_id_idx" ON "element_technology" ("element_id");--> statement-breakpoint
CREATE INDEX "element_workspace_id_idx" ON "element" ("workspace_id");--> statement-breakpoint
CREATE INDEX "element_parent_id_idx" ON "element" ("parent_element_id");--> statement-breakpoint
CREATE INDEX "element_workspace_type_idx" ON "element" ("workspace_id","element_type");--> statement-breakpoint
ALTER TABLE "element_link" ADD CONSTRAINT "element_link_element_id_element_id_fkey" FOREIGN KEY ("element_id") REFERENCES "element"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "element_technology" ADD CONSTRAINT "element_technology_element_id_element_id_fkey" FOREIGN KEY ("element_id") REFERENCES "element"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "element" ADD CONSTRAINT "element_workspace_id_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "element" ADD CONSTRAINT "element_parent_element_id_element_id_fkey" FOREIGN KEY ("parent_element_id") REFERENCES "element"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "element" ADD CONSTRAINT "element_created_by_user_id_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "element" ADD CONSTRAINT "element_updated_by_user_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;