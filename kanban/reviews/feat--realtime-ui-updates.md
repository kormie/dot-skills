# Review: Add real-time UI updates via SSE

**Work Item:** [feat--realtime-ui-updates](../ready-to-review/feat--realtime-ui-updates.md)
**Branch:** main
**Date:** 2026-02-05

## Summary

Implemented Server-Sent Events (SSE) with file watching for real-time UI updates. When tickets are moved between directories (by Claude or manually), the UI updates automatically within ~100ms.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/api.ts` | Added `/api/events` SSE endpoint with file watching, client management |
| `plugins/kanban-skill/server/static/index.html` | Added EventSource connection with auto-reconnect |

## Implementation Details

**Server-side:**
- Uses Node.js `fs.watch()` with recursive flag to watch `kanban/` directory
- Single watcher shared across all clients (efficient)
- 100ms debounce to batch rapid file changes
- Clients stored in a Set, cleaned up on disconnect

**Client-side:**
- EventSource connection to `/api/events`
- On "refresh" event, reloads tickets and workstreams
- Auto-reconnects after 3 seconds on connection loss

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running (`bun plugins/kanban-skill/server/index.ts`)

### Steps

1. Open http://localhost:3333 in browser
2. Open terminal and run: `mv kanban/todo/feat--*.md kanban/in-progress/`
3. Watch the UI - card should move to "In Progress" column automatically
4. Move it back: `mv kanban/in-progress/feat--*.md kanban/todo/`
5. Verify UI updates again

### Expected Results

- UI updates within 1 second of file change
- No manual refresh required
- Works in all views (Board, Table, Workstreams)

## Risks / Things to Watch

- File watcher uses recursive mode which may have performance implications on very large directories
- No rate limiting on client side (could spam server if rapid changes)

## PR Notes

Added real-time UI updates to kanban board via Server-Sent Events.

### How to Verify

1. Start server: `bun plugins/kanban-skill/server/index.ts`
2. Open http://localhost:3333
3. Move a ticket file in another terminal
4. Watch the UI update automatically

### Risks

- Performance on very large kanban directories (untested)
