# Kanban Workstream UI Design

**Date:** 2026-02-04
**Status:** Approved
**Scope:** Full workstream support for kanban board web UI

## Overview

Enhance the kanban board web viewer to support workstreams with progress tracking, blocking indicators, and a dedicated swimlane view.

## Requirements

- Primary use case: Progress tracking (see how much of each workstream is done)
- Top bar ribbon showing workstream progress chips
- Dedicated "Workstreams" swimlane view
- Blocking indicators on tickets
- Workstream badges on cards
- Toggle to show/hide completed work

## Design

### 1. Top Bar Workstream Ribbon

A horizontal ribbon below the header containing one chip per workstream:

```
┌─────────────────────────────────┐
│ voice-extraction ████░░░░ 3/5  │
└─────────────────────────────────┘
```

**Chip contents:**
- Workstream name
- Mini progress bar (8 segments)
- Fraction (completed/total tickets)

**Behavior:**
- Click chip to filter board to that workstream
- Click again to clear filter
- Active filter gets highlighted border
- Completed workstreams show green checkmark
- Blocked workstreams show orange warning icon

**Styling:**
- Ribbon: light gray background (`#f3f4f6`), ~40px tall
- Chips: white background, subtle shadow
- Horizontal scroll with fade indicators on overflow

### 2. Workstreams Swimlane View

Third view option: **Board | Table | Workstreams**

```
┌────────────────────────────────────────────────────────────────────────┐
│ voice-extraction (high) ████████░░ 4/5                          [▼]  │
├──────────────┬──────────────┬──────────────┬──────────────────────────┤
│     TODO     │  IN PROGRESS │    REVIEW    │          DONE            │
├──────────────┼──────────────┼──────────────┼──────────────────────────┤
│ [ticket-5]   │ [ticket-3]   │ [ticket-2]   │ [ticket-1] [ticket-4]    │
│   🔒         │              │              │                          │
└──────────────┴──────────────┴──────────────┴──────────────────────────┘
```

**Swimlane contents:**
- Header: workstream name, priority badge, progress bar, collapse toggle
- Four columns: Todo, In Progress, Ready to Review, Done
- Compact ticket cards: type badge + title
- Blocked tickets show red "Blocked" badge

**Interactions:**
- Collapse toggle minimizes to header only
- Click ticket to open editor modal
- Lanes sorted by priority (high first), then alphabetically

### 3. Card Enhancements

**Workstream badge:**

```
┌─────────────────────────────┐
│ [feature]  ●                │
│ Add voice modulation        │
│ 🔗 voice-extraction         │  ← new
│ 2025-01-15                  │
└─────────────────────────────┘
```

- Link icon + workstream name in muted gray
- Only shown if ticket has workstream
- Click to filter board to that workstream

**Blocking indicator:**

```
┌─────────────────────────────┐
│ [feature]  ●   🔴 Blocked   │
│ Add voice modulation        │
│ 🔗 voice-extraction         │
│ 2025-01-15                  │
└─────────────────────────────┘
```

- Red badge inline with type
- Hover tooltip shows blocker(s): "Blocked by: feat--base-voice-step"
- Multiple blockers on separate lines
- Badge: red background (`#fee2e2`), red text (`#dc2626`)

**Table view:**
- New "Workstream" column
- New "Status" column (Blocked or blank)

### 4. New Ticket Form

Add workstream dropdown:

```
Type:       [Feature ▼]
Title:      [________________]
Priority:   [Medium ▼]
Workstream: [-- None -- ▼]     ← new
            [voice-extraction]
            [streaming-reorg]

[Create Ticket]
```

- Optional, defaults to "None"
- Populated from `/api/workstreams`
- Selected value added to ticket frontmatter

### 5. Done Toggle

Toggle button in header:

```
[Board] [Table] [Workstreams]          [Show Done ○]
```

- Off by default
- State persists in localStorage

**Behavior by view:**
- Board: fourth "Done" column appears
- Table: includes done tickets
- Swimlanes: Done column shows cards when on, just count when off

### 6. API Changes

**New endpoint: `GET /api/workstreams`**

```json
{
  "workstreams": [
    {
      "slug": "voice-extraction",
      "name": "Voice Extraction",
      "priority": "high",
      "status": "active",
      "progress": { "completed": 3, "total": 5 },
      "tickets": ["feat--base-voice", "feat--modulator"]
    }
  ]
}
```

**Enhanced `GET /api/tickets`:**
- Each ticket gains `workstream` and `blockedBy` fields
- `blockedBy`: array of blocking slugs (tickets or workstreams)
- New param: `?includeDone=true` to fetch done directory

**Blocking computed server-side:**
1. Check `depends-on` against ready-to-review/done
2. Check `depends-on-workstreams` completion
3. Check workstream predecessor completion (implicit ordering)

## Implementation

**Files to modify:**

| File | Changes |
|------|---------|
| `server/api.ts` | Add `/api/workstreams`, enhance ticket response |
| `server/static/index.html` | Ribbon, swimlane view, card updates, form, toggle |

**New helper functions:**
- `getWorkstreams(root)` - Parse workstreams, compute progress
- `computeBlockedBy(ticket, workstreams, root)` - Determine blockers
- `isTicketComplete(slug, root)` - Check ready-to-review/done

**Estimates:**
- API: ~150 lines
- HTML/JS: ~300 lines
- Total: ~450 lines

**Backwards compatible:** Boards without workstreams directory continue working; ribbon and swimlane show "No workstreams" message.
