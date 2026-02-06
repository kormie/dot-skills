---
title: Ticket Format
description: Complete reference for the markdown ticket format, frontmatter fields, blocking logic, and associated workflows.
---

Tickets are the atomic unit of work in the kanban system. Each ticket is a single markdown file with YAML frontmatter for structured metadata and a prose body for human-readable context. This page is the definitive reference for the ticket file format.

## Filename Convention

Every ticket filename follows the pattern:

```
<type>--<kebab-case-slug>.md
```

The **double-dash** (`--`) separates the type prefix from the descriptive slug. This avoids ambiguity with kebab-case names in the slug portion and makes ticket types visible when scanning a directory listing without opening files.

```
kanban/todo/
├── feat--login-page.md
├── bug--crash-on-empty-input.md
├── refactor--extract-auth-module.md
└── spike--evaluate-caching-strategy.md
```

Rules for filenames:

- The slug must be kebab-case (lowercase, hyphens between words)
- Keep slugs short but descriptive (3-5 words is ideal)
- The filename is the ticket's identity -- it stays the same as the file moves between directories
- A ticket and its review file share the same filename (e.g., `feat--login-page.md` in both `ready-to-review/` and `reviews/`)

## Type Prefixes

Every ticket has a `type` prefix in its filename and a corresponding `type` field in its frontmatter. Use these standard types:

| Prefix | Frontmatter Value | When to Use | Example Filename |
|--------|-------------------|-------------|------------------|
| `feat` | `feature` | New functionality or capability | `feat--analysis-critique-voices.md` |
| `test` | `test` | Test coverage, property tests, verification | `test--circuit-breaker-statem.md` |
| `bug` | `bug` | Defect fix for broken behavior | `bug--weight-normalization-off-by-one.md` |
| `refactor` | `refactor` | Restructuring without behavior change | `refactor--extract-composer-merge.md` |
| `infra` | `infra` | Dependencies, build, CI, tooling, dev experience | `infra--propcheck-streamdata-setup.md` |
| `docs` | `docs` | Documentation changes | `docs--update-api-usage-guide.md` |
| `spike` | `spike` | Time-boxed research or investigation | `spike--evaluate-propcheck-vs-streamdata.md` |

:::note
The filename prefix uses the short form (`feat`), while the frontmatter `type` field uses the full form (`feature`). All other types use the same string in both places.
:::

## Frontmatter Fields

All structured metadata goes in YAML frontmatter. The format is compatible with Obsidian, Dataview, and standard markdown tooling.

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `type` | enum | One of: `feature`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike` | `feature` |
| `project` | string | Repository or project identifier. Enables cross-repo Obsidian vaults. | `dot-skills` |
| `created` | date | Creation date in `YYYY-MM-DD` format | `2026-02-06` |
| `priority` | enum | `high`, `medium`, or `low` | `medium` |
| `session` | string | Claude Code session URL where the ticket was created. Provides a backlink to the conversation that motivated the ticket. | `https://claude.ai/code/session_abc123` |
| `git-ref` | string | Short SHA of the commit HEAD when the ticket was created. Anchors the ticket to a specific codebase state. | `9494eca` |

### Optional Fields

| Field | Type | Default | Description | Example |
|-------|------|---------|-------------|---------|
| `branch` | string | empty | Git branch name. Null or empty until work starts. | `lisa.simpson/KH-1234/add-login` |
| `workstream` | string | empty | Workstream slug this ticket belongs to. Empty if not part of a workstream. | `voice-extraction` |
| `depends-on` | list | `[]` | Slugs of tickets this blocks on (filenames without `.md`). | `[infra--propcheck-setup]` |
| `depends-on-workstreams` | list | `[]` | Workstream slugs this ticket blocks on. Ticket is blocked until all tickets in the named workstreams are complete. | `[guardrails]` |
| `tags` | list | `[]` | Freeform tags for filtering and grouping. | `[property-testing, ai]` |

### Field Notes

- The **Review** link is not in frontmatter -- it is always derivable from the filename: `../reviews/<type>--<slug>.md`
- `depends-on` uses ticket slugs (filenames without `.md`), not full paths
- `depends-on-workstreams` uses workstream slugs (filenames without `.md`), not full paths
- `project` should match the application directory name in the repo
- `tags` are freeform; use them for cross-cutting concerns that don't fit the type system

## Markdown Body Template

The body follows the frontmatter and contains only prose, criteria, and notes. Use this template:

````markdown
# Title

## Description

<1-3 sentences describing the work item>

## Acceptance Criteria

- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

## Context

<Why this ticket exists. What was happening when it was created -- the conversation,
discovery, or observation that motivated it. Link to relevant code, design docs,
prior tickets, or external references. This section captures the "institutional memory"
so a future session can pick up the ticket without losing the thread.>

