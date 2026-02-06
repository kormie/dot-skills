---
title: Kanban Board
description: How to use the built-in kanban board to track work alongside your code.
---

The kanban board is the central feature of dot-skills. It is a **file-based** work tracker -- every ticket is a Markdown file with YAML frontmatter, stored in plain directories inside your repository. There is no database. Status changes are file moves. Everything is version-controlled by Git.

## Board Structure

The board lives in a `kanban/` directory at your project root. Status columns are subdirectories:

```
kanban/
├── README.md              # Board overview and conventions
├── workstreams/           # Workstream definitions
│   └── voice-extraction.md
├── todo/                  # Not started
│   ├── feat--login.md
│   └── bug--crash.md
├── in-progress/           # Actively being worked on
│   └── refactor--extract-module.md
├── ready-to-review/       # Complete, awaiting human review
│   └── feat--search.md
├── done/                  # Finished
│   └── infra--ci-pipeline.md
└── reviews/               # Review guides for completed tickets
    └── feat--search.md
```

### The Four Columns

| Directory | Status | Meaning |
|-----------|--------|---------|
| `kanban/todo/` | Todo | Work not yet started |
| `kanban/in-progress/` | In Progress | Actively being worked on |
| `kanban/ready-to-review/` | Ready to Review | Complete, awaiting human review |
| `kanban/done/` | Done | Finished and reviewed |

To change a ticket's status, **move the file** to the appropriate directory. For example, to start working on a ticket:

```bash
mv kanban/todo/feat--login.md kanban/in-progress/feat--login.md
```

:::caution
Never delete ticket files. Always move them between directories to track status changes.
:::

## Ticket Format

Each ticket is a Markdown file named with a type-prefixed slug: `<type>--<slug>.md`. The double-dash (`--`) separates the type prefix from the descriptive slug.

**Type prefixes:** `feat`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike`

A minimal ticket looks like:

```markdown
---
type: feature
project: my-app
created: 2025-01-15
priority: medium
session:
git-ref:
branch:
depends-on: []
tags: []
---

# Add User Login

## Description

Implement username/password login flow.

## Acceptance Criteria

- [ ] Users can log in with email and password
- [ ] Invalid credentials show an error message
```

For the full field reference and all frontmatter options, see the [Ticket Format reference](/dot-skills/reference/ticket-format/).

## Creating Tickets

There are two ways to create tickets:

### Via the Web Form

Click the **+ New Ticket** button in the web viewer header. Fill in the type, title, priority, and optionally assign a workstream. The server generates the file with proper frontmatter and places it in `kanban/todo/`.

### Manually

Create a `.md` file directly in `kanban/todo/` following the naming convention and frontmatter template above. This is what Claude Code does when using the kanban-tracker skill.

:::tip
When Claude Code creates tickets for you, it automatically fills in the `session`, `git-ref`, and `created` fields based on the current context.
:::

## Moving Tickets

Moving a ticket between columns is a file move:

```bash
# Start work on a ticket
mv kanban/todo/feat--login.md kanban/in-progress/feat--login.md

# Mark as ready for review
mv kanban/in-progress/feat--login.md kanban/ready-to-review/feat--login.md

# Mark as done after review
mv kanban/ready-to-review/feat--login.md kanban/done/feat--login.md
```

When moving a ticket, update its content too -- check off acceptance criteria, add notes about what was done, and update the `branch` field if relevant.

## Review Files

When a ticket moves to `ready-to-review/`, a matching review file **must** exist in `kanban/reviews/`. The review file shares the same filename as the ticket and is written for the human reviewer.

For example, when `feat--login.md` moves to `ready-to-review/`, the file `kanban/reviews/feat--login.md` must exist with verification steps, key files changed, and risks.

:::note
A Stop hook (`check-review-files.sh`) enforces this requirement. If a ticket is in `ready-to-review/` without a matching review file, the hook will flag it.
:::

## The Web Viewer

The kanban server provides a browser-based viewer at `http://localhost:3333` with three ways to visualize your board.

### Starting the Server

**From Claude Code** -- use the `/kanban-serve` slash command. It starts the server in the background, sets `KANBAN_ROOT` to your project directory, and opens the browser.

**Manually** -- run the server with Bun:

```bash
cd plugins/kanban-skill/server && KANBAN_ROOT=/path/to/your/project bun run index.ts
```

The `KANBAN_ROOT` environment variable tells the server where to find the `kanban/` directory. The port defaults to `3333` but can be changed with the `PORT` environment variable.

For full setup details, see the [Installation guide](/dot-skills/getting-started/installation/).

### Three Views

**Board View** -- the default columnar kanban layout. Each column (Todo, In Progress, Ready to Review) displays ticket cards showing type, priority, title, and workstream. Blocked tickets are visually distinguished. Toggle the Done column with the **Show Done** button.

**Table View** -- a flat table listing all tickets with sortable columns: status, blocked state, type, priority, title, workstream, and creation date. Useful for scanning the full backlog at a glance.

**Swimlane View** -- tickets grouped by workstream. Each swimlane shows one workstream with its tickets organized by status. Tickets not assigned to any workstream appear in their own lane. This is the best view for tracking workstream progress.

Switch between views using the **Board**, **Table**, and **Workstreams** toggle buttons in the header.

### Real-Time Updates

The web viewer subscribes to a Server-Sent Events (SSE) endpoint (`/api/events`). The server watches the `kanban/` directory for file changes and pushes refresh events to all connected browsers. When you or Claude Code moves a ticket, the board updates automatically -- no manual refresh needed.

### In-Browser Markdown Editor

Click any ticket card to open the built-in editor modal. The editor has a split-pane layout:

- **Left pane** -- a Markdown text editor for the raw ticket content
- **Right pane** -- a live-rendered preview of the Markdown

Edit the frontmatter, description, acceptance criteria, or notes directly in the browser. Click **Save** to write changes back to the file on disk. The save triggers a Git auto-commit.

## Git Auto-Commit

The server automatically commits ticket changes to Git. When you create or edit a ticket through the web viewer, the server:

1. Writes the file to disk
2. Stages the file with `git add`
3. Creates a commit with a message like `kanban: create feat--login.md` or `kanban: update feat--login.md`

This keeps your kanban history in the Git log alongside your code commits.

## Claude Code Integration

The kanban board integrates with Claude Code through three extension points:

### Skills

- **kanban-tracker** -- the core skill that teaches Claude how to maintain the board. It reads current state at session start, creates tickets in `kanban/todo/`, moves them between columns, and writes review files. Active throughout every session.
- **ticket-picker** -- a selection algorithm for choosing the next ticket to work on. Handles filtering by type, priority, workstream, and tag. Respects blocking rules and workstream ordering. Activated when you say things like "pick up the next ticket."

### Commands

- **/kanban-serve** -- starts the web server in the background and opens the browser. The server auto-stops when the Claude Code session ends.

### Hooks

- **Stop hook** (`check-review-files.sh`) -- runs when Claude stops and checks that every ticket in `ready-to-review/` has a matching review file in `kanban/reviews/`.
- **SessionEnd hook** (`stop-server-on-exit.sh`) -- automatically shuts down the kanban web server when the Claude Code session ends.

## Next Steps

- Learn about organizing related tickets in [Workstreams](/dot-skills/guides/workstreams/)
- See all available endpoints in the [API Reference](/dot-skills/guides/api-reference/)
- Review the full ticket schema in the [Ticket Format reference](/dot-skills/reference/ticket-format/)
