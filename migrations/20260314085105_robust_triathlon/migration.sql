CREATE TABLE "scim_provider" (
	"id" text PRIMARY KEY,
	"provider_id" text NOT NULL CONSTRAINT "scimProvider_providerId_unique" UNIQUE,
	"scim_token" text NOT NULL CONSTRAINT "scimProvider_scimToken_unique" UNIQUE,
	"organization_id" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "sso_provider" (
	"id" text PRIMARY KEY,
	"issuer" text NOT NULL,
	"oidc_config" text,
	"saml_config" text,
	"user_id" text,
	"provider_id" text NOT NULL CONSTRAINT "ssoProvider_providerId_unique" UNIQUE,
	"organization_id" text,
	"domain" text NOT NULL,
	"domain_verified" boolean
);
--> statement-breakpoint
ALTER TABLE "sso_provider" ADD CONSTRAINT "sso_provider_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;