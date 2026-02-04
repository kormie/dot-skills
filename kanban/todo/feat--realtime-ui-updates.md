---
type: feature
project: dot-skills
created: 2026-02-04
priority: medium
session:
git-ref: 06366b9
branch:
workstream:
depends-on: []
depends-on-workstreams:
  - workstream-ui
tags: [ui, enhancement]
---

# Add real-time UI updates when tickets move

## Description

Implement a mechanism for the kanban web UI to automatically update when tickets are moved between directories (e.g., when Claude moves a ticket from todo to in-progress).

## Acceptance Criteria

- [ ] UI updates automatically when kanban files change
- [ ] No manual refresh required
- [ ] Minimal latency (< 2 seconds from file change to UI update)
- [ ] Efficient - doesn't spam the server or cause performance issues
- [ ] Works across all views (board, table, swimlane)

## Context

Currently the kanban web UI requires a manual page refresh to see changes. When Claude moves tickets between directories, the user has to manually refresh to see the update. This breaks the flow of watching work progress in real-time.

## Approach Options

### Option 1: Server-Sent Events (SSE) with File Watching
- Server watches `kanban/` directory for file changes using `fs.watch`
- When changes detected, push event to connected clients via SSE
- Clients re-fetch data on receiving event
- **Pros:** Efficient, real-time, low bandwidth
- **Cons:** Requires server-side file watching setup

### Option 2: Simple Polling
- Client polls `/api/tickets` every N seconds (e.g., 3-5 seconds)
- Compare with previous state, re-render if changed
- **Pros:** Simple to implement, no server changes
- **Cons:** Wastes bandwidth, delayed updates, not truly real-time

### Option 3: WebSocket
- Full bidirectional connection
- Server pushes updates on file changes
- **Pros:** Most flexible, truly real-time
- **Cons:** More complex, overkill for this use case

**Recommendation:** Option 1 (SSE with file watching) provides the best balance of real-time updates and simplicity.

## Test Plan

- Move a ticket via CLI while UI is open
- Verify UI updates within 2 seconds
- Test with multiple browser tabs open
- Verify no duplicate events or race conditions

## Notes

Bun has built-in file watching via `Bun.file().watch()` or can use `fs.watch()`.

SSE implementation:
```typescript
// Server
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const watcher = fs.watch(kanbanDir, { recursive: true }, () => {
    res.write('data: refresh\n\n');
  });

  req.on('close', () => watcher.close());
});

// Client
const events = new EventSource('/api/events');
events.onmessage = () => loadTickets();
```
