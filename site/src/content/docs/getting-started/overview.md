---
title: Overview
description: Introduction to dot-skills, a personal Claude Code plugin marketplace with a file-based kanban board for tracking work across sessions.
---

## What is dot-skills?

dot-skills is a personal Claude Code plugin marketplace. It provides a collection of plugins that extend Claude Code with new skills, commands, and hooks. The primary plugin shipped today is **kanban-skill**, a file-based kanban board with a Bun-powered web server for tracking work items across Claude Code sessions.

## The kanban-skill Plugin

kanban-skill gives you a fully functional kanban board where tickets are plain markdown files with YAML frontmatter. There is no database -- files are organized into directories by status, and moving a file between directories changes its status. A built-in web server provides a browser-based viewer for visualizing and managing the board.

### Key Features

- **Markdown tickets with YAML frontmatter** -- each ticket is a standalone `.md` file named with a type prefix and slug (e.g., `feat--login.md`, `bug--crash.md`). Metadata like priority, assignee, and dependencies live in the frontmatter.
- **Workstreams** -- group related tickets into logical streams with internal ordering. Workstream definitions live in `kanban/workstreams/` and define a recommended execution order for their tickets.
- **Blocking and dependency rules** -- tickets can depend on other tickets, on entire workstreams, or be implicitly blocked by their position within a workstream's ordered ticket list. The board surfaces these relationships visually.
- **Web viewer with three views** -- Board (column-based), Table (sortable list), and Swimlane (grouped by workstream). All views are served from a lightweight Bun + TypeScript server.
- **Git auto-commit** -- ticket creates, updates, and moves are automatically committed to Git, keeping your kanban state versioned alongside your code.
- **Real-time updates via SSE** -- Server-Sent Events push board changes to all connected browsers so the view stays current without manual refreshes.
- **In-browser markdown editor** -- edit ticket content directly in the web viewer with live preview.

### Board Structure

Tickets flow through four status columns, each backed by a directory:

```
kanban/
  workstreams/       # Workstream definitions
  todo/              # Not yet started
  in-progress/       # Actively being worked on
  ready-to-review/   # Complete, awaiting human review
  done/              # Finished and reviewed
  reviews/           # Review files required for ready-to-review tickets
```

## Claude Code Integration

kanban-skill integrates with Claude Code through three extension points:

| Component | Name | Purpose |
|-----------|------|---------|
| **Command** | `serve` | Start the web viewer at `localhost:3333` via `/kanban-serve` |
| **Skill** | `kanban-tracker` | Provides board conventions, ticket format, and workflow rules to Claude automatically |
| **Skill** | `ticket-picker` | Selects the next ticket to work on based on priority, blocking state, and workstream order |
| **Hook (Stop)** | `check-review-files` | Enforces review file creation when tickets move to ready-to-review |
| **Hook (SessionEnd)** | `stop-server-on-exit` | Kills the web viewer server when the Claude session ends |

Skills give Claude contextual knowledge about how the board works. Commands let you trigger actions like starting the server. Hooks enforce workflow rules automatically -- for example, the Stop hook ensures you never move a ticket to review without writing a corresponding review file.

## Next Steps

See the [Installation guide](/getting-started/installation/) to set up dot-skills and start using the kanban board.
