# Kanban Board

Data store for the project kanban board. Tickets are markdown files with YAML
frontmatter that move between column directories as work progresses. Managed by
the `kanban-skill` plugin.

## Directory Structure

```
kanban/
├── workstreams/     # Workstream definitions (*.md)
├── todo/            # Tickets not yet started
├── in-progress/     # Tickets being worked on
├── ready-to-review/ # Complete, awaiting review
├── done/            # Reviewed and completed
└── reviews/         # Review guides for completed tickets
```

## Ticket Format

Each ticket is a markdown file named `<type>--<kebab-slug>.md`. Structured
metadata lives in YAML frontmatter; the body is prose and acceptance criteria.

```markdown
---
type: feature
priority: high
created: 2026-01-15
workstream: my-workstream
depends-on: [feat--other-ticket]
---
# Ticket Title

## Description
...
```

Type prefixes: `feat`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike`.

## Workstream Format

Workstreams group related tickets. Defined in `kanban/workstreams/<slug>.md`:

```markdown
---
slug: workstream-ui
status: active
priority: high
created: 2026-02-04
tickets:
  - feat--workstreams-api-endpoint
  - feat--card-workstream-badge
depends-on-workstreams: []
tags: [kanban, ui]
---
# Workstream UI

## Goal
<what this workstream achieves when complete>
```

Ticket order in the `tickets` list is the recommended execution order.

## Quick Commands

- `/kanban-serve` -- start web viewer at localhost:3333
- `/ticket-picker` -- select next ticket to work on

## Blocking Rules

1. **Ticket dependency** -- a ticket is blocked when any slug in its
   `depends-on` list is not yet in `ready-to-review/` or `done/`.

2. **Workstream dependency** -- a ticket is blocked when any workstream in its
   `depends-on-workstreams` list still has incomplete tickets.

3. **Workstream order** -- a ticket is blocked when an earlier ticket in the
   same workstream's `tickets` list is not yet in `ready-to-review/` or `done/`.

See `plugins/kanban-skill/skills/kanban-tracker/SKILL.md` for full conventions.
