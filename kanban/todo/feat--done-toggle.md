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
  - feat--swimlane-view
depends-on-workstreams: []
tags: [ui]
---

# Add done toggle

## Description

Add a toggle button to show/hide completed work across all views.

## Acceptance Criteria

- [ ] Toggle button in header: "Show Done"
- [ ] Off by default (empty circle indicator)
- [ ] On state: filled circle, highlighted button
- [ ] State persists in localStorage
- [ ] Board view: fourth "Done" column appears when on
- [ ] Table view: includes done tickets when on
- [ ] Swimlane view: Done column shows cards when on, just count when off
- [ ] Uses `?includeDone=true` API param

## Context

Users often don't need to see completed work, but sometimes want to review what's been done. Toggle provides flexibility.

## Test Plan

- Verify toggle appears
- Test on/off states
- Test localStorage persistence
- Verify board view done column
- Verify table view includes/excludes done
- Verify swimlane done behavior

## Notes

Header layout:
```
[Board] [Table] [Workstreams]          [Show Done ○]
```
