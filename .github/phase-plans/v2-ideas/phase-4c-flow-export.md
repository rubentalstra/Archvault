# Phase 4c — Flow Export

## Status: Not Started

## Goal

Export flows to text, PlantUML, and Mermaid sequence diagram formats. This makes flows portable
and integrable with documentation systems, wikis, and other tools.

## Prerequisites

- Phase 4b (Flow Steps & Playback) — complete

## Tasks

### Text Export

- [ ] Generate chronological text listing of flow steps:
  ```
  Flow: User Login
  1. [Actor] User → [App] Auth Service: POST /login (REST/HTTPS)
  2. [App] Auth Service: Validate credentials
  3. [App] Auth Service → [Store] User DB: SELECT user (JDBC)
  4. [App] Auth Service → [Actor] User: Return JWT token (REST/HTTPS)
  ```
- [ ] Include object types, names, connection descriptions, and technologies
- [ ] Handle alternate/parallel paths with indentation:
  ```
  5. ALTERNATE:
     Path A - Email Login:
       5a. [Actor] User → [App] Auth: Submit email + password
     Path B - SSO Login:
       5b. [Actor] User → [App] Auth: Redirect to IdP
  ```
- [ ] Copy to clipboard button

### PlantUML Export

- [ ] Convert flow to PlantUML sequence diagram syntax:
  ```plantuml
  @startuml
  actor User
  participant "Auth Service" as auth
  database "User DB" as db

  User -> auth: POST /login
  activate auth
  auth -> db: SELECT user
  db --> auth: user record
  auth --> User: JWT token
  deactivate auth
  @enduml
  ```
- [ ] Map element types to PlantUML participants:
  - Actor → `actor`
  - System → `participant` (boxed)
  - App → `participant`
  - Store → `database`
  - Component → `participant`
- [ ] Handle alternate paths with `alt` / `else` blocks
- [ ] Handle parallel paths with `par` blocks
- [ ] Include activation/deactivation for process steps
- [ ] Copy to clipboard + download as `.puml` file

### Mermaid Export

- [ ] Convert flow to Mermaid sequence diagram syntax:
  ```mermaid
  sequenceDiagram
    actor User
    participant Auth Service
    participant User DB

    User->>Auth Service: POST /login
    activate Auth Service
    Auth Service->>User DB: SELECT user
    User DB-->>Auth Service: user record
    Auth Service-->>User: JWT token
    deactivate Auth Service
  ```
- [ ] Map element types to Mermaid participants (actor, participant)
- [ ] Handle alternate paths with `alt` / `else`
- [ ] Handle parallel paths with `par` / `and`
- [ ] Include notes for information steps
- [ ] Copy to clipboard + download as `.mmd` file

### Export UI

- [ ] Export button in flow playback toolbar (dropdown with format options)
- [ ] Export dialog with:
  - Format selector (Text, PlantUML, Mermaid)
  - Preview panel showing the generated output
  - Copy to clipboard button
  - Download button
- [ ] Export from flows section page (table row action)

### i18n

- [ ] Add export-related keys to messages files

## Key Files

- `src/lib/flow-export/text-exporter.ts` — text format generator
- `src/lib/flow-export/plantuml-exporter.ts` — PlantUML format generator
- `src/lib/flow-export/mermaid-exporter.ts` — Mermaid format generator
- `src/components/flows/flow-export-dialog.tsx` — export dialog with preview

## Design Notes

- **Export is client-side.** The exporters run in the browser using the flow data already loaded.
  No server function needed — just transform the data structure to text.
- **Participant deduplication:** Each element appears once as a participant, even if involved in
  multiple steps. Order participants by first appearance in the flow.
- **Direction mapping:** `outgoing` = solid arrow (`->`), responses shown via `direction_override`
  use dashed arrow (`-->`). `bidirectional` uses double arrow.

## Verification

- [ ] Text export generates readable step listing
- [ ] PlantUML export generates valid PlantUML syntax
- [ ] Mermaid export generates valid Mermaid syntax
- [ ] Alternate/parallel paths render correctly in all formats
- [ ] Copy to clipboard works
- [ ] Download generates correct file
- [ ] Export dialog preview shows formatted output
- [ ] `pnpm dev` and `pnpm build` succeed
