# dot-skills

A personal Claude Code plugin marketplace. Currently ships the **kanban-skill** plugin for file-based kanban board management.

## Installation

Register this marketplace by adding to `~/.claude/plugins/known_marketplaces.json`:

```json
{
  "dot-skills": {
    "source": {
      "source": "github",
      "repo": "kormie/dot-skills"
    },
    "installLocation": "~/.claude/plugins/marketplaces/dot-skills",
    "autoUpdate": true
  }
}
```

Then enable plugins in Claude Code settings.

## kanban-skill

Kanban board management with a web viewer for tracking work across Claude Code sessions. Tickets are plain markdown files with YAML frontmatter, organized into directories by status.

### Features

- **File-based kanban board** -- markdown tickets with YAML frontmatter, moved between directories to change status
- **Web viewer with 3 views** -- Board (columns), Table (sortable list), and Swimlane (grouped by workstream)
- **Workstream grouping** -- logical ticket groupings with progress tracking and recommended execution order
- **Blocking dependency visualization** -- three dependency types: ticket-to-ticket, workstream, and workstream ordering
- **Real-time updates** -- Server-Sent Events push board changes to all connected browsers
- **Markdown editor** -- in-browser ticket editing with live preview
- **Git auto-commit** -- ticket creates and updates are automatically committed
- **New ticket creation** -- form-based ticket creation with workstream assignment

### Quick Start

- `/kanban-serve` -- start the web viewer at `localhost:3333` (requires [Bun](https://bun.sh))
- `/ticket-picker` -- select the next ticket to work on based on priority, dependencies, and workstream order
- The `kanban-tracker` skill provides board conventions to Claude automatically

### Plugin Components

| Component | Name | Description |
|-----------|------|-------------|
| Command | `serve` | Start the web viewer at `localhost:3333` |
| Skill | `kanban-tracker` | Board structure, ticket format, and workflow conventions |
| Skill | `ticket-picker` | Ticket selection algorithm based on priority and blocking state |
| Hook (Stop) | `check-review-files` | Enforce review file creation when tickets move to ready-to-review |
| Hook (SessionEnd) | `stop-server-on-exit` | Kill the web viewer server when the Claude session ends |
| Server | Bun + TypeScript | API and SSE endpoint at `localhost:3333` |

### Board Structure

```
kanban/
├── workstreams/       # Workstream definitions (grouping + ordering)
├── todo/              # Not yet started
├── in-progress/       # Being worked on
├── ready-to-review/   # Complete, awaiting human review
├── done/              # Completed and reviewed
└── reviews/           # Human-readable review/verification guides
```

Tickets are named `<type>--<slug>.md` (e.g. `feat--add-sse-updates.md`). Supported types: `feature`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike`.
