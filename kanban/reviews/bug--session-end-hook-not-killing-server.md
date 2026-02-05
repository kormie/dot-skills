# Review: Session end hook not effectively killing kanban server

**Work Item:** [bug--session-end-hook-not-killing-server](../ready-to-review/bug--session-end-hook-not-killing-server.md)
**Branch:** main
**Date:** 2026-02-05

## Summary

Fixed the SessionEnd hook that was supposed to kill the kanban server when a Claude Code session ends.

**Two issues were found:**
1. The hook configuration in `hooks.json` was missing the required `matcher` field
2. The kill command used `pkill -f "kanban-skill/server"` but the actual process command line is just `bun run index.ts` (no path info)

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/hooks/hooks.json` | Added missing `matcher: "*"` field to SessionEnd hook configuration |
| `plugins/kanban-skill/hooks/stop-server-on-exit.sh` | Changed from `pkill -f` (unreliable) to `lsof -ti:3333 \| xargs kill` (kills by port) |
| `plugins/kanban-skill/commands/serve.md` | Updated manual stop command to match |

## How to Verify

### Prerequisites

- Claude Code installed with the kanban-skill plugin
- A terminal to check running processes

### Steps

1. Start a new Claude Code session (required because hooks load at session start)
2. Run `/serve` to start the kanban board server
3. Verify server is running: `lsof -i:3333` should show the process
4. End the session (type `/exit` or close the terminal)
5. Check if server was killed: `lsof -i:3333` should show nothing
6. Alternative check: `pgrep -f "kanban-skill/server"` should return no results

### Expected Results

After ending the Claude Code session, the kanban server process should be terminated automatically. No orphaned server processes should remain.

## Risks / Things to Watch

- Hooks are loaded at session start, so existing sessions won't see the fix until restarted
- The kill command now uses port 3333 - if the port changes, the script needs updating
- If another process uses port 3333, it will be killed (unlikely in practice)

## PR Notes

<!-- Copy everything below into the PR description -->

Fix SessionEnd hook not killing kanban server on session exit.

**Root causes:**
1. The `hooks.json` was missing the required `matcher` field - hook was never executed
2. The kill script used `pkill -f "kanban-skill/server"` but the bun process command line is just `bun run index.ts` (no path info to match)

**Fixes:**
1. Added `"matcher": "*"` to hooks.json
2. Changed kill method from `pkill -f` to `lsof -ti:3333 | xargs kill` (kills by port)

### How to Verify

- [ ] Start a new Claude Code session
- [ ] Run `/serve` to start the kanban board server
- [ ] Verify server is running: `lsof -i:3333`
- [ ] End the session (`/exit` or close terminal)
- [ ] Verify server was killed: `lsof -i:3333` should show nothing

### Risks

- Existing sessions need restart to pick up the fix
- Kill command uses port 3333 - if port changes, script needs updating

Full review: [kanban/reviews/bug--session-end-hook-not-killing-server.md](kanban/reviews/bug--session-end-hook-not-killing-server.md)
