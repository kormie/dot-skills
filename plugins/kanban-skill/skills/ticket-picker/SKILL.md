---
name: ticket-picker
description: Select the next kanban ticket to work on, with optional type/tag filtering
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Ticket Picker

Select and begin work on the next kanban ticket. **Only activated when the user explicitly asks to start work on a ticket.** Triggered by phrases like:

- "pick up the next ticket"
- "pick up the next testing ticket"
- "pick up the next feature ticket"
- "start the next high priority ticket"
- "work on the next property-testing ticket"

**Never** auto-pick or auto-start a ticket. Creating a ticket does not mean starting it. Always wait for the user to explicitly ask before beginning work on any ticket.

## Selection Algorithm

### 1. Read all tickets in `kanban/todo/`

Glob `kanban/todo/*.md` and parse each file's YAML frontmatter for `type`, `priority`, `depends-on`, and `tags`.

### 2. Filter by user intent

Map the user's words to ticket filters:

| User says | Filter |
|-----------|--------|
| "next ticket" (no qualifier) | No filter — all types |
| "next feature ticket" / "feat" | `type: feature` |
| "next test ticket" / "testing ticket" / "unit testing ticket" | `type: test` |
| "next bug ticket" / "bug fix" | `type: bug` |
| "next refactor ticket" | `type: refactor` |
| "next infra ticket" / "infrastructure" / "tooling" | `type: infra` |
| "next docs ticket" / "documentation" | `type: docs` |
| "next spike" / "research ticket" | `type: spike` |
| "next property-testing ticket" | `tags` contains `property-testing` |
| "next high priority ticket" | `priority: high` |

When the user specifies multiple qualifiers (e.g. "next high priority testing ticket"), apply all filters together.

If no tickets match the filter, tell the user what's available instead of silently picking something else.

### 3. Exclude blocked tickets

A ticket is **blocked** if any slug in its `depends-on` list does NOT have a matching file in either `kanban/ready-to-review/` or outside `kanban/todo/` (i.e., the dependency hasn't been completed yet).

To check: for each slug in `depends-on`, look for `kanban/ready-to-review/<slug>.md`. If that file doesn't exist, check `kanban/in-progress/<slug>.md` — if the dependency is still in-progress or todo, the ticket is blocked.

### 4. Sort remaining tickets

1. **Priority**: `high` > `medium` > `low`
2. **Creation date**: older tickets first (FIFO within same priority)

### 5. Pick the first ticket

Select the top ticket from the sorted list.

### 6. Begin work

1. Move the ticket file from `kanban/todo/` to `kanban/in-progress/`
2. Read the full ticket content (Description, Acceptance Criteria, Notes)
3. Update the `branch` field in frontmatter if creating a new branch
4. Announce what you're working on to the user
5. Begin working on the acceptance criteria — **following TDD workflow based on ticket type** (see below)

**TDD workflow by ticket type:**

- **`feature` tickets** — Start by writing failing tests (unit and/or property tests) that encode the acceptance criteria. Do not write implementation code until tests exist and fail. Follow Red → Green → Refactor.
- **`bug` tickets** — Start by writing a test that reproduces the defect. The test must fail against current code. Then implement the fix. The test passing is the fitness function.
- **`test` tickets** — Write tests against existing behavior. Note any discovered bugs as new `bug` tickets.
- **`spike` tickets** — Follow the spike workflow defined in the kanban-tracker skill. Spikes produce design notes and follow-up tickets — not production implementation. Do not refactor existing production code during a spike.
- **Other types** (`refactor`, `infra`, `docs`) — Ensure existing tests pass before and after changes. Write new tests if the change introduces testable behavior.

## Edge Cases

- **No tickets in todo/**: Tell the user the backlog is empty
- **All tickets blocked**: Tell the user which tickets exist and what they're blocked on
- **User specifies a ticket by name**: Skip the algorithm, pick that ticket directly
- **Multiple tickets tied**: Pick the oldest one (by `created` date)

## Example

User: "pick up the next testing ticket"

1. Read `kanban/todo/`: find `test--circuit-breaker-statem.md`, `test--composer-merge-properties.md`, `test--streamdata-pure-function-properties.md`, `test--e2e-streaming-verification.md`
2. Filter: `type: test` → all four match
3. Check `depends-on`:
   - `test--circuit-breaker-statem.md` depends on `infra--propcheck-streamdata-setup` → check if in `ready-to-review/` → yes → **unblocked**
   - `test--composer-merge-properties.md` depends on `infra--propcheck-streamdata-setup` → **unblocked**
   - `test--streamdata-pure-function-properties.md` depends on `infra--propcheck-streamdata-setup` → **unblocked**
   - `test--e2e-streaming-verification.md` → no deps → **unblocked**
4. Sort by priority: `test--circuit-breaker-statem.md` (high) > `test--e2e-streaming-verification.md` (high) > others (medium). Among the two high-priority ones, both created same day, so pick first alphabetically or by date.
5. Pick `test--circuit-breaker-statem.md`
6. Move to `kanban/in-progress/`, announce, begin work
