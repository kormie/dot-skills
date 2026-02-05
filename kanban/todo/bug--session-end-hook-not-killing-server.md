---
type: bug
project: dot-skills
created: 2026-02-05
priority: medium
session:
git-ref: ab575df
branch:
workstream:
depends-on: []
depends-on-workstreams: []
tags: [kanban-skill, hooks]
---

# Session end hook not effectively killing kanban server

## Description

The kanban-skill has a SessionEnd hook that should kill the kanban server when a Claude Code session ends, but it doesn't appear to be working reliably. The server process continues running after session termination.

## Steps to Reproduce

1. Start a Claude Code session
2. Run `/serve` to start the kanban board server
3. End the session (close terminal, `/exit`, etc.)
4. Check if server is still running: `lsof -i:3333` or `pgrep -f kanban-skill/server`

## Expected Behavior

Server process should be terminated when session ends.

## Actual Behavior

Server continues running, requiring manual cleanup (`pkill -f kanban-skill/server`).

## Investigation Areas

- [ ] Check if SessionEnd hook is being triggered at all
- [ ] Verify the hook script has correct permissions
- [ ] Check if the kill command targets the right process
- [ ] Test if the hook works in different session termination scenarios (exit, crash, close)
- [ ] Review hook configuration in plugin.json

## Context

Relevant files to investigate:
- `plugins/kanban-skill/plugin.json` - hook configuration
- `plugins/kanban-skill/hooks/` - hook scripts (if any)
- `plugins/kanban-skill/server/index.ts` - server startup

## Notes

May need to add logging to the hook to debug whether it's being called.
