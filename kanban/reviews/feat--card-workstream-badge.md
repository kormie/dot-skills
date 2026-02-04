# Review: Add workstream badge to cards

**Work Item:** [feat--card-workstream-badge](../ready-to-review/feat--card-workstream-badge.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added a workstream badge to ticket cards in the board view. The badge displays below the card title with a link icon and the workstream name. Clicking the badge filters the board to show only tickets in that workstream. Also added a "Workstream" column to the table view.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/static/index.html` | Added CSS for card-workstream badge, updated renderCard() to show workstream tag, added click handler to filter by workstream, added Workstream column to table view |

## Implementation Details

### Board View - Card Workstream Badge
- Added `.card-workstream` CSS class with muted gray styling (#9ca3af)
- Badge only renders if `ticket.workstream` is truthy
- Uses Unicode link emoji (&#128279;) as icon
- Hover state changes color to blue (#4361ee)
- Click handler calls `toggleWorkstreamFilter()` with stopPropagation to prevent card selection

### Table View - Workstream Column
- Added "Workstream" header column between Title and Created
- Displays workstream name or "-" if not set
- Also added missing "Blocked" column data to table rows

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running with tickets that have workstream set

### Steps

1. Start the server:
   ```bash
   KANBAN_ROOT=./kanban bun run plugins/kanban-skill/server/index.ts
   ```

2. Open http://localhost:3333 in a browser

3. Board view tests:
   - Verify cards with workstream show badge below title
   - Verify cards without workstream do not show badge
   - Verify badge has muted gray color
   - Click badge - board should filter to that workstream
   - Click same workstream in ribbon to clear filter

4. Table view tests:
   - Click "Table" button
   - Verify "Workstream" column exists
   - Verify workstream values display correctly

### Expected Results

- Workstream badge appears on cards that have workstream set
- Badge hidden on cards without workstream
- Badge is muted gray, turns blue on hover
- Clicking badge filters board to that workstream
- Table view shows workstream column with correct values

## Risks / Things to Watch

- None - UI-only change, no API modifications

## PR Notes

Added workstream badge to kanban cards for at-a-glance workstream visibility.

### What's New
- Cards show workstream tag below title (link icon + name)
- Clicking tag filters board to that workstream
- Table view has new "Workstream" column

### How to Verify
1. Open kanban board at http://localhost:3333
2. Cards with workstream show badge below title
3. Click badge to filter by workstream
4. Switch to table view - Workstream column present

### Risks
- None - UI-only changes
