---
title: Plugin Structure
description: The anatomy of a dot-skills plugin and how its files are organized.
---

This reference documents the full directory layout of the dot-skills repository and explains every component inside the `kanban-skill` plugin.

## Repository Layout

```
dot-skills/
├── CLAUDE.md              # Project instructions for Claude Code
├── README.md              # Repository overview
├── plugins/               # Claude Code plugins
│   └── kanban-skill/      # The kanban board plugin
├── kanban/                # Data layer (ticket files, workstreams, reviews)
│   ├── todo/
│   ├── in-progress/
│   ├── ready-to-review/
│   ├── done/
│   ├── reviews/
│   └── workstreams/
├── docs/                  # Design documents and notes
└── site/                  # Astro Starlight documentation site
```

| Directory | Purpose |
|-----------|---------|
| `plugins/` | Contains Claude Code plugins installed into the project |
| `kanban/` | Markdown ticket files organized by status column |
| `docs/` | Design documents and architectural notes |
| `site/` | This documentation site (Astro Starlight) |
| `CLAUDE.md` | Project-level instructions that Claude Code reads automatically |

## Plugin Directory

The `kanban-skill` plugin lives at `plugins/kanban-skill/` and follows a standard Claude Code plugin structure with four top-level directories:

```
plugins/kanban-skill/
├── commands/
│   └── serve.md                # /serve slash command
├── hooks/
│   ├── hooks.json              # Hook configuration
│   ├── check-review-files.sh   # Stop hook: enforce review files
│   └── stop-server-on-exit.sh  # SessionEnd hook: kill server
├── skills/
│   ├── kanban-tracker/
│   │   └── SKILL.md            # Board conventions and ticket format
│   └── ticket-picker/
│       └── SKILL.md            # Ticket selection algorithm
└── server/
    ├── index.ts                # HTTP server entry point
    ├── api.ts                  # API routes and business logic (~459 lines)
    ├── api.test.ts             # API test suite
    ├── git.ts                  # Git auto-commit helper
    ├── package.json            # Bun dependencies
    └── static/
        ├── index.html          # Single-page app shell
        ├── styles.css          # Board, table, swimlane styles
        └── js/
            ├── app.js          # Main application entry
            ├── board.js        # Kanban board view
            ├── table.js        # Table view
            ├── swimlane.js     # Swimlane (workstream) view
            ├── editor.js       # Ticket editor
            ├── workstream.js   # Workstream management
            └── utils.js        # Shared utilities
```

## Commands

Commands define slash commands that users can invoke in Claude Code. Each command is a Markdown file with YAML frontmatter.

### `serve.md`

The `/serve` command starts the kanban board web viewer.

**Frontmatter fields:**

| Field | Value | Purpose |
|-------|-------|---------|
| `name` | `serve` | The slash command name (invoked as `/serve`) |
| `description` | Start the kanban board web viewer | Shown in command listings |
| `allowed-tools` | `[Bash]` | Tools Claude is permitted to use when executing this command |

**What it does:**

1. Checks that Bun is installed
2. Starts the HTTP server in the background, setting `KANBAN_ROOT` to the project directory
3. Opens `http://localhost:3333` in the browser
4. Informs the user the server will auto-stop when the session ends

The command uses two environment variables provided by Claude Code:
- `CLAUDE_PLUGIN_ROOT` -- resolves to the `plugins/kanban-skill/` directory
- `CLAUDE_PROJECT_DIR` -- resolves to the root of the project where Claude Code is running

## Skills

Skills are Markdown files that provide persistent context to Claude Code. Unlike commands, skills are not invoked directly -- Claude loads them automatically when their domain is relevant. Each skill is a `SKILL.md` file inside a named directory under `skills/`.

**Common frontmatter fields:**

| Field | Purpose |
|-------|---------|
| `name` | Skill identifier |
| `description` | When this skill applies (Claude uses this to decide relevance) |
| `allowed-tools` | Tools Claude can use when this skill is active |

