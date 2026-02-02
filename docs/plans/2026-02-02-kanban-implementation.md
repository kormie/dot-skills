# Kanban Web Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code plugin with a Bun web server for viewing and editing kanban tickets.

**Architecture:** Slash command starts Bun server in background, serves single HTML file that reads/writes kanban markdown files via REST API, auto-commits changes to git.

**Tech Stack:** Bun, TypeScript, vanilla JS, marked.js (CDN)

---

## Task 1: Plugin Scaffold

**Files:**
- Create: `plugin.json`
- Create: `README.md`

**Step 1: Create plugin manifest**

```json
{
  "name": "kanban-skill",
  "version": "1.0.0",
  "description": "Kanban board management with web viewer for Claude Code",
  "skills": ["skills/kanban-tracker", "skills/ticket-picker"],
  "commands": ["commands/serve.md"],
  "hooks": [
    {
      "event": "SessionEnd",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/stop-server-on-exit.sh"
    }
  ]
}
```

**Step 2: Create README**

```markdown
# Kanban Skill Plugin

Manage a file-based kanban board with web viewer.

## Commands

- `/kanban-serve` - Start web viewer at localhost:3333

## Skills

- `kanban-tracker` - Board management conventions
- `ticket-picker` - Select next ticket to work on
```

**Step 3: Commit**

```bash
git add plugin.json README.md
git commit -m "feat: add plugin scaffold"
```

---

## Task 2: Port Skills from Atelier

**Files:**
- Create: `skills/kanban-tracker/SKILL.md`
- Create: `skills/ticket-picker/SKILL.md`

**Step 1: Create kanban-tracker skill**

Copy from `/Users/david.kormushoff/Documents/Repos/Atelier/.claude/skills/kanban-tracker/SKILL.md`

**Step 2: Create ticket-picker skill**

Copy from `/Users/david.kormushoff/Documents/Repos/Atelier/.claude/skills/ticket-picker/SKILL.md`

**Step 3: Commit**

```bash
git add skills/
git commit -m "feat: port kanban-tracker and ticket-picker skills"
```

---

## Task 3: SessionEnd Hook

**Files:**
- Create: `hooks/stop-server-on-exit.sh`

**Step 1: Create hook script**

```bash
#!/bin/bash
pkill -f "kanban-skill/server" 2>/dev/null || true
```

**Step 2: Make executable**

```bash
chmod +x hooks/stop-server-on-exit.sh
```

**Step 3: Commit**

```bash
git add hooks/
git commit -m "feat: add SessionEnd hook to stop server"
```

---

## Task 4: Bun Server - Entry Point

**Files:**
- Create: `server/index.ts`

**Step 1: Create server entry point**

```typescript
import { $ } from "bun";

const KANBAN_ROOT = process.env.KANBAN_ROOT || process.cwd();
const PORT = parseInt(process.env.PORT || "3333");

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static HTML
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const html = await Bun.file(import.meta.dir + "/static/index.html").text();
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // API routes handled in next task
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, url, KANBAN_ROOT);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Kanban board running at http://localhost:${PORT}`);
console.log(`Serving kanban from: ${KANBAN_ROOT}`);
console.log(`To stop: pkill -f "kanban-skill/server"`);

// Placeholder for API handler
async function handleApi(req: Request, url: URL, root: string): Promise<Response> {
  return new Response("API not implemented", { status: 501 });
}
```

**Step 2: Commit**

```bash
git add server/
git commit -m "feat: add bun server entry point"
```

---

## Task 5: Git Helper Module

**Files:**
- Create: `server/git.ts`

**Step 1: Create git helper**

```typescript
import { $ } from "bun";

export async function gitCommit(filepath: string, action: "create" | "update"): Promise<boolean> {
  const filename = filepath.split("/").pop();
  const message = `kanban: ${action} ${filename}`;

  try {
    await $`git add ${filepath}`.quiet();
    await $`git commit -m ${message}`.quiet();
    return true;
  } catch (error) {
    console.warn(`Git commit failed: ${error}`);
    return false;
  }
}
```

**Step 2: Commit**

```bash
git add server/git.ts
git commit -m "feat: add git helper module"
```

---

## Task 6: API Routes

**Files:**
- Create: `server/api.ts`
- Modify: `server/index.ts`

**Step 1: Create API module**

```typescript
import { Glob } from "bun";
import { gitCommit } from "./git";

interface TicketMeta {
  filename: string;
  title: string;
  type: string;
  priority: string;
  created: string;
}

interface TicketsResponse {
  todo: TicketMeta[];
  "in-progress": TicketMeta[];
  "ready-to-review": TicketMeta[];
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(":").trim();
    }
  }
  return frontmatter;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled";
}

