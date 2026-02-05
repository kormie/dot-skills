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

- [x] Check if SessionEnd hook is being triggered at all
- [x] Verify the hook script has correct permissions
- [x] Check if the kill command targets the right process
- [ ] Test if the hook works in different session termination scenarios (exit, crash, close)
- [x] Review hook configuration in plugin.json

## Root Cause

The `hooks/hooks.json` was missing the required `matcher` field. The Claude Code hooks format requires:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "*",  // <-- This was missing!
        "hooks": [...]
      }
    ]
  }
}
```

Without the `matcher` field, the hook was never being matched and therefore never executed.

## Fix Applied

Added `"matcher": "*"` to the SessionEnd hook configuration in `plugins/kanban-skill/hooks/hooks.json`.

## Context

Relevant files:
- `plugins/kanban-skill/.claude-plugin/plugin.json` - plugin manifest, references hooks
- `plugins/kanban-skill/hooks/hooks.json` - hook configuration (fixed)
- `plugins/kanban-skill/hooks/stop-server-on-exit.sh` - kill script (permissions OK)

## Notes

- Hook script has correct permissions (rwxr-xr-x)
- Kill command (`pkill -f "kanban-skill/server"`) is appropriate for the server process
- Testing different termination scenarios requires manual verification in a new session
