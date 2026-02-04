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
  - feat--workstreams-api-endpoint
depends-on-workstreams: []
tags: [ui]
---

# Add workstream field to new ticket form

## Description

Add a workstream dropdown to the new ticket creation form, allowing users to assign tickets to a workstream when creating them.

## Acceptance Criteria

- [ ] New "Workstream" dropdown field in form
- [ ] Populated from /api/workstreams endpoint
- [ ] Optional field, defaults to "None"
- [ ] Selected workstream added to ticket frontmatter
- [ ] Field appears between Priority and Create button

## Context

Users should be able to assign tickets to workstreams from the UI, not just by editing markdown.

## Test Plan

- Verify dropdown populates from API
- Test creating ticket with workstream
- Test creating ticket without workstream
- Verify frontmatter includes workstream field

## Notes

Form layout:
```
Type:       [Feature ▼]
Title:      [________________]
Priority:   [Medium ▼]
Workstream: [-- None -- ▼]     ← new

[Create Ticket]
```
