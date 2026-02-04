# Review: Add workstream ribbon to header

**Work Item:** [feat--workstream-ribbon](../ready-to-review/feat--workstream-ribbon.md)
**Branch:** main
**Date:** 2026-02-04

## Summary

Added a horizontal workstream ribbon below the header that displays progress chips for each workstream. Each chip shows the workstream name, a visual progress bar, and completion fraction (e.g., "3/5"). Users can click a chip to filter the board to that workstream's tickets, and click again to clear the filter.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/kanban-skill/server/static/index.html` | Added workstream ribbon HTML, CSS styles, and JavaScript for fetching workstreams, rendering chips, filtering board, and handling overflow |

## Implementation Details

### CSS Additions
- `.workstream-ribbon` - Light gray background (#f3f4f6), 56px height, sticky positioning
- `.workstream-chip` - White background with shadow, border highlighting on active state
- `.workstream-progress-bar` - 60px wide progress visualization
- Fade indicators for horizontal overflow (gradient overlays)
- Status icons for completed (green checkmark) and blocked (orange warning)

### JavaScript Functions
- `loadWorkstreams()` - Fetches from `/api/workstreams` endpoint
- `renderWorkstreamRibbon()` - Creates chips with name, progress bar, fraction
- `toggleWorkstreamFilter()` - Click handler for filtering toggle
- `filterBoardByWorkstream()` - Shows/hides cards based on workstream's ticket list
- `updateColumnCounts()` - Updates column count badges when filtered
- `updateOverflowIndicators()` - Adds/removes fade classes based on scroll position

## How to Verify

### Prerequisites

- Bun installed
- At least one workstream defined in `kanban/workstreams/`

### Steps

1. Start the kanban server: `/serve`
2. Open http://localhost:3333 in a browser
3. Verify the ribbon appears below the header
4. Verify workstream chips display with name, progress bar, and fraction
5. Click a chip - board should filter to show only that workstream's tickets
6. Click the same chip again - filter should clear, showing all tickets
7. Verify active chip has blue border highlight
8. Test horizontal scroll if many workstreams exist

### Expected Results

- Ribbon displays below header with light gray background
- Each workstream shows as a chip: `Name [####----] 3/5`
- Completed workstreams show green checkmark before name
- Blocked workstreams show orange warning icon before name
- Clicking chip highlights it and filters the board
- Clicking again removes highlight and shows all tickets
- Column counts update to reflect visible cards only
- If no workstreams defined, shows "No workstreams defined" message

## Risks / Things to Watch

- Filter state is not persisted across page reloads
- Column counts show filtered counts, may confuse users expecting total counts

## PR Notes

Added workstream ribbon UI for quick progress tracking and board filtering.

### How to Verify

1. Start server: `/serve`
2. Open http://localhost:3333
3. Verify ribbon displays below header with workstream chips
4. Click chip to filter, click again to clear

### Features

- Progress bar visualization for each workstream
- Click-to-filter board by workstream
- Status icons for completed/blocked workstreams
- Horizontal scroll with fade indicators for overflow

Full review: [link to review file]
