# Review: Add blocking indicator to cards

**Work Item:** [feat--card-blocking-indicator](../ready-to-review/feat--card-blocking-indicator.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added a red "Blocked" badge to cards and table view for tickets that have blockers. The badge shows inline with the type badge on cards, and hovering displays a tooltip listing all blockers (one per line). Table view has a new "Blocked" column showing the badge or empty.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/static/index.html` | Added blocked badge CSS, updated renderCard() to show badge with tooltip, updated table header and renderTable() to include Blocked column |

## Changes Made

### CSS Additions (lines 144-188)
- `.blocked-badge` - Red badge styling with `background: #fee2e2`, `color: #dc2626`
- `.blocked-tooltip` - Dark tooltip with multi-line support
- `.blocked-tooltip::before` - Arrow pointer for tooltip

### Card Rendering (renderCard function)
- Check if `ticket.blockedBy` array is non-empty
- If blocked, render badge with tooltip containing "Blocked by:\n" + blockers joined by newlines

### Table View
- Added "Blocked" column header (between Column and Type)
- Added blocked status cell in each row (badge if blocked, `-` if not)
- Updated colspan from 5 to 7

## How to Verify

### Prerequisites

- Bun installed
- Kanban server running: `KANBAN_ROOT=/path/to/kanban bun run plugins/kanban-skill/server/index.ts`

### Steps

1. Open `http://localhost:3333` in browser
2. Look for tickets that have blockedBy dependencies
3. Verify:
   - Red "BLOCKED" badge appears inline with type badge
   - Hovering shows tooltip with "Blocked by:" header and blocker list
   - Switching to Table view shows Blocked column

### Expected Results

- Badge appears only on tickets with non-empty `blockedBy` array
- Badge hidden when `blockedBy` is empty or undefined
- Tooltip shows each blocker on separate line
- Badge styling matches spec: red background (#fee2e2), red text (#dc2626)
- Table view shows "Blocked" column with badge or empty

## Risks / Things to Watch

- None - UI-only change, no API modifications

## PR Notes

Add visual blocking indicator to kanban cards and table view. Users can now immediately see which tickets are blocked and what they're blocked by via hover tooltip.
