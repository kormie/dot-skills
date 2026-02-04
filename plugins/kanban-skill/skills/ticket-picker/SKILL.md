---
name: ticket-picker
description: Select the next kanban ticket to work on, with optional type/tag/workstream filtering
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Ticket Picker

Select and begin work on the next kanban ticket. **Only activated when the user explicitly asks to start work on a ticket.** Triggered by phrases like:

- "pick up the next ticket"
- "pick up the next testing ticket"
- "pick up the next feature ticket"
- "start the next high priority ticket"
- "work on the next property-testing ticket"
- "pick up the next ticket from the voice-extraction workstream"

**Never** auto-pick or auto-start a ticket. Creating a ticket does not mean starting it. Always wait for the user to explicitly ask before beginning work on any ticket.

## Selection Algorithm

### 1. Read all tickets in `kanban/todo/`

Glob `kanban/todo/*.md` and parse each file's YAML frontmatter for `type`, `priority`, `depends-on`, `depends-on-workstreams`, `workstream`, and `tags`.

### 2. Read all workstreams in `kanban/workstreams/`

Glob `kanban/workstreams/*.md` and parse each file's YAML frontmatter for `slug`, `status`, `tickets`, and `depends-on-workstreams`. This is needed to check workstream-level blocking.

### 3. Filter by user intent

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
| "next ticket from <workstream>" | `workstream` equals `<workstream>` |

When the user specifies multiple qualifiers (e.g. "next high priority testing ticket"), apply all filters together.

If no tickets match the filter, tell the user what's available instead of silently picking something else.

### 4. Exclude blocked tickets

A ticket is **blocked** if ANY of these conditions are true:

#### 4a. Ticket dependency not satisfied

Any slug in `depends-on` does NOT have a matching file in `kanban/ready-to-review/` or `kanban/done/`.

To check: for each slug in `depends-on`, look for `kanban/ready-to-review/<slug>.md` or `kanban/done/<slug>.md`. If neither exists, the ticket is blocked.

#### 4b. Workstream dependency not satisfied

Any slug in `depends-on-workstreams` refers to a workstream that is NOT complete.

To check: for each workstream slug in `depends-on-workstreams`:
1. Read `kanban/workstreams/<slug>.md`
2. Get the `tickets` list from frontmatter
3. For each ticket in that list, check if it exists in `kanban/ready-to-review/` or `kanban/done/`
4. If ANY ticket from the workstream is NOT complete, this ticket is blocked

#### 4c. Workstream predecessor not done (implicit ordering)

If the ticket has a `workstream` field, check if earlier tickets in that workstream are complete:
1. Read `kanban/workstreams/<workstream>.md`
2. Get the `tickets` list from frontmatter
3. Find this ticket's position in the list
4. For each ticket BEFORE this one in the list, check if it exists in `kanban/ready-to-review/` or `kanban/done/`
5. If ANY predecessor is NOT complete, this ticket is blocked

**Note:** Workstream ordering is a soft constraint. If the user explicitly requests a specific ticket by name, skip this check.

### 5. Sort remaining tickets

1. **Workstream priority**: tickets from `high` priority workstreams > `medium` > `low` > tickets not in any workstream
2. **Ticket priority**: within same workstream priority, `high` > `medium` > `low`
3. **Workstream order**: within same workstream, earlier tickets first (per `tickets` list order)
4. **Creation date**: older tickets first (FIFO within same priority and no workstream order)

### 6. Pick the first ticket

Select the top ticket from the sorted list.

### 7. Begin work

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
- **All tickets blocked**: Tell the user which tickets exist, what they're blocked on, and which workstreams need to complete first
- **User specifies a ticket by name**: Skip the algorithm, pick that ticket directly (bypass workstream ordering)
- **Multiple tickets tied**: Pick the oldest one (by `created` date), or first in workstream order if same workstream
- **User specifies a workstream**: Only consider tickets with that `workstream` field, respect workstream ordering
- **Workstream is blocked**: Tell the user which workstream dependency is incomplete

## Example 1: Basic Selection

User: "pick up the next testing ticket"

1. Read `kanban/todo/`: find `test--circuit-breaker-statem.md`, `test--composer-merge-properties.md`
2. Read `kanban/workstreams/`: find `test-infra.md` which includes both tickets
3. Filter: `type: test` → both match
4. Check blocking:
   - `test--circuit-breaker-statem.md` depends on `infra--propcheck-streamdata-setup` → in `ready-to-review/` → **unblocked**
   - `test--composer-merge-properties.md` is second in workstream `tickets` list → predecessor `test--circuit-breaker-statem.md` not done → **blocked by workstream order**
5. Only `test--circuit-breaker-statem.md` is unblocked
6. Pick `test--circuit-breaker-statem.md`
7. Move to `kanban/in-progress/`, announce, begin work

## Example 2: Workstream Dependency

User: "pick up the next ticket from the streaming-reorg workstream"

1. Read `kanban/todo/`: find tickets with `workstream: streaming-reorg`
2. Read `kanban/workstreams/streaming-reorg.md`:
   ```yaml
   tickets:
     - infra--externalize-llm-config
     - refactor--split-streaming-module
     - refactor--extract-api-key-handling
   depends-on-workstreams: []
   ```
3. Check blocking:
   - `infra--externalize-llm-config` is first in list → no predecessor → check `depends-on` → none → **unblocked**
   - `refactor--split-streaming-module` depends on first ticket → **blocked by workstream order**
   - `refactor--extract-api-key-handling` depends on second ticket → **blocked by workstream order**
4. Pick `infra--externalize-llm-config`
5. Move to `kanban/in-progress/`, announce, begin work

## Example 3: Cross-Workstream Dependency

User: "pick up the next ticket"

Ticket `refactor--artifact-components.md` has:
```yaml
workstream: liveview-cleanup
depends-on-workstreams: [guardrails]
```

1. Check workstream dependency: is `guardrails` workstream complete?
2. Read `kanban/workstreams/guardrails.md` → `tickets: [docs--claude-md-guidelines, infra--create-hooks]`
3. Check if `docs--claude-md-guidelines.md` is in `ready-to-review/` or `done/` → NO (still in `todo/`)
4. Result: `refactor--artifact-components.md` is **blocked** by workstream dependency
5. Skip this ticket, continue to next candidate
