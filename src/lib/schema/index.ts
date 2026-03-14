// Schema barrel — tables added by phase.
// Phase 1c: Better Auth tables (via @better-auth/cli generate)
export * from "./auth-schema";
// Phase 1f: workspaces
export * from "./workspaces";
// Phase 2a: elements, technologies, links
export * from "./elements";
export * from "./element-technologies";
export * from "./element-links";
export * from "./element-groups";
// Phase 2b: relationships
export * from "./relationships";
// Phase 2c: tags
export * from "./tags";
// Phase 3a: diagrams, diagram_elements, diagram_relationships, diagram_revisions
export * from "./diagram-revisions";
export * from "./diagrams";
export * from "./diagram-elements";
export * from "./diagram-relationships";