### kanban-tracker

**Location:** `skills/kanban-tracker/SKILL.md`

The kanban-tracker skill teaches Claude the full set of board conventions:

- **Directory structure** -- the four status columns (`todo/`, `in-progress/`, `ready-to-review/`, `done/`) plus `reviews/` and `workstreams/`
- **Ticket file format** -- YAML frontmatter schema, body template, naming conventions (`<type>--<slug>.md`)
- **Workstream format** -- how workstreams group tickets, frontmatter fields, status derivation rules
- **Blocking logic** -- three blocking conditions: ticket dependencies, workstream dependencies, and workstream ordering
- **Review file format** -- required structure for review documents
- **Workflow rules** -- TDD requirements for feature/bug tickets, spike workflow, session start/end procedures
- **Board rules** -- one file per item, move files to change status, never delete tickets

This skill is active whenever Claude interacts with the kanban board -- creating tickets, moving them between columns, or reading board state.

### ticket-picker

**Location:** `skills/ticket-picker/SKILL.md`

The ticket-picker skill defines the algorithm for selecting the next ticket to work on. It activates when the user says things like "pick up the next ticket" or "start the next feature ticket."

The selection algorithm works in seven steps:

1. **Read** all tickets in `kanban/todo/` and all workstreams
2. **Filter** by user intent (type, priority, tag, or workstream)
3. **Exclude** blocked tickets (dependency checks, workstream ordering)
4. **Sort** by workstream priority, then ticket priority, then workstream order, then creation date
5. **Pick** the top ticket
6. **Move** it to `in-progress/`
7. **Begin work** following the appropriate TDD workflow for the ticket type

The skill also defines edge case handling: empty backlogs, all tickets blocked, user specifying a ticket by name, and workstream-level blocking.

For more on how blocking works, see the [Kanban Board guide](/dot-skills/guides/kanban-board/).

## Hooks

Hooks are shell scripts that run automatically in response to Claude Code lifecycle events. They are configured in `hooks.json` at the plugin root.

### hooks.json Structure

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/check-review-files.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/stop-server-on-exit.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

| Field | Purpose |
|-------|---------|
| Event key (`Stop`, `SessionEnd`) | The lifecycle event that triggers the hook |
| `matcher` | Pattern for which contexts trigger the hook (`*` means all) |
| `type` | Hook type (`command` runs a shell command) |
| `command` | The shell command to execute |
| `timeout` | Maximum execution time in seconds |

### Stop Hook: check-review-files.sh

**Trigger:** Runs every time Claude attempts to stop (end a response turn).

**Purpose:** Enforces the rule that every ticket in `ready-to-review/` must have a corresponding review file in `reviews/`.

**Behavior:**

- Scans `kanban/ready-to-review/*.md` for ticket files
- Checks `kanban/reviews/` for a matching file with the same name
- If all review files exist: exits with code `0` (Claude can stop)
- If any are missing: exits with code `2` and writes a blocking message to stderr listing the missing files and the review template

This prevents Claude from ending a session with incomplete review documentation.

### SessionEnd Hook: stop-server-on-exit.sh

**Trigger:** Runs when the Claude Code session ends.

**Purpose:** Cleans up the kanban web server process so it does not persist after the session.

**Behavior:**

1. Looks for a `.kanban-server.pid` file in the server directory or current directory
2. If found, reads the PID and sends a kill signal
3. If no PID file exists, falls back to `pkill -f "kanban-skill/server"`
4. Removes the PID file after cleanup

## Server

The web server is a Bun + TypeScript application that provides a browser-based UI for the kanban board. It has no build step -- Bun runs the TypeScript files directly.

### index.ts -- Entry Point

The server entry point at `server/index.ts` uses `Bun.serve()` to create an HTTP server with three responsibilities:

1. **Root route** -- serves `static/index.html` for `/` and `/index.html`
2. **API routing** -- delegates any request under `/api/` to the `handleApi` function from `api.ts`
3. **Static files** -- serves CSS, JS, and JSON files from the `static/` directory with correct MIME types

