---
type: feature
project: dot-skills
created: 2026-02-04
priority: high
session:
git-ref: 56f92ca
branch:
workstream: workstream-ui
depends-on: []
depends-on-workstreams: []
tags: [api]
---

# Add workstreams API endpoint

## Description

Create a new `GET /api/workstreams` endpoint that returns all workstreams with computed progress information.

## Acceptance Criteria

- [ ] Endpoint parses all files in `kanban/workstreams/*.md`
- [ ] Returns workstream slug, name, priority, status
- [ ] Computes progress by checking ticket locations (todo/in-progress/ready-to-review/done)
- [ ] Returns tickets list for each workstream
- [ ] Handles missing workstreams directory gracefully

## Context

Foundation for workstream UI features. The ribbon, swimlane view, and new ticket form all depend on this endpoint to get workstream data.

Design doc: `docs/plans/2026-02-04-kanban-workstream-ui-design.md`

## Test Plan

- Verify endpoint returns correct structure
- Test with 0, 1, and multiple workstreams
- Test progress computation with tickets in various states

## Notes

Response format:
```json
{
  "workstreams": [
    {
      "slug": "voice-extraction",
      "name": "Voice Extraction",
      "priority": "high",
      "status": "active",
      "progress": { "completed": 3, "total": 5 },
      "tickets": ["feat--base-voice", "feat--modulator"]
    }
  ]
}
```
