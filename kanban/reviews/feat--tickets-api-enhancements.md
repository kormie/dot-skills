# Review: Enhance tickets API with workstream and blocking fields

**Work Item:** [feat--tickets-api-enhancements](../ready-to-review/feat--tickets-api-enhancements.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added `?includeDone=true` query parameter support to the `/api/tickets` endpoint. The workstream and blockedBy fields were already implemented by the blocking-computation ticket.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/api.ts` | Added includeDone query param parsing, optional `done` field in response |

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running

### Steps

1. Test default (no done): `curl http://localhost:3333/api/tickets | jq 'keys'`
   - Should return: `["in-progress", "ready-to-review", "todo"]`

2. Test with includeDone: `curl 'http://localhost:3333/api/tickets?includeDone=true' | jq 'keys'`
   - Should return: `["done", "in-progress", "ready-to-review", "todo"]`

3. Verify tickets have workstream and blockedBy fields:
   `curl http://localhost:3333/api/tickets | jq '.todo[0]'`

### Expected Results

- Default response excludes `done` key
- With `?includeDone=true`, response includes `done` array
- Each ticket has `workstream` (string or null) and `blockedBy` (array or undefined)

## Risks / Things to Watch

- None - additive change only

## PR Notes

Added `?includeDone=true` support to `/api/tickets` endpoint for the done toggle feature.

### How to Verify

1. `curl http://localhost:3333/api/tickets` - should NOT include `done`
2. `curl 'http://localhost:3333/api/tickets?includeDone=true'` - should include `done`

### Risks

- None

Full review: [link to review file]
