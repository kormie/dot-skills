---
name: kanban-tracker
description: Maintain the repo-level kanban board under kanban/ to track work items across sessions
allowed-tools: Read, Write, Edit, Glob, Bash
---

# Kanban Work Log Tracker

Maintain the persistent kanban board at `kanban/` in the repo root. This board tracks work items across Claude Code sessions so progress is never lost.

## Directory Structure

```
kanban/
├── README.md          # Board overview and conventions
├── workstreams/       # Workstream definitions
├── todo/              # Work not yet started
├── in-progress/       # Actively being worked on
├── ready-to-review/   # Complete, awaiting human review
└── reviews/           # Human-readable review/verification guides
```

## Workstreams

A **workstream** is a logical grouping of related tickets that share a cohesive goal. Workstreams:

- **Contain internal dependencies** — tickets within a workstream typically depend on each other
- **Minimize external dependencies** — cross-workstream dependencies should be rare and explicit
- **Enable parallel execution** — independent workstreams can be worked on simultaneously
- **Provide progress visibility** — completing a workstream is a meaningful milestone

### Workstream File Format

Each workstream is defined in `kanban/workstreams/<slug>.md`:

```markdown
---
slug: voice-extraction
status: active
priority: high
created: YYYY-MM-DD
tickets:
  - refactor--extract-base-voice-step
  - docs--document-voice-steps
depends-on-workstreams: []
tags: []
---

# Voice Extraction

## Goal

<1-3 sentences describing what this workstream achieves when complete>

## Scope

<What's included and explicitly excluded>

## Success Criteria

- [ ] <measurable outcome 1>
- [ ] <measurable outcome 2>

## Notes

<Implementation strategy, risks, open questions>
```

### Workstream Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `slug` | yes | string | Unique identifier matching filename |
| `status` | yes | enum | `active`, `blocked`, `completed` |
| `priority` | yes | enum | `high`, `medium`, `low` |
| `created` | yes | date | `YYYY-MM-DD` |
| `tickets` | yes | list | Ordered list of ticket slugs in this workstream |
| `depends-on-workstreams` | no | list | Other workstream slugs this workstream blocks on |
| `tags` | no | list | Freeform tags for filtering |

### Workstream Rules

1. **A ticket belongs to at most one workstream.** If work spans multiple concerns, split the ticket.

2. **Ticket order in the `tickets` list is significant.** It represents the recommended execution order within the workstream.

3. **Workstream status is derived:**
   - `completed` — all tickets in `ready-to-review/` or `done/`
   - `blocked` — depends on incomplete workstream, or all tickets are blocked
   - `active` — has at least one unblocked ticket

4. **Cross-workstream dependencies should be explicit.** Use `depends-on-workstreams` when an entire workstream must complete before another can start.

5. **Keep workstreams focused.** 3-8 tickets is ideal. Larger workstreams should be split.

## Ticket Types

Every work item has a `type` in its frontmatter. Use these standard types:

| Type | When to use | Example |
|------|------------|---------|
| `feature` | New functionality or capability | Add Analysis & Critique voices |
| `test` | Test coverage, property tests, verification | CircuitBreaker StateM property test |
| `bug` | Defect fix | Fix weight normalization off-by-one |
| `refactor` | Restructuring without behavior change | Extract Composer merge into module |
| `infra` | Deps, build, CI, tooling, dev experience | Add PropCheck dependency |
| `docs` | Documentation changes | Update API usage guide |
| `spike` | Time-boxed research or investigation | Evaluate PropCheck vs StreamData |

## Work Item File Format

Each work item is a markdown file named with a **type-prefixed slug**: `<type>--<short-slug>.md`

The type prefix is separated by a double-dash (`--`) from the slug to avoid ambiguity with kebab-case names. This makes ticket types visible when scanning a directory listing without opening files.

**Examples:**
- `feat--analysis-critique-voices.md`
- `test--circuit-breaker-statem.md`
- `infra--propcheck-streamdata-setup.md`
- `bug--weight-normalization-off-by-one.md`

**Type prefixes:** `feat`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike`

All structured metadata goes in **YAML frontmatter** (compatible with Obsidian, Dataview, and standard markdown tooling). The body contains only prose, criteria, and notes.

Use this template:

```markdown
---
type: feature
project: atelier
created: YYYY-MM-DD
priority: medium
session: <claude-code-session-url>
git-ref: <short-sha>
branch:
workstream: <workstream-slug-or-empty>
depends-on: []
depends-on-workstreams: []
tags: []
---

