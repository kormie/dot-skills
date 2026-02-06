---
title: Workstreams
description: Organize parallel tracks of work with structured workstream management.
---

Workstreams are the primary mechanism for organizing related tickets into coherent units of work. A **workstream** is a logical grouping of tickets that share a cohesive goal -- for example, adding workstream UI support to the kanban board, or extracting a voice module into its own package.

## Why workstreams

Without workstreams, a flat backlog of tickets quickly becomes difficult to reason about. Workstreams solve this by providing:

- **Internal dependencies** -- tickets within a workstream typically depend on each other, and ordering is handled automatically by position in the list
- **Minimal external dependencies** -- cross-workstream dependencies are rare and explicit when they exist
- **Parallel execution** -- independent workstreams can be worked on simultaneously without conflict
- **Progress visibility** -- completing a workstream is a meaningful milestone, and progress is tracked as a completed/total count

## Creating a workstream

Each workstream is defined as a markdown file in `kanban/workstreams/`. The filename should be the workstream slug with a `.md` extension.

```
kanban/workstreams/<slug>.md
```

### File template

```markdown
---
slug: voice-extraction
status: active
priority: high
created: 2026-02-04
tickets:
  - refactor--extract-base-voice-step
  - feat--voice-modulator-api
  - test--voice-pipeline-integration
  - docs--document-voice-steps
depends-on-workstreams: []
tags: []
---

# Voice Extraction

## Goal

Extract the voice processing pipeline into a standalone module
with a clean public API and full test coverage.

## Scope

**Included:**
- Base voice step extraction and interface definition
- Modulator API design and implementation
- Integration test suite
- Developer documentation

**Excluded:**
- Runtime performance optimization (separate workstream)
- UI changes for voice configuration

## Success Criteria

- [ ] Voice module compiles independently
- [ ] All existing tests pass against the new module boundary
- [ ] Public API documented with usage examples

## Notes

Design doc: `docs/plans/voice-extraction-design.md`
```

### Frontmatter field reference

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `slug` | yes | string | Unique identifier, must match the filename (without `.md`) |
| `status` | yes | enum | `active`, `blocked`, or `completed` |
| `priority` | yes | enum | `high`, `medium`, or `low` |
| `created` | yes | date | Creation date in `YYYY-MM-DD` format |
| `tickets` | yes | list | Ordered list of ticket slugs belonging to this workstream |
| `depends-on-workstreams` | no | list | Slugs of other workstreams that must complete before this one can start |
| `tags` | no | list | Freeform tags for filtering and grouping |

:::note
The `status` field in the file is a hint. The server derives the actual status at runtime based on ticket completion state. If all tickets are in `ready-to-review/` or `done/`, the workstream is `completed` regardless of what the file says.
:::

## Ticket ordering

The order of slugs in the `tickets` list is significant. It defines the **recommended execution order** within the workstream. The first ticket in the list should be tackled first, the second ticket next, and so on.

This ordering also drives **implicit blocking**: a ticket is blocked if any earlier ticket in the same workstream's list has not been completed. You do not need to add explicit `depends-on` entries for tickets within the same workstream -- the position in the list handles it.

```yaml
tickets:
  - feat--workstreams-api-endpoint    # do first
  - feat--blocking-computation        # blocked until the above is done
  - feat--workstream-ribbon           # blocked until both above are done
```

:::tip
Order your tickets so that foundational work (API endpoints, data models, core logic) comes before tickets that build on top of it (UI components, integration points). This way the implicit ordering naturally reflects real dependencies.
:::

## Blocking and dependency rules

There are three ways a ticket can be blocked. The server evaluates all three when computing the `blockedBy` field for each ticket.

### 1. Implicit predecessor ordering

If a ticket belongs to a workstream, all earlier tickets in that workstream's `tickets` list must be in `ready-to-review/` or `done/` before it becomes unblocked.

### 2. Explicit ticket dependencies

A ticket's `depends-on` field lists specific ticket slugs that must complete first. This works both within and across workstreams.

```yaml
# In a ticket's frontmatter
depends-on:
  - feat--base-voice-step       # blocked until this ticket is done
  - infra--setup-test-harness   # blocked until this ticket is done
```

### 3. Cross-workstream dependencies

A ticket or workstream can declare a dependency on an entire workstream via `depends-on-workstreams`. The dependency is satisfied only when **all** tickets in the referenced workstream are complete.

```yaml
# In a workstream's frontmatter
depends-on-workstreams:
  - core-refactor    # this entire workstream must finish first
```