async function getTicketsInColumn(root: string, column: string): Promise<TicketMeta[]> {
  const tickets: TicketMeta[] = [];
  const glob = new Glob("*.md");
  const dir = `${root}/kanban/${column}`;

  try {
    for await (const filename of glob.scan(dir)) {
      const content = await Bun.file(`${dir}/${filename}`).text();
      const fm = parseFrontmatter(content);
      tickets.push({
        filename,
        title: extractTitle(content),
        type: fm.type || "unknown",
        priority: fm.priority || "medium",
        created: fm.created || "",
      });
    }
  } catch {
    // Directory may not exist
  }

  return tickets;
}

export async function handleApi(req: Request, url: URL, root: string): Promise<Response> {
  const path = url.pathname;
  const method = req.method;

  // GET /api/tickets
  if (path === "/api/tickets" && method === "GET") {
    const response: TicketsResponse = {
      todo: await getTicketsInColumn(root, "todo"),
      "in-progress": await getTicketsInColumn(root, "in-progress"),
      "ready-to-review": await getTicketsInColumn(root, "ready-to-review"),
    };
    return Response.json(response);
  }

  // GET /api/ticket/:column/:filename
  const getMatch = path.match(/^\/api\/ticket\/([^/]+)\/(.+)$/);
  if (getMatch && method === "GET") {
    const [, column, filename] = getMatch;
    const filepath = `${root}/kanban/${column}/${filename}`;
    try {
      const content = await Bun.file(filepath).text();
      return new Response(content, {
        headers: { "Content-Type": "text/markdown" },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  // PUT /api/ticket/:column/:filename
  if (getMatch && method === "PUT") {
    const [, column, filename] = getMatch;
    const filepath = `${root}/kanban/${column}/${filename}`;
    const content = await req.text();
    await Bun.write(filepath, content);
    await gitCommit(filepath, "update");
    return new Response("OK");
  }

  // POST /api/tickets
  if (path === "/api/tickets" && method === "POST") {
    const body = await req.json();
    const { type, title, priority, description, acceptance_criteria } = body;

    const typePrefix = type === "feature" ? "feat" : type;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    const filename = `${typePrefix}--${slug}.md`;
    const filepath = `${root}/kanban/todo/${filename}`;

    const today = new Date().toISOString().split("T")[0];
    const criteria = (acceptance_criteria || []).map((c: string) => `- [ ] ${c}`).join("\n");

    const content = `---
type: ${type}
project: kanban
created: ${today}
priority: ${priority}
session:
git-ref:
branch:
depends-on: []
tags: []
---

# ${title}

## Description

${description || ""}

## Acceptance Criteria

${criteria || "- [ ] TBD"}

## Context

## Notes
`;

    await Bun.write(filepath, content);
    await gitCommit(filepath, "create");
    return Response.json({ filename });
  }

  return new Response("Not Found", { status: 404 });
}
```

**Step 2: Update index.ts to import handleApi**

Replace the placeholder `handleApi` function with:

```typescript
import { handleApi } from "./api";
```

And remove the placeholder function.

**Step 3: Commit**

```bash
git add server/
git commit -m "feat: add API routes for tickets"
```

---

## Task 7: HTML UI - Part 1 (Board View)

**Files:**
- Create: `server/static/index.html`

**Step 1: Create HTML file with board view**

See separate file: The HTML is ~300 lines, will create in implementation.

Key structure:
- Header with title and view toggle button
- Three column layout for kanban view
- Modal for editing
- Vanilla JS for API calls and DOM manipulation
- marked.js from CDN for markdown preview

**Step 2: Commit**

```bash
git add server/static/
git commit -m "feat: add HTML UI with board view"
```

---

## Task 8: HTML UI - Part 2 (Table View & Editor)

**Files:**
- Modify: `server/static/index.html`

**Step 1: Add table view toggle**

**Step 2: Add markdown editor modal with live preview**

**Step 3: Add new ticket form**

**Step 4: Commit**

```bash
git add server/static/index.html
git commit -m "feat: add table view and editor modal"
```

---

## Task 9: Slash Command

**Files:**
- Create: `commands/serve.md`

**Step 1: Create serve command**

```markdown
---
name: kanban-serve
description: Start the kanban board web viewer
allowed-tools: Bash
---

# Kanban Serve

Start the kanban board web viewer.

## Instructions

1. Run the Bun server in the background:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/server && KANBAN_ROOT=$(pwd) bun run index.ts &
```

2. Open the browser:

```bash
open http://localhost:3333
```

3. Tell the user:

"Kanban board running at http://localhost:3333. To stop: `pkill -f kanban-skill/server`"
```

**Step 2: Commit**

```bash
git add commands/
git commit -m "feat: add kanban-serve slash command"
```

---

## Task 10: End-to-End Test

**Step 1: Create test kanban directory**

```bash
mkdir -p kanban/{todo,in-progress,ready-to-review,reviews}
```

**Step 2: Create a test ticket**

**Step 3: Start server manually and verify**

```bash
cd server && KANBAN_ROOT=$(pwd)/.. bun run index.ts
```

**Step 4: Test in browser**

- Verify board loads
- Verify ticket appears
- Verify edit works
- Verify create works
- Verify git commits created

**Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete kanban web viewer plugin"
```
