# Phase 8b — Official Blocks Library

## Status: Not Started

## Goal

Create a curated set of official blocks that ship with Archvault, covering common architecture
patterns. These serve as both starting templates and learning examples for the block system.

## Prerequisites

- Phase 8a (Block Schemas & Validation) — complete

## Tasks

### Official Block Manifests

- [ ] **Microservice (Basic):** System → API App + Database Store + Message Queue App
- [ ] **API Gateway Pattern:** Gateway App → multiple Service Apps behind it
- [ ] **Event-Driven Pipeline:** Producer App → Message Broker App → Consumer Apps → Store
- [ ] **Monolith with Database:** Single App + Database Store + Cache Store
- [ ] **BFF Pattern:** Mobile BFF App + Web BFF App → Backend API Apps
- [ ] **CQRS Pattern:** Command Service App + Query Service App + Event Store + Read Store
- [ ] **Three-Tier Architecture:** Actor → Web App → API App → Database Store
- [ ] **Serverless Functions:** API Gateway → Lambda/Function Apps → Database Store
- [ ] **CI/CD Pipeline:** Code Repository → Build System → Artifact Store → Deploy Target

### Block Content Quality

- [ ] Each block includes:
  - Descriptive name and slug
  - Readme with architecture explanation and when to use it
  - At least one diagram with sensible layout
  - Meaningful connection descriptions and technologies
  - Variables for customization (service names, technologies)
  - Appropriate tags for discovery
- [ ] All blocks validated against the manifest schema
- [ ] Blocks are seeded into the database on first run

### i18n

- [ ] Block names and descriptions in en/nl

## Key Files

- `src/lib/blocks/official/` — official block manifest JSON files
- `src/lib/blocks/seed-blocks.ts` — database seeding script

## Verification

- [ ] All official blocks validate against the schema
- [ ] Each block installs correctly into a workspace
- [ ] Diagrams render with correct layout after installation
- [ ] Variables work for customization
- [ ] Blocks are seeded on fresh database setup
