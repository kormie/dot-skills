# Review: Add workstreams API endpoint

**Work Item:** [feat--workstreams-api-endpoint](../ready-to-review/feat--workstreams-api-endpoint.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added a new `GET /api/workstreams` endpoint that returns all workstreams with computed progress. The endpoint parses workstream markdown files, counts completed tickets by checking their location in ready-to-review/done directories, and returns structured JSON.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/api.ts` | Added WorkstreamMeta interface, parseFrontmatter enhanced for YAML lists, getWorkstreams() function, isTicketComplete() helper, new endpoint handler |

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running (`/serve`)

### Steps

1. Start the kanban server: `/serve`
2. Call the endpoint: `curl http://localhost:3333/api/workstreams`
3. Verify response contains workstreams array with slug, name, priority, status, progress, tickets

### Expected Results

```json
{
  "workstreams": [
    {
      "slug": "workstream-ui",
      "name": "Workstream UI",
      "priority": "high",
      "status": "active",
      "progress": { "completed": 1, "total": 9 },
      "tickets": ["feat--workstreams-api-endpoint", ...]
    }
  ]
}
```

## Risks / Things to Watch

- parseFrontmatter now handles YAML lists - verify existing ticket parsing still works

## PR Notes

Added `/api/workstreams` endpoint for workstream UI features.

### How to Verify

1. Start server: `/serve`
2. Test: `curl http://localhost:3333/api/workstreams`
3. Should return workstreams with progress info

### Risks

- Enhanced frontmatter parser - monitor for regressions

Full review: [link to review file]
