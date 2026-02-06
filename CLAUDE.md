# dot-skills

Personal Claude Code plugin marketplace. The main plugin is `kanban-skill`, a file-based kanban board with a Bun-powered web server for tracking work items across Claude Code sessions.

## Architecture

- **Plugin root:** `plugins/kanban-skill/` -- contains commands, skills, hooks, and server
- **Server:** Bun + TypeScript (`plugins/kanban-skill/server/`). Entry point is `index.ts`, API routes in `api.ts`
- **Frontend:** Vanilla HTML/JS/CSS in `server/static/`. Views: Board, Table, Swimlane (workstream-grouped)
- **Data layer:** Markdown files with YAML frontmatter stored in `kanban/` directories. No database

## Kanban Conventions

### Columns (directories)

- `kanban/todo/` -- not started
- `kanban/in-progress/` -- actively being worked on
- `kanban/ready-to-review/` -- complete, awaiting human review
- `kanban/done/` -- finished

### Ticket files

- Filename format: `<type>--<slug>.md` (double-dash separator)
- Type prefixes: `feat`, `test`, `bug`, `refactor`, `infra`, `docs`, `spike`
- Examples: `feat--login.md`, `bug--crash.md`, `refactor--extract-module.md`
- Move files between directories to change status; never delete

### Workstreams

- Defined in `kanban/workstreams/*.md`
- Group related tickets with internal ordering
- Ticket order in the `tickets` list defines recommended execution order

### Blocking

A ticket is blocked if any of these are true:
- A `depends-on` ticket is not in `ready-to-review/` or `done/`
- A `depends-on-workstreams` workstream is not completed
- An earlier ticket in the same workstream's `tickets` list is not done

### Review files

- Required in `kanban/reviews/` for every ticket moved to `ready-to-review/`
- Same filename as the ticket (e.g., `feat--login.md` in both directories)

## Development

- **Runtime:** Bun (required)
- **Start server:** `cd plugins/kanban-skill/server && KANBAN_ROOT=$PWD/../../.. bun run index.ts`
- **Run tests:** `cd plugins/kanban-skill/server && bun test`
- **No build step required**
- Server listens on port 3333 by default (configurable via `PORT` env var)

## Important Files

- `plugins/kanban-skill/server/api.ts` -- API routes and business logic
- `plugins/kanban-skill/server/git.ts` -- Git auto-commit helper
- `plugins/kanban-skill/server/index.ts` -- Server entry point
- `plugins/kanban-skill/server/static/` -- Frontend (HTML, CSS, JS modules)
- `plugins/kanban-skill/skills/kanban-tracker/SKILL.md` -- Board conventions and ticket format
- `plugins/kanban-skill/skills/ticket-picker/SKILL.md` -- Ticket selection algorithm
