# Review: Enforce review file creation when moving tickets to ready-to-review

**Work Item:** [feat--enforce-review-file-creation](../ready-to-review/feat--enforce-review-file-creation.md)
**Branch:** main
**Date:** 2026-02-05

## Summary

Added a command-based Stop hook to the kanban-skill plugin that blocks agents from completing their session if any tickets in `ready-to-review/` are missing a corresponding review file in `reviews/`. The hook provides the list of missing files and a review template in the blocking message so the agent can immediately create them.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/hooks/check-review-files.sh` | New shell script — scans ready-to-review for missing review files, exits 2 with guidance if any found |
| `plugins/kanban-skill/hooks/hooks.json` | Added Stop event hook entry pointing to check-review-files.sh |

## How to Verify

### Prerequisites

- Claude Code with the kanban-skill plugin loaded

### Steps

1. Start a new Claude Code session (hooks load at session start)
2. Temporarily remove a review file: `mv kanban/reviews/feat--done-toggle.md /tmp/`
3. Ask Claude to stop or complete its task
4. Verify the Stop hook fires and blocks with a message listing `feat--done-toggle.md` as missing
5. Create the review file (or restore it): `mv /tmp/feat--done-toggle.md kanban/reviews/`
6. Ask Claude to stop again — should succeed

### Manual script test

```bash
# Should exit 0 (all reviews present)
CLAUDE_PROJECT_DIR="$(pwd)" bash plugins/kanban-skill/hooks/check-review-files.sh
echo $?

# Remove a review file, should exit 2
mv kanban/reviews/feat--done-toggle.md /tmp/
CLAUDE_PROJECT_DIR="$(pwd)" bash plugins/kanban-skill/hooks/check-review-files.sh 2>&1
echo $?
mv /tmp/feat--done-toggle.md kanban/reviews/
```

### Expected Results

- With all review files present: script exits 0 silently
- With a missing review file: script exits 2 and prints the missing filename plus a review template to stderr
- With empty/nonexistent ready-to-review directory: script exits 0 silently

## Risks / Things to Watch

- Hooks load at session start — changes to hooks.json require restarting Claude Code
- The hook checks all tickets in ready-to-review, not just ones moved in the current session. This is intentional (catches pre-existing gaps) but could surface for tickets that were moved before this hook existed.

## PR Notes

Add Stop hook to kanban-skill plugin that enforces review file creation.

When an agent tries to stop, the hook checks that every ticket in `kanban/ready-to-review/` has a matching review file in `kanban/reviews/`. If any are missing, the agent is blocked with a message listing the missing files and providing the review template.

### How to Verify

- [ ] Run `CLAUDE_PROJECT_DIR="$(pwd)" bash plugins/kanban-skill/hooks/check-review-files.sh` — exits 0
- [ ] Remove a review file, re-run — exits 2 with helpful error message
- [ ] Restore the file, re-run — exits 0 again
- [ ] Start a new Claude session and verify `/hooks` shows the Stop hook registered

### Risks

- Hooks require session restart to take effect
- Checks all ready-to-review tickets, not just current session's moves
