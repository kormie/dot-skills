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
  - feat--workstreams-api-endpoint
depends-on-workstreams: []
tags: [api]
---

# Add blocking computation logic

## Description

Implement server-side blocking computation that determines whether a ticket is blocked and what it's blocked by.

## Acceptance Criteria

- [ ] Check `depends-on` slugs against ready-to-review/done directories
- [ ] Check `depends-on-workstreams` for workstream completion
- [ ] Check workstream predecessor completion (implicit ordering)
- [ ] Return array of blocker slugs (empty if unblocked)
- [ ] Helper function `isTicketComplete(slug, root)` works correctly

## Context

Blocking logic must match the rules defined in the kanban-tracker skill. Three conditions can block a ticket:
1. Ticket dependency not satisfied
2. Workstream dependency not satisfied
3. Workstream predecessor not done

## Test Plan

- Test ticket blocked by depends-on
- Test ticket blocked by depends-on-workstreams
- Test ticket blocked by workstream predecessor
- Test unblocked ticket
- Test ticket with multiple blockers

## Notes

Helper functions needed:
- `computeBlockedBy(ticket, workstreams, root)`
- `isTicketComplete(slug, root)`
- `isWorkstreamComplete(workstream, root)`