```yaml
# In a ticket's frontmatter
depends-on-workstreams:
  - guardrails       # all guardrails tickets must be done
```

:::note
A ticket belongs to **at most one workstream**. If work spans multiple concerns, split the ticket into separate tickets assigned to different workstreams, or use explicit `depends-on` to link them.
:::

## Progress tracking

Each workstream tracks progress as a completed/total count. A ticket counts as completed if it exists in `ready-to-review/` or `done/`.

The server computes workstream status at runtime:

| Derived status | Condition |
|---------------|-----------|
| `completed` | All tickets are in `ready-to-review/` or `done/` |
| `blocked` | Depends on an incomplete workstream, or all remaining tickets are blocked |
| `active` | Has at least one unblocked, incomplete ticket |

The `GET /api/workstreams` endpoint returns this computed progress for each workstream. See the [API reference](/dot-skills/guides/api-reference/) for the full response format.

## Workstream rules

1. **One workstream per ticket.** A ticket belongs to at most one workstream. If it logically fits in two places, split it.

2. **Ticket order matters.** The `tickets` list defines recommended execution order and drives implicit blocking.

3. **Keep workstreams focused.** 3-8 tickets is ideal. If a workstream grows larger, split it into smaller, more focused workstreams.

4. **Cross-workstream dependencies should be explicit.** Use `depends-on-workstreams` when an entire workstream must complete before another can begin.

5. **Status is derived.** The server computes the real status from ticket positions. The `status` field in the file is a starting hint.

## Workstreams in the web viewer

The [kanban board web viewer](/dot-skills/guides/kanban-board/) renders workstream information in several ways.

### Workstream ribbon

A horizontal ribbon below the header displays one chip per workstream. Each chip shows the workstream name, a mini progress bar, and a completed/total fraction.

```
┌─────────────────────────────────┐
│ workstream-ui ████░░░░ 3/9      │
└─────────────────────────────────┘
```

- Click a chip to filter the board to tickets in that workstream
- Click again to clear the filter
- Completed workstreams show a green checkmark
- Blocked workstreams show an orange warning icon

### Swimlane view

The third view option (**Board | Table | Workstreams**) organizes tickets into horizontal swimlanes grouped by workstream. Each lane contains four columns (Todo, In Progress, Ready to Review, Done) and shows the workstream's priority badge and progress bar in its header.

Lanes are sorted by priority (high first), then alphabetically.

### Card badges

In Board and Table views, ticket cards display:

- **Workstream badge** -- a link icon with the workstream name in muted text, shown below the title if the ticket belongs to a workstream
- **Blocking indicator** -- a red "Blocked" badge with a hover tooltip listing the specific blockers (ticket slugs or workstream slugs)

For more on ticket card rendering and the [ticket file format](/dot-skills/reference/ticket-format/), see the reference documentation.

## Real example

Here is the `workstream-ui` workstream that adds workstream support to the kanban board viewer:

```markdown
---
slug: workstream-ui
status: active
priority: high
created: 2026-02-04
tickets:
  - feat--workstreams-api-endpoint
  - feat--blocking-computation
  - feat--tickets-api-enhancements
  - feat--workstream-ribbon
  - feat--card-workstream-badge
  - feat--card-blocking-indicator
  - feat--swimlane-view
  - feat--new-ticket-form-workstream
  - feat--done-toggle
depends-on-workstreams: []
tags: [kanban, ui]
---

# Workstream UI

## Goal

Add full workstream support to the kanban board web viewer,
enabling progress tracking, blocking visibility, and a
dedicated swimlane view.

## Scope

**Included:**
- Top bar workstream ribbon with progress chips
- Swimlane view (third view option)
- Workstream badges and blocking indicators on cards
- Workstream field in new ticket form
- Done toggle to show/hide completed work
- API endpoints and enhancements

**Excluded:**
- Drag-and-drop ticket movement
- Workstream creation/editing via UI (markdown files only)
- Real-time updates (manual refresh)

## Success Criteria

- [ ] Workstream ribbon displays all workstreams with progress
- [ ] Clicking ribbon chip filters board to that workstream
- [ ] Swimlane view shows workstreams as horizontal lanes
- [ ] Blocked tickets show red badge with hover tooltip
- [ ] New tickets can be assigned to a workstream
- [ ] Done toggle shows/hides completed work across all views
```

This workstream contains 9 tickets ordered from backend API work through frontend UI components, ensuring each ticket builds on the work completed before it.
