---
type: feature
project: dot-skills
created: 2026-02-04
priority: medium
session:
git-ref: 56f92ca
branch:
workstream: workstream-ui
depends-on:
  - feat--tickets-api-enhancements
depends-on-workstreams: []
tags: [ui]
---

# Add workstream badge to cards

## Description

Add a small workstream tag to ticket cards in board view, showing which workstream the ticket belongs to.

## Acceptance Criteria

- [x] Cards show workstream tag below title (link icon + name)
- [x] Only shown if ticket has a workstream
- [x] Muted gray styling
- [x] Clicking tag filters board to that workstream
- [x] Table view has new "Workstream" column

## Context

Helps users see workstream membership at a glance when viewing the full board, not just in the ribbon or swimlane view.

## Test Plan

- Verify badge renders when workstream set
- Verify badge hidden when no workstream
- Test click to filter
- Verify table column displays correctly

## Notes

Card layout:
```
┌─────────────────────────────┐
│ [feature]  ●                │
│ Add voice modulation        │
│ 🔗 voice-extraction         │  ← new
│ 2025-01-15                  │
└─────────────────────────────┘
```
