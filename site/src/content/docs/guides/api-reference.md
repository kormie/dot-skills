---
title: API Reference
description: Detailed reference for the dot-skills plugin API.
---

The kanban-skill server exposes a REST API for managing tickets, workstreams, and real-time updates. The default base URL is `http://localhost:3333`.

## Types

All responses use these core types.

### TicketMeta

```typescript
interface TicketMeta {
  filename: string;    // e.g. "feat--my-ticket.md"
  title: string;       // Extracted from first # heading in the file
  type: string;        // From frontmatter: "feature", "bug", "refactor", etc.
  priority: string;    // "high", "medium", or "low"
  created: string;     // ISO date from frontmatter (e.g. "2025-01-15")
  workstream?: string; // Workstream slug, if assigned
  blockedBy?: string[]; // Slugs of blocking tickets/workstreams
}
```

### WorkstreamMeta

```typescript
interface WorkstreamMeta {
  slug: string;     // Workstream identifier (derived from filename)
  name: string;     // Title from first # heading
  priority: string; // "high", "medium", or "low"
  status: string;   // "completed" if all tickets done, else frontmatter value (default "active")
  progress: {
    completed: number; // Count of tickets in ready-to-review or done
    total: number;     // Total tickets in the workstream
  };
  tickets: string[]; // Ordered list of ticket slugs
}
```

### GitResult

Mutation endpoints return git commit status alongside the response:

```typescript
interface GitResult {
  success: boolean;
  error?: string;
}
```

---

## Endpoints

### GET /api/tickets

List all tickets grouped by kanban column. The `done` column is excluded by default for performance.

**Query Parameters**

| Parameter     | Type    | Default | Description                        |
|---------------|---------|---------|------------------------------------|
| `includeDone` | string  | `false` | Set to `"true"` to include the done column |

**Response**

```typescript
interface TicketsResponse {
  todo: TicketMeta[];
  "in-progress": TicketMeta[];
  "ready-to-review": TicketMeta[];
  done?: TicketMeta[]; // Only present when includeDone=true
}
```

**Example**

```bash
# List active tickets (excludes done)
curl http://localhost:3333/api/tickets

# Include completed tickets
curl http://localhost:3333/api/tickets?includeDone=true
```

**Example Response**

```json
{
  "todo": [
    {
      "filename": "feat--user-auth.md",
      "title": "User Authentication",
      "type": "feature",
      "priority": "high",
      "created": "2025-01-15",
      "workstream": "auth",
      "blockedBy": ["feat--database-setup"]
    }
  ],
  "in-progress": [],
  "ready-to-review": []
}
```

---

### GET /api/workstreams

List all workstreams with computed progress and derived status. Results are sorted by priority (high first), then alphabetically by name.

**Response**

```typescript
interface WorkstreamsResponse {
  workstreams: WorkstreamMeta[];
}
```

**Status Derivation**

A workstream's status is `"completed"` if all of its tickets are done (and it has at least one ticket). Otherwise, the status falls back to the frontmatter `status` field, defaulting to `"active"`.

**Example**

```bash
curl http://localhost:3333/api/workstreams
```

**Example Response**

```json
{
  "workstreams": [
    {
      "slug": "auth",
      "name": "Authentication",
      "priority": "high",
      "status": "active",
      "progress": { "completed": 2, "total": 5 },
      "tickets": ["feat--login", "feat--signup", "feat--oauth", "feat--mfa", "feat--session"]
    }
  ]
}
```

---

### GET /api/ticket/:column/:filename

Retrieve the full markdown content of a single ticket.

**Path Parameters**

| Parameter  | Type   | Description                                               |
|------------|--------|-----------------------------------------------------------|
| `column`   | string | One of `todo`, `in-progress`, `ready-to-review`, or `done` |
| `filename` | string | Ticket filename, e.g. `feat--my-ticket.md`                |

**Response**

```typescript
// 200 OK
{ content: string }

// 404 Not Found
{ error: "Not found" }
```

**Example**

```bash
curl http://localhost:3333/api/ticket/todo/feat--user-auth.md
```

**Example Response**

```json
{
  "content": "---\ntype: feature\npriority: high\ncreated: 2025-01-15\n---\n\n# User Authentication\n\n## Description\n\nImplement user auth flow.\n"
}
```

---

### PUT /api/ticket/:column/:filename

Update a ticket's content. The file is written to disk and automatically committed to git.

**Path Parameters**

| Parameter  | Type   | Description                                               |
|------------|--------|-----------------------------------------------------------|
| `column`   | string | One of `todo`, `in-progress`, `ready-to-review`, or `done` |
| `filename` | string | Ticket filename, e.g. `feat--my-ticket.md`                |

**Request Body**

```typescript
{ content: string } // Full markdown content including frontmatter
```

**Response**

```typescript
{
  success: true;
  gitCommitted: boolean;  // Whether the git commit succeeded
  gitError?: string;      // Present only if the commit failed
}
```

**Example**

```bash
curl -X PUT http://localhost:3333/api/ticket/in-progress/feat--user-auth.md \
  -H "Content-Type: application/json" \
  -d '{"content":"---\ntype: feature\npriority: high\ncreated: 2025-01-15\n---\n\n# User Authentication\n\nUpdated description."}'
```

---

### POST /api/tickets

