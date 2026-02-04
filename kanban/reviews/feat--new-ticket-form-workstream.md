# Review: Add workstream field to new ticket form

**Work Item:** [feat--new-ticket-form-workstream](../ready-to-review/feat--new-ticket-form-workstream.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added a workstream dropdown field to the new ticket creation form in the kanban board UI. The dropdown is populated from the `/api/workstreams` endpoint and allows users to optionally assign a workstream when creating new tickets. When a workstream is selected, it is included in the generated ticket frontmatter.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/static/index.html` | Added workstream dropdown HTML element, loadWorkstreamsForDropdown() function to fetch and populate options, updated form submit handler to include workstream in generated template |

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running (`/serve`)
- At least one workstream exists in `kanban/workstreams/`

### Steps

1. Start the kanban server: `/serve`
2. Open http://localhost:3333 in browser
3. Click "+ New Ticket" button
4. Verify "Workstream" dropdown appears between Priority and Create button
5. Verify dropdown contains "-- None --" as default plus workstream options from API
6. Create a ticket without selecting a workstream - verify no workstream field in frontmatter
7. Create a ticket with a workstream selected - verify workstream field appears in frontmatter

### Expected Results

- Workstream dropdown populated with options from `/api/workstreams`
- Default value is "-- None --"
- Template includes `workstream: <slug>` only when a workstream is selected

## Risks / Things to Watch

- Dropdown fetch happens on modal open - brief delay possible
- No error message shown if workstreams API fails (gracefully degrades to "-- None --" only)

## PR Notes

Added workstream dropdown to new ticket creation form.

### How to Verify

1. Start server: `/serve`
2. Click "+ New Ticket" and verify workstream dropdown appears
3. Create ticket with workstream selected and verify frontmatter

### Risks

- API fetch on modal open - minimal impact