# Title

## Description

<1-3 sentences describing the work item>

## Acceptance Criteria

- [ ] <criterion 1>
- [ ] <criterion 2>

## Context

<Why this ticket exists. What was happening when it was created — the conversation,
discovery, or observation that motivated it. Link to relevant code, design docs,
prior tickets, or external references. This section captures the "institutional memory"
so a future session can pick up the ticket without losing the thread.>

## Notes

<Any implementation hints, decisions, blockers, or open questions>
```

### Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `type` | yes | enum | One of: `feature`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike` |
| `project` | yes | string | Repository or project identifier (e.g. `atelier`). Enables cross-repo Obsidian vaults. |
| `created` | yes | date | `YYYY-MM-DD` |
| `priority` | yes | enum | `high`, `medium`, or `low` |
| `session` | yes | string | Claude Code session URL where the ticket was created (e.g. `https://claude.ai/code/session_abc123`). Provides backlink to the conversation that motivated the ticket. |
| `git-ref` | yes | string | Short SHA of the commit HEAD when the ticket was created (e.g. `9494eca`). Anchors the ticket to a specific codebase state. |
| `branch` | no | string | Git branch name. Null/empty until work starts. |
| `workstream` | no | string | Workstream slug this ticket belongs to (e.g. `voice-extraction`). Empty if not part of a workstream. |
| `depends-on` | no | list | Slugs of tickets this blocks on (e.g. `[infra--propcheck-streamdata-setup]`) |
| `depends-on-workstreams` | no | list | Workstream slugs this ticket blocks on (e.g. `[guardrails]`). Ticket is blocked until all tickets in the workstream are complete. |
| `tags` | no | list | Freeform tags for filtering/grouping (e.g. `[property-testing, ai]`) |

### Notes on Frontmatter

- The `Review` link is **not** in frontmatter — it's always derivable from the filename: `../reviews/<type>--<slug>.md`
- `depends-on` uses ticket slugs (filenames without `.md`), not full paths
- `depends-on-workstreams` uses workstream slugs (filenames without `.md`), not full paths
- `project` should match the application directory name in the repo
- `tags` are freeform; use them for cross-cutting concerns that don't fit the type system

### Blocking Logic

A ticket is **blocked** if ANY of these conditions are true:

1. **Ticket dependency not satisfied:** Any slug in `depends-on` does not have a matching file in `kanban/ready-to-review/` or `kanban/done/`

2. **Workstream dependency not satisfied:** Any slug in `depends-on-workstreams` refers to a workstream that is not `completed` (i.e., not all of its tickets are in `ready-to-review/` or `done/`)

3. **Workstream predecessor not done:** The ticket belongs to a workstream, and there's an earlier ticket in that workstream's `tickets` list that is not yet in `ready-to-review/` or `done/`

**Example blocking scenarios:**

```yaml
# Blocked by ticket dependency
depends-on: [feat--modulator-resources]  # blocked until this ticket is done

# Blocked by workstream dependency
depends-on-workstreams: [guardrails]  # blocked until ALL guardrails tickets done

# Blocked by workstream order (implicit)
workstream: voice-extraction  # if earlier tickets in workstream aren't done, blocked
```

## Review File Format

When moving an item to `ready-to-review/`, create (or update) a corresponding file in `kanban/reviews/<type>--<short-slug>.md`. This file is written **for the human reviewer** and should be included in PR descriptions.

Use this template:

```markdown
# Review: <Title>

**Work Item:** [<type>--<short-slug>](../ready-to-review/<type>--<short-slug>.md)
**Branch:** <git branch name>
**Date:** <YYYY-MM-DD>

## Summary

<2-4 sentences: what changed and why>

## Key Files

| File | What changed |
|------|-------------|
| `path/to/file.ex` | <brief description> |

## How to Verify

### Prerequisites

<Any setup steps: env vars, database, etc.>

### Steps

1. <concrete verification step>
2. <concrete verification step>
3. ...

### Expected Results

<What the reviewer should see if everything is working>

## Risks / Things to Watch

- <anything the reviewer should pay extra attention to>

## PR Notes

<!-- Copy everything below into the PR description -->

<Summary of changes>

### How to Verify

<Inline checklist of verification steps — do NOT just link to the review file. The PR description must be self-contained so reviewers can verify without navigating elsewhere.>

### Risks

<Bullet list of risks>

Full review: [link to review file]
```

