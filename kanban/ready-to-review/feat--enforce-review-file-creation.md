---
type: feature
project: dot-skills
created: 2026-02-05
priority: medium
session:
git-ref: 1cedc8d
branch:
workstream:
depends-on: []
depends-on-workstreams: []
tags: [kanban-skill, agent-reliability, hooks]
---

# Enforce review file creation when moving tickets to ready-to-review

## Description

Agents frequently skip the step of creating a review file in `kanban/reviews/` when moving tickets to `ready-to-review/`. The current workflow relies on agents reading and following the kanban-tracker skill instructions, but this is easily forgotten or skipped. We need a more robust mechanism to enforce this step.

## Acceptance Criteria

- [x] Agent is reminded/blocked when moving a ticket to `ready-to-review/` without a corresponding review file
- [x] The enforcement mechanism fires reliably without requiring agents to remember the step
- [x] Review file template or guidance is provided at the point of enforcement
- [x] Solution integrates cleanly with existing kanban-skill plugin architecture

## Potential Approaches

### Option A: PostToolUse Hook on Edit/Write/Bash
Add a hook that detects when files are moved to `kanban/ready-to-review/` and checks if a corresponding review file exists in `kanban/reviews/`. If not, inject a system message reminding the agent to create one.

**Pros:** Automatic, fires at the right moment
**Cons:** May be noisy, hook matching on file moves is tricky

### Option B: Stop Hook Validation
Add a Stop hook that checks if any tickets in `ready-to-review/` are missing their review files. Block completion until all review files exist.

**Pros:** Catches the issue before session ends
**Cons:** Delayed feedback, agent may have moved on mentally

### Option C: Dedicated "complete-ticket" Skill
Create a skill specifically for completing tickets that bundles: move to ready-to-review + create review file + verify. Agents would invoke `/complete-ticket <slug>` instead of manually moving files.

**Pros:** Single command enforces full workflow, harder to skip steps
**Cons:** Requires agents to know/use the skill, doesn't catch manual moves

### Option D: Prompt-based Hook on File Operations
Use a prompt-based PreToolUse hook that evaluates file operations targeting `kanban/ready-to-review/` and injects guidance about the review file requirement before the move happens.

**Pros:** Proactive guidance, context-aware
**Cons:** May slow down operations, prompt hooks have latency

## Context

This ticket was created after an agent completed a bug fix but skipped the review file creation step, requiring manual correction. The kanban-tracker skill documents the requirement but agents don't always follow multi-step processes reliably.

The goal is to make the "happy path" enforce the review process rather than relying on agent discipline.

## Implementation

**Approach chosen:** Option B — Stop Hook Validation (command-based)

**Files added/modified:**
- `plugins/kanban-skill/hooks/check-review-files.sh` (new) — Shell script that scans `ready-to-review/` and blocks if any ticket is missing a matching review file in `reviews/`
- `plugins/kanban-skill/hooks/hooks.json` (modified) — Added `Stop` event hook entry

**How it works:**
1. When the agent tries to stop, the Stop hook fires
2. The script checks every `.md` in `kanban/ready-to-review/` for a matching file in `kanban/reviews/`
3. If all present → exit 0 (agent can stop)
4. If any missing → exit 2 with stderr listing missing files + review template (agent is blocked)

**Design decisions:**
- Command-based (not prompt-based) for speed and determinism
- Degrades gracefully: if `kanban/` doesn't exist or `ready-to-review/` is empty, passes through
- Includes full review template in the blocking message so the agent has everything needed

## Notes

- Consider combining approaches (e.g., dedicated skill + Stop hook as safety net)
- The solution should degrade gracefully - don't break workflows if enforcement fails
- Review file template should be easily accessible at enforcement time
