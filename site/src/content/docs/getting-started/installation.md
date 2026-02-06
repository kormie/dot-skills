---
title: Installation
description: How to install dot-skills, register the plugin marketplace with Claude Code, and start the kanban web server.
---

## Prerequisites

Before setting up dot-skills, make sure you have the following installed:

- **Bun** -- the JavaScript runtime used by the kanban server. Install from [bun.sh](https://bun.sh).
- **Git** -- required for repository cloning and the auto-commit feature.
- **Claude Code CLI** -- the Claude Code command-line interface where plugins are loaded.

## Clone the Repository

```bash
git clone https://github.com/kormie/dot-skills.git
cd dot-skills
```

## Register the Plugin Marketplace

Add dot-skills as a known marketplace in your Claude Code configuration. Create or edit `~/.claude/plugins/known_marketplaces.json`:

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

Then enable plugins in your Claude Code settings. Once registered, the kanban-skill plugin and its skills, commands, and hooks will be available in all Claude Code sessions.

## Starting the Web Server

The kanban web server serves the board viewer at `localhost:3333`. Start it with:

```bash
cd plugins/kanban-skill/server && KANBAN_ROOT=$PWD/../../.. bun run index.ts
```

The `KANBAN_ROOT` environment variable tells the server where to find the `kanban/` directory. The command above sets it to the repository root, which is the standard layout.

Alternatively, use the `/kanban-serve` command inside a Claude Code session to start the server automatically.

## Running Tests

Run the test suite from the server directory:

```bash
cd plugins/kanban-skill/server && bun test
```

No build step is required. Tests run directly against the TypeScript source.

## Configuration

The server accepts two environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3333` | The port the web server listens on |
| `KANBAN_ROOT` | *(required)* | Absolute path to the directory containing the `kanban/` folder |

### Example with Custom Port

```bash
cd plugins/kanban-skill/server && PORT=8080 KANBAN_ROOT=$PWD/../../.. bun run index.ts
```

## Verifying the Setup

After starting the server, open `http://localhost:3333` in your browser. You should see the kanban board viewer with three view options: Board, Table, and Swimlane.

If the `kanban/` directory does not yet exist at your `KANBAN_ROOT`, create the required directories:

```bash
mkdir -p kanban/{todo,in-progress,ready-to-review,done,reviews,workstreams}
```

## Next Steps

With the server running, explore the [Kanban Board guide](/guides/kanban-board/) to learn how to create tickets, manage workstreams, and use the web viewer.