## Spike Workflow

Spikes are time-boxed research and investigation tickets. They are **not** implementation tickets. A spike produces:

1. **Design note** (required) — A document in `design-docs/agent/` documenting findings, trade-offs, and a recommendation. This is the primary deliverable.
2. **Follow-up tickets** (required) — Concrete implementation tickets in `kanban/todo/` derived from the spike's recommendation. These turn research into action.
3. **Throwaway code** (only if useful) — A proof-of-concept module or test that demonstrates feasibility beyond what the design note conveys. This code is explicitly **not production code** and is expected to be discarded or rewritten by the implementation tickets.

**What a spike does NOT produce:**
- Refactored production modules
- Changes to existing production code paths
- New behaviours or contracts wired into existing modules
- Anything that would need to be "kept" or merged as-is

**When completing a spike:**
- Move the spike ticket to `ready-to-review/`
- The review file should summarize the recommendation and link to the design note
- List the follow-up implementation tickets that were created

## TDD Workflow Requirements

All `feature` and `bug` tickets must follow TDD practices. See `CLAUDE.md` for the full policy.

### Feature Tickets (`type: feature`)

Work on feature tickets follows the **Red → Green → Refactor** loop:

1. **Red** — Write failing tests first (unit tests and/or property tests) that encode the expected behavior from the acceptance criteria. Do not write any implementation code until tests exist and fail.
2. **Green** — Write the minimum implementation to make tests pass.
3. **Refactor** — Clean up with the green test suite as your safety net.

Acceptance criteria on feature tickets should include testable assertions. When creating feature tickets, include a `## Test Plan` section describing which tests will be written and what properties/behaviors they verify.

### Bug Tickets (`type: bug`)

Bug tickets require a **reproduce-first** workflow:

1. **Reproduce** — Write a test that demonstrates the defect. The test must fail against the current code.
2. **Fix** — Implement the fix. The previously-failing test passing is the fitness function.
3. **Verify** — Run the full suite to confirm no regressions.

When creating bug tickets, include a `## Reproduction` section describing the failure. When completing bug tickets, the review file must reference the reproducing test(s).

### Test Tickets (`type: test`)

Test tickets add coverage to existing code. They still follow TDD thinking — write the test, confirm it passes against existing behavior, then note any bugs discovered as new `bug` tickets.

## Rules

1. **One file per work item.** Keep items granular — a single feature, bug fix, or task. Not an epic.

2. **Move files between directories** to change status. Never delete items — move completed work to `ready-to-review/`.

3. **Update the file** when moving it. Add notes about what was done, check off acceptance criteria, update the branch in frontmatter if relevant.

4. **When starting a session**, read `kanban/in-progress/` and `kanban/todo/` to understand current state.

5. **When finishing work:**
   - Move the item to `ready-to-review/` and check off acceptance criteria.
   - Create or update the matching review file in `kanban/reviews/`.
   - The review file must contain concrete verification steps a human can follow.
   - For `feature` and `bug` tickets, the review file must list the tests written and confirm they pass.

6. **When creating a PR**, include the contents of the review file's "PR Notes" section in the PR body.

7. **When the user creates new tasks**, add them to `kanban/todo/` with the template above.

8. **Never auto-start work on a newly created ticket.** When you create follow-up tickets (e.g. from a spike, or when the user describes new work), add them to `kanban/todo/` and stop. Do not pick up or begin implementing a ticket unless the user explicitly asks you to. Always wait for confirmation before starting work.

9. **Naming convention**: Filenames use `<type>--<kebab-case-slug>.md`. The double-dash separates the type prefix from the descriptive slug. The work item and its review file share the same filename. Examples: `feat--steel-thread-foundation.md` in `ready-to-review/` pairs with `feat--steel-thread-foundation.md` in `reviews/`.

10. **Keep it lightweight.** The kanban board is a coordination tool, not documentation. Link to design docs and code rather than duplicating content.

11. **TDD is mandatory for feature and bug tickets.** No implementation code before tests. The test suite is the source of truth for "done".

## When to Update

- At the start of every session (read current state)
- When the user describes new work (create todo items)
- When you begin working on something (move to in-progress)
- When work is complete (move to ready-to-review + create review file)
- When the user explicitly asks to update the board
