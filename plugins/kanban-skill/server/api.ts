import { Glob } from "bun";
import { gitCommit } from "./git";

interface TicketMeta {
  filename: string;
  title: string;
  type: string;
  priority: string;
  created: string;
  workstream?: string;
  blockedBy?: string[];
}

interface WorkstreamMeta {
  slug: string;
  name: string;
  priority: string;
  status: string;
  progress: { completed: number; total: number };
  tickets: string[];
}

interface WorkstreamsResponse {
  workstreams: WorkstreamMeta[];
}

interface TicketsResponse {
  todo: TicketMeta[];
  "in-progress": TicketMeta[];
  "ready-to-review": TicketMeta[];
}

function parseFrontmatter(content: string): Record<string, string | string[]> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter: Record<string, string | string[]> = {};
  const lines = match[1].split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    // Check for YAML list (inline [] or multiline -)
    if (value.startsWith("[")) {
      // Inline array: [item1, item2]
      const items = value.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean);
      frontmatter[key] = items;
    } else if (value === "" && i + 1 < lines.length && lines[i + 1].trim().startsWith("-")) {
      // Multiline array
      const items: string[] = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("-")) {
        i++;
        items.push(lines[i].trim().slice(1).trim());
      }
      frontmatter[key] = items;
    } else {
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : "Untitled";
}

async function isTicketComplete(slug: string, root: string): Promise<boolean> {
  const reviewPath = `${root}/kanban/ready-to-review/${slug}.md`;
  const donePath = `${root}/kanban/done/${slug}.md`;

  try {
    await Bun.file(reviewPath).text();
    return true;
  } catch {
    try {
      await Bun.file(donePath).text();
      return true;
    } catch {
      return false;
    }
  }
}

function isWorkstreamComplete(workstream: WorkstreamMeta): boolean {
  return workstream.progress.completed === workstream.progress.total && workstream.progress.total > 0;
}

interface TicketFrontmatter {
  workstream?: string;
  "depends-on"?: string[];
  "depends-on-workstreams"?: string[];
  [key: string]: string | string[] | undefined;
}

async function computeBlockedBy(
  ticket: { slug: string; frontmatter: TicketFrontmatter },
  workstreams: WorkstreamMeta[],
  root: string
): Promise<string[]> {
  const blockers: string[] = [];

  // 1. Check depends-on slugs against ready-to-review/done
  const dependsOn = ticket.frontmatter["depends-on"] || [];
  for (const depSlug of dependsOn) {
    if (!(await isTicketComplete(depSlug, root))) {
      blockers.push(depSlug);
    }
  }

  // 2. Check depends-on-workstreams for workstream completion
  const dependsOnWorkstreams = ticket.frontmatter["depends-on-workstreams"] || [];
  for (const wsSlug of dependsOnWorkstreams) {
    const ws = workstreams.find(w => w.slug === wsSlug);
    if (ws && !isWorkstreamComplete(ws)) {
      blockers.push(wsSlug);
    }
  }

  // 3. Check workstream predecessor completion (implicit ordering)
  const ticketWorkstream = ticket.frontmatter.workstream;
  if (ticketWorkstream) {
    const ws = workstreams.find(w => w.slug === ticketWorkstream);
    if (ws) {
      const ticketIndex = ws.tickets.indexOf(ticket.slug);
      if (ticketIndex > 0) {
        // Check all predecessors in the workstream
        for (let i = 0; i < ticketIndex; i++) {
          const predecessorSlug = ws.tickets[i];
          if (!(await isTicketComplete(predecessorSlug, root))) {
            // Only add if not already in blockers
            if (!blockers.includes(predecessorSlug)) {
              blockers.push(predecessorSlug);
            }
          }
        }
      }
    }
  }

  return blockers;
}

