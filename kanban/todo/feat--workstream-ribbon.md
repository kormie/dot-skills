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
tags: [ui]
---

# Add workstream ribbon to header

## Description

Add a horizontal ribbon below the header showing workstream progress chips. Each chip shows workstream name, progress bar, and completion fraction.

## Acceptance Criteria

- [ ] Ribbon displays below header
- [ ] One chip per workstream with name + progress bar + fraction
- [ ] Clicking chip filters board to that workstream
- [ ] Clicking again clears filter
- [ ] Active filter has highlighted border
- [ ] Completed workstreams show green checkmark
- [ ] Blocked workstreams show orange warning icon
- [ ] Horizontal scroll with fade indicators on overflow
- [ ] Empty state when no workstreams defined

## Context

Primary quick-glance progress tracking UI. Users should see at a glance how each workstream is progressing.

## Test Plan

- Verify chips render correctly
- Test click to filter
- Test click again to clear
- Test overflow scrolling
- Test empty state

## Notes

Chip design:
```
┌─────────────────────────────────┐
│ voice-extraction ████░░░░ 3/5  │
└─────────────────────────────────┘
```

Styling: light gray background (#f3f4f6), ~40px tall, chips white with subtle shadow.