Configuration is via environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `KANBAN_ROOT` | `process.cwd()` | Path to the project root containing the `kanban/` directory |
| `PORT` | `3333` | HTTP server listen port |

### api.ts -- API Routes

The API module (~459 lines) handles all server-side logic:

- **Ticket CRUD** -- read, create, update, and move tickets between columns
- **YAML frontmatter parsing** -- extracts structured metadata from ticket markdown files
- **Blocking computation** -- evaluates ticket and workstream dependencies to determine blocked status
- **Workstream management** -- reads and serves workstream data
- **SSE (Server-Sent Events)** -- pushes real-time updates to connected browser clients

For the full list of API endpoints, see the [API Reference](/dot-skills/guides/api-reference/).

### git.ts -- Auto-Commit Helper

The git module provides a `gitCommit` function that automatically stages and commits ticket file changes:

```typescript
gitCommit(filepath: string, action: "create" | "update"): Promise<GitResult>
```

- Stages the file with `git add`
- Commits with a message in the format `kanban: <action> <filename>`
- Returns a `GitResult` with `success` status and optional `error` message
- Failures are logged as warnings but do not block the API operation

### static/ -- Frontend

The frontend is a single-page application built with vanilla HTML, CSS, and JavaScript (no framework, no bundler). It provides three views:

| File | View | Description |
|------|------|-------------|
| `board.js` | Board | Traditional kanban columns (todo, in-progress, ready-to-review, done) |
| `table.js` | Table | Tabular listing of all tickets with sorting and filtering |
| `swimlane.js` | Swimlane | Tickets grouped by workstream |
| `editor.js` | Editor | Inline ticket editor for creating and updating tickets |
| `workstream.js` | Workstreams | Workstream management and progress tracking |
| `app.js` | -- | Application shell, view routing, SSE connection |
| `utils.js` | -- | Shared helper functions |

## How Components Work Together

The four plugin directories serve complementary roles in the system:

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code Session                   │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Commands │  │    Skills    │  │      Hooks       │  │
│  │          │  │              │  │                  │  │
│  │ /serve   │  │ kanban-      │  │ Stop: enforce    │  │
│  │ starts   │  │ tracker:     │  │ review files     │  │
│  │ the web  │  │ teaches      │  │                  │  │
│  │ server   │  │ board rules  │  │ SessionEnd:      │  │
│  │          │  │              │  │ stop server      │  │
│  │          │  │ ticket-      │  │                  │  │
│  │          │  │ picker:      │  │                  │  │
│  │          │  │ selects next │  │                  │  │
│  │          │  │ ticket       │  │                  │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
│       │               │                   │             │
└───────┼───────────────┼───────────────────┼─────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌──────────────┐ ┌─────────────┐  ┌──────────────────┐
│    Server    │ │  kanban/    │  │  kanban/reviews/ │
│ (web UI at   │ │  (ticket   │  │  (review files   │
│  :3333)      │ │   files)   │  │   enforced by    │
│              │ │            │  │   stop hook)     │
└──────────────┘ └─────────────┘  └──────────────────┘
```

**Skills give Claude knowledge.** The kanban-tracker skill teaches Claude how the board works -- file formats, naming conventions, workflow rules. The ticket-picker skill provides the algorithm for choosing what to work on next. These are always-available context, not actions.

**Commands trigger actions.** The `/serve` command is a user-initiated action that starts the web server. Commands have explicit `allowed-tools` that scope what Claude can do during execution.

**Hooks enforce rules.** The stop hook prevents Claude from ending a session without completing review documentation. The session-end hook cleans up server processes. Hooks run automatically -- users do not invoke them.

**The server provides a web UI.** It reads the same `kanban/` directory that Claude reads and writes, giving humans a visual interface to the board. The server is stateless -- all data lives in the markdown files on disk.
