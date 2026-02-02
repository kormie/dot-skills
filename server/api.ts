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