async function getWorkstreams(root: string): Promise<WorkstreamMeta[]> {
  const workstreams: WorkstreamMeta[] = [];
  const glob = new Glob("*.md");
  const dir = `${root}/kanban/workstreams`;

  try {
    for await (const filename of glob.scan(dir)) {
      const content = await Bun.file(`${dir}/${filename}`).text();
      const fm = parseFrontmatter(content);
      const title = extractTitle(content);

      const tickets = (fm.tickets as string[]) || [];

      // Compute progress by checking ticket locations
      let completed = 0;
      for (const ticketSlug of tickets) {
        if (await isTicketComplete(ticketSlug, root)) {
          completed++;
        }
      }

      // Derive status
      let status = fm.status as string || "active";
      if (completed === tickets.length && tickets.length > 0) {
        status = "completed";
      }

      workstreams.push({
        slug: (fm.slug as string) || filename.replace(".md", ""),
        name: title,
        priority: (fm.priority as string) || "medium",
        status,
        progress: { completed, total: tickets.length },
        tickets,
      });
    }
  } catch {
    // Directory may not exist
  }

  // Sort by priority (high first), then alphabetically
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  workstreams.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 1;
    const pb = priorityOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  return workstreams;
}

async function getTicketsInColumn(
  root: string,
  column: string,
  workstreams: WorkstreamMeta[]
): Promise<TicketMeta[]> {
  const tickets: TicketMeta[] = [];
  const glob = new Glob("*.md");
  const dir = `${root}/kanban/${column}`;

  try {
    for await (const filename of glob.scan(dir)) {
      const content = await Bun.file(`${dir}/${filename}`).text();
      const fm = parseFrontmatter(content);
      const slug = filename.replace(".md", "");

      // Compute blocking information
      const blockedBy = await computeBlockedBy(
        {
          slug,
          frontmatter: {
            workstream: fm.workstream as string | undefined,
            "depends-on": fm["depends-on"] as string[] | undefined,
            "depends-on-workstreams": fm["depends-on-workstreams"] as string[] | undefined,
          },
        },
        workstreams,
        root
      );

      tickets.push({
        filename,
        title: extractTitle(content),
        type: (fm.type as string) || "unknown",
        priority: (fm.priority as string) || "medium",
        created: (fm.created as string) || "",
        workstream: fm.workstream as string | undefined,
        blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
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
    const workstreams = await getWorkstreams(root);
    const response: TicketsResponse = {
      todo: await getTicketsInColumn(root, "todo", workstreams),
      "in-progress": await getTicketsInColumn(root, "in-progress", workstreams),
      "ready-to-review": await getTicketsInColumn(root, "ready-to-review", workstreams),
    };
    return Response.json(response);
  }

  // GET /api/workstreams
  if (path === "/api/workstreams" && method === "GET") {
    const workstreams = await getWorkstreams(root);
    const response: WorkstreamsResponse = { workstreams };
    return Response.json(response);
  }

  // GET /api/ticket/:column/:filename
  const getMatch = path.match(/^\/api\/ticket\/([^/]+)\/(.+)$/);
  if (getMatch && method === "GET") {
    const [, column, filename] = getMatch;
    const filepath = `${root}/kanban/${column}/${filename}`;
    try {
      const content = await Bun.file(filepath).text();
      return Response.json({ content });
    } catch {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
  }

  // PUT /api/ticket/:column/:filename
  if (getMatch && method === "PUT") {
    const [, column, filename] = getMatch;
    const filepath = `${root}/kanban/${column}/${filename}`;
    const body = await req.json();
    const content = body.content;
    await Bun.write(filepath, content);
    await gitCommit(filepath, "update");
    return Response.json({ success: true });
  }

  // POST /api/tickets
  if (path === "/api/tickets" && method === "POST") {
    const body = await req.json();

    // Frontend sends { content } with raw markdown
    if (body.content) {
      const content = body.content;
      const fm = parseFrontmatter(content);
      const title = extractTitle(content);
      const type = fm.type || "feature";

      const typePrefix = type === "feature" ? "feat" : type;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      const filename = `${typePrefix}--${slug}.md`;
      const filepath = `${root}/kanban/todo/${filename}`;

      await Bun.write(filepath, content);
      await gitCommit(filepath, "create");
      return Response.json({ filename });
    }

    // Legacy: structured body with type, title, priority, etc.
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
