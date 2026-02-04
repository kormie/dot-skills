# Review: Add done toggle

**Work Item:** [feat--done-toggle](../ready-to-review/feat--done-toggle.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added toggle button to show/hide completed work across all views. The toggle persists state in localStorage and affects Board, Table, and Swimlane views differently.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/static/index.html` | Added done toggle button with CSS styling, Done column in board, toggle logic with localStorage |

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running (`bun plugins/kanban-skill/server/index.ts`)
- Some tickets in the `kanban/done/` directory

### Steps

1. Open http://localhost:3333
2. Verify "Show Done" button with empty circle appears in header
3. Click the button - circle should fill, button turns green
4. Board view: Done column should appear
5. Click "Table" - done tickets should appear
6. Click "Workstreams" - done column shows ticket cards
7. Click toggle again to turn off
8. Board view: Done column should hide
9. Refresh page - toggle state should persist

### Expected Results

- Toggle button shows empty circle when off, filled when on
- Board view shows/hides Done column based on toggle
- Table view includes/excludes done tickets based on toggle
- Swimlane view shows cards when on, "X completed" count when off
- State persists across page refreshes via localStorage

## Risks / Things to Watch

- None - additive UI feature only

## PR Notes

Added "Show Done" toggle to kanban board header for showing/hiding completed tickets.

### How to Verify

1. Start server: `bun plugins/kanban-skill/server/index.ts`
2. Open http://localhost:3333
3. Toggle "Show Done" button to show/hide done tickets
4. Refresh to verify persistence

### Risks

- None