Create a new ticket in `kanban/todo/`. The filename is derived as `<typePrefix>--<slugified-title>.md`, where `typePrefix` is `feat` when the type is `feature`, otherwise the type value itself.

Supports two request body formats.

#### Option 1: Raw Markdown

Send the full markdown content directly. The type and title are extracted from the content.

**Request Body**

```typescript
{ content: string } // Full markdown with frontmatter
```

**Example**

```bash
curl -X POST http://localhost:3333/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"content":"---\ntype: bug\npriority: high\n---\n\n# Fix Login Timeout\n\nLogin times out after 5 seconds."}'
```

#### Option 2: Structured Body

Provide fields individually. The server generates the full markdown with frontmatter, description, acceptance criteria, context, and notes sections.

**Request Body**

```typescript
{
  type: string;                    // "feature", "bug", "refactor", etc.
  title: string;                   // Ticket title (used for heading and filename slug)
  priority: string;                // "high", "medium", or "low"
  description?: string;            // Description text
  acceptance_criteria?: string[];   // List of acceptance criteria items
}
```

**Example**

```bash
curl -X POST http://localhost:3333/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "title": "Fix Login Timeout",
    "priority": "high",
    "description": "Login times out after 5 seconds on slow connections",
    "acceptance_criteria": ["Login completes within 30s", "Show loading indicator"]
  }'
```

**Generated Markdown (Structured Body)**

The structured body generates a ticket with this template:

```markdown
---
type: bug
project: kanban
created: 2025-01-15
priority: high
session:
git-ref:
branch:
depends-on: []
tags: []
---

# Fix Login Timeout

## Description

Login times out after 5 seconds on slow connections

## Acceptance Criteria

- [ ] Login completes within 30s
- [ ] Show loading indicator

## Context

## Notes
```

**Response (Both Formats)**

```typescript
{
  filename: string;        // e.g. "bug--fix-login-timeout.md"
  gitCommitted: boolean;
  gitError?: string;
}
```

---

### GET /api/events

Server-Sent Events (SSE) stream for real-time board updates. The server watches the `kanban/` directory for file changes and notifies all connected clients.

**Headers**

The response uses these headers:

| Header         | Value                |
|----------------|----------------------|
| Content-Type   | `text/event-stream`  |
| Cache-Control  | `no-cache`           |
| Connection     | `keep-alive`         |

**Protocol**

1. On connection, the server sends an initial event:
   ```
   data: connected
   ```

2. When any file under `kanban/` changes, the server sends a refresh event:
   ```
   data: refresh
   ```

3. Rapid file changes are debounced with a 100ms window. Multiple changes within 100ms produce a single `refresh` event.

4. The client should reconnect automatically if the connection drops (standard SSE behavior via `EventSource`).

**Example**

```bash
curl -N http://localhost:3333/api/events
```

**Client Usage (JavaScript)**

```javascript
const events = new EventSource("/api/events");

events.onmessage = (event) => {
  if (event.data === "connected") {
    console.log("SSE connected");
  } else if (event.data === "refresh") {
    // Reload ticket data
    fetchTickets();
  }
};
```

---

## Blocking Logic

A ticket's `blockedBy` array is computed from three sources. All three are evaluated and merged into a single deduplicated array.

### 1. Explicit Dependencies (`depends-on`)

The ticket's frontmatter lists ticket slugs in a `depends-on` array. Each slug is checked against `kanban/ready-to-review/` and `kanban/done/`. If the dependency is not found in either directory, it is a blocker.

```yaml
depends-on: [feat--database-setup, feat--config]
```

### 2. Workstream Dependencies (`depends-on-workstreams`)

The ticket's frontmatter lists workstream slugs in a `depends-on-workstreams` array. A workstream blocks the ticket if its `progress.completed` does not equal `progress.total`.

```yaml
depends-on-workstreams: [infrastructure]
```

### 3. Workstream Predecessor Ordering

If a ticket belongs to a workstream, every preceding ticket in the workstream's `tickets` array must be complete (in `ready-to-review/` or `done/`). Incomplete predecessors are added as blockers.

For example, if a workstream defines:

```yaml
tickets:
  - feat--step-one
  - feat--step-two
  - feat--step-three
```

Then `feat--step-three` is blocked by both `feat--step-one` and `feat--step-two` until they are each in `ready-to-review/` or `done/`.

### Completion Definition

A ticket is considered "complete" if its `.md` file exists in either `kanban/ready-to-review/` or `kanban/done/`.

---

## Git Auto-Commit

Write operations (`PUT /api/ticket/:column/:filename` and `POST /api/tickets`) automatically commit changes to git after writing to disk.

The commit flow:

1. The file is written to disk with `Bun.write()`
2. The file is staged with `git add <filepath>`
3. A commit is created with message format: `kanban: <action> <filename>`
   - `action` is either `create` (for POST) or `update` (for PUT)
   - Example: `kanban: create feat--login.md`

If either the staging or commit step fails, the file is still written to disk but `gitCommitted` will be `false` and `gitError` will contain the error message. The API call itself does not fail -- file writes are not rolled back on git failure.

---

## Error Responses

All endpoints return JSON error responses:

| Status | Body                       | When                                    |
|--------|----------------------------|-----------------------------------------|
| 404    | `{ "error": "Not found" }` | Ticket file does not exist at the given path |
| 404    | `"Not Found"` (plain text) | Unrecognized API route                  |
