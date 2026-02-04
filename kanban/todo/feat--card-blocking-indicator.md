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

# Add blocking indicator to cards

## Description

Add a red "Blocked" badge to tickets that are blocked, with a hover tooltip showing what they're blocked by.

## Acceptance Criteria

- [ ] Blocked tickets show red badge inline with type badge
- [ ] Hover tooltip shows blocker(s)
- [ ] Multiple blockers on separate lines in tooltip
- [ ] Badge styling: red background (#fee2e2), red text (#dc2626)
- [ ] Table view has new "Status" column (Blocked or blank)

## Context

Critical for understanding which tickets can be worked on. Users need to know at a glance what's blocked and why.

## Test Plan

- Verify badge appears when blockedBy is non-empty
- Verify badge hidden when not blocked
- Test tooltip content with single blocker
- Test tooltip with multiple blockers
- Verify table column displays correctly

## Notes

Card layout:
```
┌─────────────────────────────┐
│ [feature]  ●   🔴 Blocked   │
│ Add voice modulation        │
│ 🔗 voice-extraction         │
│ 2025-01-15                  │
└─────────────────────────────┘
```

Tooltip: "Blocked by: feat--base-voice-step"
