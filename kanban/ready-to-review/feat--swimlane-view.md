---
type: feature
project: dot-skills
created: 2026-02-04
priority: high
session:
git-ref: fce3f0b
branch:
workstream: workstream-ui
depends-on:
  - feat--workstream-ribbon
  - feat--card-blocking-indicator
depends-on-workstreams: []
tags: [ui]
---

# Add workstreams swimlane view

## Description

Add a third view option (Board | Table | Workstreams) showing each workstream as a horizontal swimlane with tickets flowing left-to-right by status.

## Acceptance Criteria

- [x] New "Workstreams" button in view toggle
- [x] Each workstream renders as a horizontal lane
- [x] Lane header: name, priority badge, progress bar, collapse toggle
- [x] Four columns per lane: Todo, In Progress, Ready to Review, Done
- [x] Compact ticket cards: type badge + title
- [x] Blocked tickets show red badge
- [x] Click collapse toggle to minimize lane to header only
- [x] Click ticket to open editor modal
- [x] Lanes sorted by priority (high first), then alphabetically
- [x] Empty state: "No workstreams defined"

## Context

Dedicated view for deep-diving into workstream progress. Shows the full pipeline for each workstream.

## Test Plan

- Verify view toggle works
- Test lane rendering with multiple workstreams
- Test collapse/expand
- Test ticket click opens editor
- Test sorting
- Test empty state

## Notes

Layout:
```
┌────────────────────────────────────────────────────────────────────────┐
│ voice-extraction (high) ████████░░ 4/5                          [▼]  │
├──────────────┬──────────────┬──────────────┬──────────────────────────┤
│     TODO     │  IN PROGRESS │    REVIEW    │          DONE            │
├──────────────┼──────────────┼──────────────┼──────────────────────────┤
│ [ticket-5]   │ [ticket-3]   │ [ticket-2]   │ [ticket-1] [ticket-4]    │
└──────────────┴──────────────┴──────────────┴──────────────────────────┘
```
