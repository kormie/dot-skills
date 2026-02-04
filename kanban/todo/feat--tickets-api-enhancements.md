---
type: feature
project: dot-skills
created: 2026-02-04
priority: high
session:
git-ref: 56f92ca
branch:
workstream: workstream-ui
depends-on:
  - feat--blocking-computation
depends-on-workstreams: []
tags: [api]
---

# Enhance tickets API with workstream and blocking fields

## Description

Enhance the `GET /api/tickets` endpoint to include workstream and blocking information for each ticket, plus support for fetching done tickets.

## Acceptance Criteria

- [ ] Each ticket includes `workstream` field (slug or null)
- [ ] Each ticket includes `blockedBy` array (slugs or empty)
- [ ] New query param `?includeDone=true` fetches done directory
- [ ] Default behavior (no param) excludes done for performance
- [ ] Parse `depends-on` and `depends-on-workstreams` from frontmatter

## Context

UI needs workstream and blocking info to display badges and indicators. Done toggle needs ability to fetch completed tickets.

## Test Plan

- Verify workstream field populated correctly
- Verify blockedBy computed correctly
- Test includeDone=true returns done tickets
- Test default excludes done tickets

## Notes

Enhanced response structure:
```json
{
  "todo": [
    {
      "filename": "feat--example.md",
      "title": "Example",
      "type": "feature",
      "priority": "high",
      "created": "2026-02-04",
      "workstream": "workstream-ui",
      "blockedBy": ["feat--dependency"]
    }
  ]
}
```
