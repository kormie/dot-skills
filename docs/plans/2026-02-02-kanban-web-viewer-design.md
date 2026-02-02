# Kanban Web Viewer Plugin Design

**Date:** 2026-02-02
**Status:** Draft

## Overview

A Claude Code plugin that serves a web-based kanban board viewer. The board reads/writes markdown files directly from the `kanban/` directory structure and commits each change to git.

## Requirements

- Quick visual status check of the board without opening files
- Create new tickets through the web UI
- Edit existing tickets through the web UI
- Manual invocation only (no automatic Claude triggering)
- Git commit on every save for traceability

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (localhost:3333)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    Todo     │  │ In Progress │  │ Ready to Review │  │
│  │   [card]    │  │   [card]    │  │     [card]      │  │
│  │   [card]    │  │             │  │                 │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                         │                                │
│              [+ New Ticket]  [Toggle: Table View]        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Bun HTTP Server                        │
│   /api/tickets      GET    → list all tickets           │
│   /api/ticket/:id   GET    → read ticket markdown       │
│   /api/ticket/:id   PUT    → write + git commit         │
│   /api/ticket       POST   → create + git commit        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  kanban/ directory                       │
│   todo/              in-progress/        ready-to-review/│
│   reviews/           README.md                           │
└─────────────────────────────────────────────────────────┘
```

## Plugin Structure

```
kanban-skill/
├── plugin.json                 # Plugin manifest
├── commands/
│   └── serve.md                # /kanban-serve slash command
├── hooks/
│   └── stop-server-on-exit.sh  # SessionEnd hook to kill the server
├── skills/
│   ├── kanban-tracker/
│   │   └── SKILL.md            # Ported from Atelier (board management)
│   └── ticket-picker/
│       └── SKILL.md            # Ported from Atelier (selection algorithm)
├── server/
│   ├── index.ts                # Bun HTTP server entry point
│   ├── api.ts                  # API route handlers
│   ├── git.ts                  # Git commit helper functions
│   └── static/
│       └── index.html          # Single-file UI (JS/CSS embedded)
└── README.md                   # Plugin documentation
```

## Slash Command Behavior

The `/kanban-serve` command will:

1. Detect the `kanban/` directory path (current repo root)
2. Start the Bun server as a background process
3. Auto-open the browser to `http://localhost:3333`
4. Return control to Claude immediately
5. Provide instructions for stopping: `pkill -f "kanban-skill/server"`

A `SessionEnd` hook automatically kills the server when the Claude session ends.

## API Design

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Serve the single-page HTML UI |
| `GET` | `/api/tickets` | List all tickets across all columns |
| `GET` | `/api/ticket/:column/:filename` | Get single ticket content (raw markdown) |
| `PUT` | `/api/ticket/:column/:filename` | Update ticket, git commit |
| `POST` | `/api/tickets` | Create new ticket in `todo/`, git commit |

### GET /api/tickets response

```json
{
  "todo": [
    { "filename": "feat--add-auth.md", "title": "Add Auth", "type": "feature", "priority": "high", "created": "2025-01-15" }
  ],
  "in-progress": [...],
  "ready-to-review": [...]
}
```

### POST /api/tickets body

```json
{
  "type": "feature",
  "title": "My New Ticket",
  "priority": "medium",
  "description": "...",
  "acceptance_criteria": ["criterion 1", "criterion 2"]
}
```

Server generates the filename (`feat--my-new-ticket.md`), fills the template, writes the file, and commits.

## UI Design

### Views

**1. Board View (default)**
- Three columns: Todo, In Progress, Ready to Review
- Each card shows: type badge, title, priority indicator
- Click card → opens editor modal
- "+ New Ticket" button at top

**2. Table View (toggle)**
- Rows per ticket, columns: Status | Type | Priority | Title | Created
- Click row → opens editor modal
- Same "+ New Ticket" button

**3. Editor Modal**
- Split pane: left = textarea with raw markdown, right = rendered preview
- Preview updates on keystroke (debounced ~300ms)
- "Save" button → PUT request → closes modal, refreshes board
- "Cancel" button → discards changes, closes modal
- For new tickets: structured form first (type, title, priority), then opens editor with pre-filled template

### Styling

- Minimal CSS, clean look
- Color-coded type badges (feature=blue, bug=red, test=green, etc.)
- Priority shown as subtle indicator (high=red dot, medium=yellow, low=gray)

### Libraries

- `marked.js` for markdown → HTML rendering (embedded via CDN)
- No framework — vanilla JS with DOM manipulation

## Git Integration

Each save operation:

```typescript
async function saveTicket(column: string, filename: string, content: string) {
  const filepath = `kanban/${column}/${filename}`;

  // Write file
  await Bun.write(filepath, content);

  // Stage and commit
  await $`git add ${filepath}`;
  await $`git commit -m "kanban: update ${filename}"`;
}
```

Commit messages:
- **Update:** `kanban: update feat--add-auth.md`
- **Create:** `kanban: create feat--add-auth.md`

If `git commit` fails (nothing to commit, not a repo), log warning but don't fail the save.

## Out of Scope (YAGNI)

- Drag-and-drop moving cards between columns
- Filtering/search
- Authentication
- Multiple board support
- Metrics/velocity tracking

## Implementation Plan

1. Set up plugin structure and manifest
2. Port skills from Atelier
3. Implement Bun server with API routes
4. Build single-page HTML UI
5. Add SessionEnd hook
6. Create slash command
7. Test end-to-end
