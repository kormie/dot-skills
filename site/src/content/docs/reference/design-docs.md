---
title: Design Docs
description: Architectural design documents and decision records for dot-skills.
---

Design docs are architectural decision records and implementation plans stored in the `docs/plans/` directory. They capture the **why** behind major changes and serve as lasting reference for future work.

Rather than relying on commit messages or PR descriptions to reconstruct the reasoning behind a feature, design docs provide a single place where goals, trade-offs, and implementation strategy are recorded before code is written.

## Existing Design Documents

The project currently has three design documents, each corresponding to a major phase of the kanban skill's development.

### Kanban Implementation Plan

**File:** `docs/plans/2026-02-02-kanban-implementation.md`

The initial implementation plan for the kanban board plugin. Covers the full task breakdown for building the plugin from scratch, including:

- Plugin scaffold and manifest (`plugin.json`)
- Porting skills from a previous project
- Bun server entry point and API routes
- Git commit helper module
- HTML UI with board and table views
- Slash command and SessionEnd hook

This document served as the step-by-step execution plan for the first working version of the kanban skill.

### Web Viewer Design

**File:** `docs/plans/2026-02-02-kanban-web-viewer-design.md`

The architectural design for the Bun-powered web viewer. Defines the system's core components:

- **Architecture diagram** showing browser, HTTP server, and file system layers
- **API design** with REST endpoints for ticket CRUD operations
- **UI views:** Board (three-column kanban) and Table (sortable rows)
- **Editor modal** with split-pane markdown editing and live preview
- **Git integration** strategy for automatic commits on every save
- **Explicit YAGNI list** of features intentionally excluded (drag-and-drop, auth, search)

### Workstream UI Design

**File:** `docs/plans/2026-02-04-kanban-workstream-ui-design.md`

Design for the workstream UI additions that extended the board with progress tracking and blocking visibility:

- **Workstream ribbon** with progress chips showing completion fractions
- **Swimlane view** grouping tickets by workstream with four status columns
- **Blocking indicators** on cards with hover tooltips listing blockers
- **Workstream badges** on ticket cards linking to their parent workstream
- **Done toggle** for showing/hiding completed work across all views
- **API changes** including the new `/api/workstreams` endpoint

## Naming Convention

Design doc files follow the pattern:

```
YYYY-MM-DD-<descriptive-name>.md
```

All files live in `docs/plans/`. The date prefix reflects when the document was created and provides natural chronological ordering when listing the directory. The descriptive name should be kebab-case and concise.

**Examples:**
- `2026-02-02-kanban-implementation.md`
- `2026-02-02-kanban-web-viewer-design.md`
- `2026-02-04-kanban-workstream-ui-design.md`

## Relationship to Spike Tickets

Spike tickets (type: `spike`) are time-boxed research and investigation work items. Their **primary deliverable is a design doc**.

The spike workflow follows this progression:

1. **Research** -- Investigate the problem space, evaluate options, build throwaway prototypes if needed
2. **Design doc** -- Write up findings, trade-offs, and a recommendation in `docs/plans/`
3. **Follow-up tickets** -- Create concrete implementation tickets in `kanban/todo/` derived from the recommendation

:::note
Spikes explicitly do **not** produce production code. Any code written during a spike is throwaway proof-of-concept material. The design doc and follow-up tickets are what carry the work forward.
:::

For more on spike tickets and the full set of ticket types, see the [Ticket Format reference](/dot-skills/reference/ticket-format/).

## How Design Docs Are Used

Design docs serve several roles throughout the development lifecycle:

- **Inform ticket creation** -- A design doc's implementation plan translates directly into kanban tickets, often organized as a [workstream](/dot-skills/guides/workstreams/)
- **Provide implementation context** -- When picking up a ticket, the referenced design doc explains the broader goal and architectural decisions
- **Record trade-offs** -- Decisions about what was excluded (and why) prevent relitigating settled questions
- **Enable onboarding** -- New contributors can read design docs to understand how the system evolved and the reasoning behind its current shape

Design docs are **living documents**. As implementation reveals new considerations or requirements change, the doc should be updated to reflect the current understanding. The git history preserves the original version.

:::note
[Workstream definitions](/dot-skills/guides/workstreams/) often reference design docs in their Goal or Notes sections to link the implementation plan back to the architectural rationale.
:::

## Writing a Design Doc

There is no rigid template, but effective design docs tend to include these sections:

### Suggested Structure

1. **Overview** -- What problem is being solved and why. One to three paragraphs.
2. **Requirements** -- What the solution must do. Bulleted list of concrete capabilities.
3. **Design** -- The proposed approach. Include architecture diagrams where they clarify the system's structure. Describe API contracts, data flow, and component responsibilities.
4. **Implementation Plan** -- Ordered list of tasks or phases. Each task should identify which files are created or modified.
5. **File Changes Table** -- Summary of all files affected, with a brief description of changes per file.

Optional but useful:
- **Out of Scope** -- Explicitly list what this design does *not* cover. Prevents scope creep and documents intentional omissions.
- **Alternatives Considered** -- Other approaches that were evaluated and why they were rejected.

### Example File Changes Table

```markdown
| File | Changes |
|------|---------|
| `server/api.ts` | Add `/api/workstreams`, enhance ticket response |
| `server/static/index.html` | Ribbon, swimlane view, card updates |
```

:::note
Keep design docs focused. A design doc for a single feature or workstream is more useful than a monolithic document covering an entire release. If the scope grows beyond what fits comfortably in one document, split it.
:::
