# Review: Add blocking computation logic

**Work Item:** [feat--blocking-computation](../ready-to-review/feat--blocking-computation.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added server-side blocking computation that determines whether a ticket is blocked and what it's blocked by. The `computeBlockedBy()` function checks three conditions: explicit ticket dependencies, workstream dependencies, and implicit workstream predecessor ordering.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/api.ts` | Added `isWorkstreamComplete()` helper, `computeBlockedBy()` function, updated `getTicketsInColumn()` to compute and include blocking info, updated `/api/tickets` to pass workstreams |

## Implementation Details

### New Functions

1. **`isWorkstreamComplete(workstream)`** - Returns true if all tickets in the workstream are complete (progress.completed === progress.total && total > 0)

2. **`computeBlockedBy(ticket, workstreams, root)`** - Returns array of blocker slugs by checking:
   - `depends-on` slugs not in ready-to-review/done
   - `depends-on-workstreams` that are incomplete
   - Workstream predecessors (tickets earlier in the workstream's ticket list) that are incomplete

### Modified Functions

- **`getTicketsInColumn()`** - Now accepts workstreams parameter and computes `blockedBy` for each ticket
- **`/api/tickets` handler** - Fetches workstreams first to pass to getTicketsInColumn

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running (`/serve`)

### Steps

1. Start the kanban server: `/serve`
2. Call the tickets endpoint: `curl http://localhost:3333/api/tickets`
3. Verify tickets include `blockedBy` array when blocked

### Expected Results

```json
{
  "todo": [
    {
      "filename": "feat--swimlane-view.md",
      "title": "Swimlane view",
      "type": "feature",
      "priority": "medium",
      "created": "2026-02-04",
      "workstream": "workstream-ui",
      "blockedBy": ["feat--workstream-ribbon", "feat--card-workstream-badge"]
    }
  ],
  ...
}
```

Tickets without blockers will not have the `blockedBy` field (undefined).

## Risks / Things to Watch

- Performance: For each ticket, we check predecessor completion which involves file system reads. Consider caching for large boards.
- Circular dependencies are not detected - would cause infinite blocking.

## PR Notes

Added blocking computation to `/api/tickets` endpoint. Tickets now include `blockedBy` array showing what's blocking them.

### How to Verify

1. Start server: `/serve`
2. Test: `curl http://localhost:3333/api/tickets`
3. Tickets should include `blockedBy` field when blocked

### Risks

- File system reads for each predecessor check - monitor performance
