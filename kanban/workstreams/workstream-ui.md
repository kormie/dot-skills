---
slug: workstream-ui
status: active
priority: high
created: 2026-02-04
tickets:
  - feat--workstreams-api-endpoint
  - feat--blocking-computation
  - feat--tickets-api-enhancements
  - feat--workstream-ribbon
  - feat--card-workstream-badge
  - feat--card-blocking-indicator
  - feat--swimlane-view
  - feat--new-ticket-form-workstream
  - feat--done-toggle
depends-on-workstreams: []
tags: [kanban, ui]
---

# Workstream UI

## Goal

Add full workstream support to the kanban board web viewer, enabling progress tracking, blocking visibility, and a dedicated swimlane view.

## Scope

**Included:**
- Top bar workstream ribbon with progress chips
- Swimlane view (third view option)
- Workstream badges and blocking indicators on cards
- Workstream field in new ticket form
- Done toggle to show/hide completed work
- API endpoints and enhancements

**Excluded:**
- Drag-and-drop ticket movement
- Workstream creation/editing via UI (markdown files only)
- Real-time updates (manual refresh)

## Success Criteria

- [ ] Workstream ribbon displays all workstreams with progress
- [ ] Clicking ribbon chip filters board to that workstream
- [ ] Swimlane view shows workstreams as horizontal lanes
- [ ] Blocked tickets show red badge with hover tooltip
- [ ] New tickets can be assigned to a workstream
- [ ] Done toggle shows/hides completed work across all views

## Notes

Design doc: `docs/plans/2026-02-04-kanban-workstream-ui-design.md`
