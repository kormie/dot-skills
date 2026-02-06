# Kanban Skill API Reference

Base URL: `http://localhost:<port>` (port configured in `serve.md`)

## Endpoints

### GET /api/tickets

Returns all tickets grouped by kanban column. Pass `?includeDone=true` to include the done column.

**Response:** `{ "todo": [TicketMeta], "in-progress": [TicketMeta], "ready-to-review": [TicketMeta], "done?": [TicketMeta] }`

**TicketMeta:**

| Field       | Type       | Description                               |
|-------------|------------|-------------------------------------------|
| `filename`  | string     | e.g. `feat--my-ticket.md`                 |
| `title`     | string     | Extracted from first `# Heading` in file  |
| `type`      | string     | From frontmatter (`feature`, `bug`, etc.) |
| `priority`  | string     | `high`, `medium`, or `low`                |
| `created`   | string     | ISO date from frontmatter                 |
| `workstream`| string?    | Workstream slug, if assigned              |
| `blockedBy` | string[]?  | Array of blocker slugs, if any            |

---

### GET /api/workstreams

Returns all workstreams with computed progress and status.

**Response:** `{ "workstreams": [WorkstreamMeta] }`

**WorkstreamMeta:**

| Field      | Type                                   | Description                  |
|------------|----------------------------------------|------------------------------|
| `slug`     | string                                 | Workstream identifier        |
| `name`     | string                                 | Title from `# Heading`       |
| `priority` | string                                 | `high`, `medium`, or `low`   |
| `status`   | string                                 | Derived (see below)          |
| `progress` | `{ completed: number, total: number }` | Ticket completion counts     |
| `tickets`  | string[]                               | Ordered list of ticket slugs |

**Status derivation:** `"completed"` if all tickets are done (and total > 0), otherwise falls back to the frontmatter `status` field (default `"active"`). Sorted by priority (high first), then alphabetically.

---

### GET /api/ticket/:column/:filename

Returns the full markdown content of a single ticket.

- **`:column`** -- `todo`, `in-progress`, `ready-to-review`, or `done`
- **`:filename`** -- e.g. `feat--my-ticket.md`

**200:** `{ "content": "<full markdown>" }` | **404:** `{ "error": "Not found" }`

---

### PUT /api/ticket/:column/:filename

Updates a ticket's content and auto-commits to git.

**Request body:** `{ "content": "<full markdown>" }`

**Response:** `{ "success": true, "gitCommitted": boolean, "gitError?": string }`

---

### POST /api/tickets

Creates a new ticket in `kanban/todo/`. Filename is derived as `<typePrefix>--<slugified-title>.md` where `typePrefix` is `feat` for type `feature`, otherwise the type value itself.

**Option 1 -- raw markdown:**

```json
{ "content": "---\ntype: feature\n...\n---\n\n# My Ticket\n..." }
```

**Option 2 -- structured body:**

```json
{
  "type": "feature",
  "title": "My Ticket",
  "priority": "high",
  "description": "Details here",
  "acceptance_criteria": ["Criterion 1", "Criterion 2"]
}
```

Generates full markdown with frontmatter, description, and acceptance criteria sections.

**Response:** `{ "filename": string, "gitCommitted": boolean, "gitError?": string }`

---

### GET /api/events

Server-Sent Events stream for real-time kanban updates.

- Sends `data: connected\n\n` immediately on connection.
- Sends `data: refresh\n\n` whenever any file under `kanban/` changes (100ms debounce).
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

---

## Blocking Logic

A ticket's `blockedBy` array is computed from three sources:

1. **`depends-on`** -- Frontmatter lists ticket slugs. If the ticket is NOT in `ready-to-review/` or `done/`, it is a blocker.
2. **`depends-on-workstreams`** -- Frontmatter lists workstream slugs. If the workstream's completed count does not equal its total, it is a blocker.
3. **Workstream predecessor ordering** -- If the ticket belongs to a workstream, every preceding ticket in the workstream's `tickets` array must be complete. Incomplete predecessors are added as blockers.

A ticket is considered "complete" if its `.md` file exists in either `kanban/ready-to-review/` or `kanban/done/`.

---

## Example curl Commands

List all tickets:
```bash
curl http://localhost:3333/api/tickets
```

Read a specific ticket:
```bash
curl http://localhost:3333/api/ticket/todo/feat--my-ticket.md
```

Create a ticket:
```bash
curl -X POST http://localhost:3333/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"type":"bug","title":"Fix login timeout","priority":"high","description":"Login times out after 5s"}'
```

Update a ticket:
```bash
curl -X PUT http://localhost:3333/api/ticket/in-progress/feat--my-ticket.md \
  -H "Content-Type: application/json" \
  -d '{"content":"---\ntype: feature\npriority: high\n---\n\n# My Ticket\n\nUpdated content."}'
```