## Notes

<Any implementation hints, decisions, blockers, or open questions>
````

### Section Purposes

| Section | Purpose | Required |
|---------|---------|----------|
| **Title** | Short, descriptive name for the work item (H1 heading) | Yes |
| **Description** | 1-3 sentence summary of what needs to happen | Yes |
| **Acceptance Criteria** | Checkbox list of concrete, verifiable outcomes | Yes |
| **Context** | Background information, motivation, links to related work | Yes |
| **Notes** | Implementation hints, open questions, decisions made | Optional |

Feature and bug tickets should also include a **Test Plan** section (see [TDD Workflow](#tdd-workflow) below).

## Blocking Logic

A ticket is **blocked** if ANY of these three conditions are true.

### 1. Ticket Dependency Not Satisfied

Any slug in `depends-on` does not have a matching file in `kanban/ready-to-review/` or `kanban/done/`.

```yaml
# This ticket is blocked until feat--modulator-resources is in
# ready-to-review/ or done/
depends-on:
  - feat--modulator-resources
```

If `feat--modulator-resources.md` still exists in `kanban/todo/` or `kanban/in-progress/`, this ticket cannot be started.

### 2. Workstream Dependency Not Satisfied

Any slug in `depends-on-workstreams` refers to a workstream that is not `completed` (i.e., not all of its tickets are in `ready-to-review/` or `done/`).

```yaml
# This ticket is blocked until every ticket in the "guardrails"
# workstream is in ready-to-review/ or done/
depends-on-workstreams:
  - guardrails
```

Even if most guardrails tickets are done, a single incomplete ticket keeps this dependency unsatisfied.

### 3. Workstream Predecessor Not Done

The ticket belongs to a workstream, and there is an earlier ticket in that workstream's `tickets` list that is not yet in `ready-to-review/` or `done/`.

```yaml
# workstreams/voice-extraction.md
---
slug: voice-extraction
tickets:
  - refactor--extract-base-voice-step    # must finish first
  - feat--add-analysis-voice             # blocked until above is done
  - docs--document-voice-steps           # blocked until both above are done
---
```

```yaml
# In feat--add-analysis-voice.md frontmatter:
workstream: voice-extraction
```

The ticket `feat--add-analysis-voice` is implicitly blocked because `refactor--extract-base-voice-step` appears earlier in the workstream's `tickets` list. No explicit `depends-on` entry is needed -- workstream ordering handles it.

### Combining Blocking Rules

A ticket can be subject to multiple blocking rules simultaneously. It is unblocked only when **all** conditions are satisfied:

```yaml
# This ticket has three blocking conditions:
# 1. depends-on ticket must be done
# 2. depends-on-workstreams must all be complete
# 3. any earlier ticket in its own workstream must be done
type: feature
workstream: voice-extraction
depends-on:
  - infra--propcheck-streamdata-setup
depends-on-workstreams:
  - guardrails
```

## Review File Format

When moving a ticket to `ready-to-review/`, you must create a corresponding review file in `kanban/reviews/` with the same filename. This file is written for the human reviewer and should be included in PR descriptions.

````markdown
# Review: <Title>

**Work Item:** [<type>--<short-slug>](../ready-to-review/<type>--<short-slug>.md)
**Branch:** <git branch name>
**Date:** <YYYY-MM-DD>

## Summary

<2-4 sentences: what changed and why>

## Key Files

| File | What changed |
|------|-------------|
| `path/to/file.ts` | <brief description> |
| `path/to/other.ts` | <brief description> |

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

<Inline checklist of verification steps -- do NOT just link to the review
file. The PR description must be self-contained so reviewers can verify
without navigating elsewhere.>

### Risks

<Bullet list of risks>

Full review: [link to review file]
````

### Review File Rules

- The review file and ticket file share the same filename (e.g., `feat--login-page.md` exists in both `ready-to-review/` and `reviews/`)
- The **PR Notes** section is designed to be copied directly into a pull request description
- PR descriptions must be self-contained -- do not just link to the review file for verification steps
- For `feature` and `bug` tickets, the review file must list the tests written and confirm they pass

## Spike Workflow

Spikes are time-boxed research and investigation tickets. They are **not** implementation tickets.

### What a Spike Produces

1. **Design note** (required) -- A document in `design-docs/agent/` documenting findings, trade-offs, and a recommendation. This is the primary deliverable.
2. **Follow-up tickets** (required) -- Concrete implementation tickets in `kanban/todo/` derived from the spike's recommendation. These turn research into action.
3. **Throwaway code** (only if useful) -- A proof-of-concept module or test that demonstrates feasibility beyond what the design note conveys. This code is explicitly **not production code** and is expected to be discarded or rewritten by the implementation tickets.

### What a Spike Does NOT Produce

- Refactored production modules
- Changes to existing production code paths
- New behaviors or contracts wired into existing modules
- Anything that would need to be "kept" or merged as-is

### Completing a Spike

1. Move the spike ticket to `ready-to-review/`
2. The review file should summarize the recommendation and link to the design note
3. List the follow-up implementation tickets that were created

### Spike Example

```yaml
---
type: spike
project: dot-skills
created: 2026-02-06
priority: medium
session: https://claude.ai/code/session_xyz
git-ref: abc1234
tags: [property-testing, research]
---
```

```markdown
# Evaluate PropCheck vs StreamData

## Description

Time-boxed investigation to determine which property-based testing library
best fits our needs.

## Acceptance Criteria

- [ ] Document pros/cons of each library
- [ ] Produce a recommendation with rationale
- [ ] Create follow-up implementation tickets

## Context

We need property-based testing for the circuit breaker module. Two libraries
are viable candidates.
```

## TDD Workflow

All `feature` and `bug` tickets must follow TDD practices. Test tickets have their own lighter workflow.

### Feature Tickets (Red-Green-Refactor)

1. **Red** -- Write failing tests first (unit tests and/or property tests) that encode the expected behavior from the acceptance criteria. Do not write any implementation code until tests exist and fail.
2. **Green** -- Write the minimum implementation to make tests pass.
3. **Refactor** -- Clean up with the green test suite as your safety net.

When creating feature tickets, include a **Test Plan** section describing which tests will be written and what properties/behaviors they verify:

```markdown
## Test Plan

- Unit test: login form validates email format
- Unit test: login form rejects empty password
- Integration test: successful login redirects to dashboard
```

### Bug Tickets (Reproduce-First)

1. **Reproduce** -- Write a test that demonstrates the defect. The test must fail against the current code.
2. **Fix** -- Implement the fix. The previously-failing test passing is the fitness function.
3. **Verify** -- Run the full suite to confirm no regressions.

When creating bug tickets, include a **Reproduction** section describing the failure. When completing bug tickets, the review file must reference the reproducing test(s).

```markdown
## Reproduction

Calling `normalizeWeights([0.3, 0.3, 0.4])` returns `[0.3, 0.3, 0.3]`
instead of `[0.3, 0.3, 0.4]`. The final element is truncated due to an
off-by-one error in the loop bounds.
```

### Test Tickets (Coverage Additions)

Test tickets add coverage to existing code. They follow TDD thinking -- write the test, confirm it passes against existing behavior, then note any bugs discovered as new `bug` tickets rather than fixing inline.

## General Rules

1. **One file per work item.** Keep items granular -- a single feature, bug fix, or task. Not an epic.
2. **Move files between directories** to change status. Never delete items -- move completed work to `ready-to-review/`.
3. **Update the file** when moving it. Add notes about what was done, check off acceptance criteria, update the branch in frontmatter.
4. **Never auto-start work on a newly created ticket.** Wait for explicit confirmation before beginning implementation.
5. **Keep it lightweight.** The kanban board is a coordination tool, not documentation. Link to design docs and code rather than duplicating content.

## Complete Example

Here is a full ticket file showing all fields and sections:

```yaml
---
type: feature
project: dot-skills
created: 2026-02-04
priority: medium
session: https://claude.ai/code/session_abc123
git-ref: 06366b9
branch: david.kormushoff/feat-realtime-updates
workstream: ui-improvements
depends-on: []
depends-on-workstreams:
  - workstream-ui
tags: [ui, enhancement]
---
```

```markdown
# Add real-time UI updates when tickets move

## Description

Implement a mechanism for the kanban web UI to automatically update when
tickets are moved between directories (e.g., when Claude moves a ticket
from todo to in-progress).

## Acceptance Criteria

- [ ] UI updates automatically when kanban files change
- [ ] No manual refresh required
- [ ] Minimal latency (< 2 seconds from file change to UI update)
- [ ] Efficient -- doesn't spam the server or cause performance issues
- [ ] Works across all views (board, table, swimlane)

## Context

Currently the kanban web UI requires a manual page refresh to see changes.
When Claude moves tickets between directories, the user has to manually
refresh to see the update. This breaks the flow of watching work progress
in real-time.

## Test Plan

- Move a ticket via CLI while UI is open
- Verify UI updates within 2 seconds
- Test with multiple browser tabs open
- Verify no duplicate events or race conditions

## Notes

Server-Sent Events (SSE) with file watching is the recommended approach.
Bun has built-in file watching support. Polling is simpler but wastes
bandwidth and is not truly real-time.
```
