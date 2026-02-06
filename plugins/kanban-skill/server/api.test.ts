import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { handleApi } from "./api";

// Test helpers
let testRoot: string;
const PORT = 13333;

function makeReq(path: string, method = "GET", body?: unknown): Request {
  const url = `http://localhost:${PORT}${path}`;
  const opts: RequestInit = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  return new Request(url, opts);
}

async function callApi(path: string, method = "GET", body?: unknown) {
  const req = makeReq(path, method, body);
  const url = new URL(req.url);
  return handleApi(req, url, testRoot);
}

function writeTicket(column: string, filename: string, content: string) {
  const dir = join(testRoot, "kanban", column);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content);
}

function writeWorkstream(filename: string, content: string) {
  const dir = join(testRoot, "kanban", "workstreams");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), content);
}

beforeEach(() => {
  testRoot = join(tmpdir(), `kanban-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(testRoot, "kanban", "todo"), { recursive: true });
  mkdirSync(join(testRoot, "kanban", "in-progress"), { recursive: true });
  mkdirSync(join(testRoot, "kanban", "ready-to-review"), { recursive: true });
  mkdirSync(join(testRoot, "kanban", "done"), { recursive: true });
  mkdirSync(join(testRoot, "kanban", "workstreams"), { recursive: true });
});

// --- GET /api/tickets ---

describe("GET /api/tickets", () => {
  test("returns empty columns when no tickets exist", async () => {
    const res = await callApi("/api/tickets");
    const data = await res.json();
    expect(data.todo).toEqual([]);
    expect(data["in-progress"]).toEqual([]);
    expect(data["ready-to-review"]).toEqual([]);
    expect(data.done).toBeUndefined();
  });

  test("returns tickets from all columns", async () => {
    writeTicket("todo", "feat--login.md", "---\ntype: feature\npriority: high\ncreated: 2026-01-01\n---\n\n# Login Feature\n");
    writeTicket("in-progress", "bug--crash.md", "---\ntype: bug\npriority: medium\ncreated: 2026-01-02\n---\n\n# Fix Crash\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    expect(data.todo.length).toBe(1);
    expect(data.todo[0].title).toBe("Login Feature");
    expect(data.todo[0].type).toBe("feature");
    expect(data.todo[0].priority).toBe("high");
    expect(data["in-progress"].length).toBe(1);
    expect(data["in-progress"][0].title).toBe("Fix Crash");
  });

  test("includeDone=true includes done column", async () => {
    writeTicket("done", "feat--old.md", "---\ntype: feature\npriority: low\ncreated: 2026-01-01\n---\n\n# Old Feature\n");

    const res = await callApi("/api/tickets?includeDone=true");
    const data = await res.json();
    expect(data.done).toBeDefined();
    expect(data.done.length).toBe(1);
    expect(data.done[0].title).toBe("Old Feature");
  });

  test("tickets include workstream field", async () => {
    writeTicket("todo", "feat--ws.md", "---\ntype: feature\npriority: medium\ncreated: 2026-01-01\nworkstream: my-ws\n---\n\n# WS Ticket\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    expect(data.todo[0].workstream).toBe("my-ws");
  });
});

// --- GET /api/workstreams ---

describe("GET /api/workstreams", () => {
  test("returns empty array when no workstreams exist", async () => {
    const res = await callApi("/api/workstreams");
    const data = await res.json();
    expect(data.workstreams).toEqual([]);
  });

  test("returns workstream metadata", async () => {
    writeWorkstream("ws-alpha.md", "---\nslug: ws-alpha\npriority: high\ntickets:\n  - feat--a\n  - feat--b\n---\n\n# Alpha Workstream\n");

    const res = await callApi("/api/workstreams");
    const data = await res.json();
    expect(data.workstreams.length).toBe(1);
    expect(data.workstreams[0].slug).toBe("ws-alpha");
    expect(data.workstreams[0].name).toBe("Alpha Workstream");
    expect(data.workstreams[0].priority).toBe("high");
    expect(data.workstreams[0].tickets).toEqual(["feat--a", "feat--b"]);
  });

  test("computes progress from ticket locations", async () => {
    writeWorkstream("ws-prog.md", "---\nslug: ws-prog\npriority: medium\ntickets:\n  - feat--done-one\n  - feat--todo-one\n---\n\n# Progress WS\n");
    writeTicket("ready-to-review", "feat--done-one.md", "---\ntype: feature\npriority: medium\n---\n\n# Done One\n");
    writeTicket("todo", "feat--todo-one.md", "---\ntype: feature\npriority: medium\n---\n\n# Todo One\n");

    const res = await callApi("/api/workstreams");
    const data = await res.json();
    expect(data.workstreams[0].progress.completed).toBe(1);
    expect(data.workstreams[0].progress.total).toBe(2);
  });

  test("derives completed status when all tickets done", async () => {
    writeWorkstream("ws-done.md", "---\nslug: ws-done\npriority: low\ntickets:\n  - feat--x\n---\n\n# Done WS\n");
    writeTicket("done", "feat--x.md", "---\ntype: feature\n---\n\n# X\n");

    const res = await callApi("/api/workstreams");
    const data = await res.json();
    expect(data.workstreams[0].status).toBe("completed");
  });

  test("sorts by priority (high first)", async () => {
    writeWorkstream("ws-low.md", "---\nslug: ws-low\npriority: low\ntickets: []\n---\n\n# Low\n");
    writeWorkstream("ws-high.md", "---\nslug: ws-high\npriority: high\ntickets: []\n---\n\n# High\n");

    const res = await callApi("/api/workstreams");
    const data = await res.json();
    expect(data.workstreams[0].slug).toBe("ws-high");
    expect(data.workstreams[1].slug).toBe("ws-low");
  });
});

// --- Blocking logic ---

describe("blocking logic", () => {
  test("ticket blocked by depends-on when dependency not complete", async () => {
    writeWorkstream("ws-block.md", "---\nslug: ws-block\npriority: high\ntickets:\n  - feat--dep\n  - feat--blocked\n---\n\n# Block WS\n");
    writeTicket("todo", "feat--dep.md", "---\ntype: feature\npriority: high\nworkstream: ws-block\n---\n\n# Dep Ticket\n");
    writeTicket("todo", "feat--blocked.md", "---\ntype: feature\npriority: high\nworkstream: ws-block\ndepends-on:\n  - feat--dep\n---\n\n# Blocked Ticket\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const blocked = data.todo.find((t: any) => t.filename === "feat--blocked.md");
    expect(blocked.blockedBy).toBeDefined();
    expect(blocked.blockedBy).toContain("feat--dep");
  });

  test("ticket NOT blocked when dependency is in ready-to-review", async () => {
    writeWorkstream("ws-ok.md", "---\nslug: ws-ok\npriority: high\ntickets:\n  - feat--dep2\n  - feat--notblocked\n---\n\n# OK WS\n");
    writeTicket("ready-to-review", "feat--dep2.md", "---\ntype: feature\npriority: high\nworkstream: ws-ok\n---\n\n# Dep2\n");
    writeTicket("todo", "feat--notblocked.md", "---\ntype: feature\npriority: high\nworkstream: ws-ok\ndepends-on:\n  - feat--dep2\n---\n\n# Not Blocked\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const ticket = data.todo.find((t: any) => t.filename === "feat--notblocked.md");
    expect(ticket.blockedBy).toBeUndefined();
  });

  test("ticket blocked by workstream predecessor ordering", async () => {
    writeWorkstream("ws-order.md", "---\nslug: ws-order\npriority: high\ntickets:\n  - feat--first\n  - feat--second\n---\n\n# Order WS\n");
    writeTicket("todo", "feat--first.md", "---\ntype: feature\npriority: high\nworkstream: ws-order\n---\n\n# First\n");
    writeTicket("todo", "feat--second.md", "---\ntype: feature\npriority: high\nworkstream: ws-order\n---\n\n# Second\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const second = data.todo.find((t: any) => t.filename === "feat--second.md");
    expect(second.blockedBy).toContain("feat--first");
  });

  test("ticket with no dependencies is not blocked", async () => {
    writeTicket("todo", "feat--free.md", "---\ntype: feature\npriority: medium\n---\n\n# Free Ticket\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const free = data.todo.find((t: any) => t.filename === "feat--free.md");
    expect(free.blockedBy).toBeUndefined();
  });
});

// --- GET /api/ticket/:column/:filename ---

describe("GET /api/ticket/:column/:filename", () => {
  test("returns full ticket content", async () => {
    const content = "---\ntype: feature\n---\n\n# My Ticket\n\nSome details.";
    writeTicket("todo", "feat--my-ticket.md", content);

    const res = await callApi("/api/ticket/todo/feat--my-ticket.md");
    const data = await res.json();
    expect(data.content).toBe(content);
  });

  test("returns 404 for nonexistent ticket", async () => {
    const res = await callApi("/api/ticket/todo/nonexistent.md");
    expect(res.status).toBe(404);
  });
});

// --- POST /api/tickets ---

describe("POST /api/tickets", () => {
  test("creates ticket from raw markdown content", async () => {
    const content = "---\ntype: bug\n---\n\n# Fix Login Bug\n\nDetails here.";
    const res = await callApi("/api/tickets", "POST", { content });
    const data = await res.json();

    expect(data.filename).toBe("bug--fix-login-bug.md");
    const filepath = join(testRoot, "kanban", "todo", data.filename);
    expect(existsSync(filepath)).toBe(true);
  });

  test("creates ticket from structured body", async () => {
    const res = await callApi("/api/tickets", "POST", {
      type: "feature",
      title: "New Widget",
      priority: "high",
      description: "Build a widget",
      acceptance_criteria: ["Works", "Tests pass"],
    });
    const data = await res.json();

    expect(data.filename).toBe("feat--new-widget.md");
    const filepath = join(testRoot, "kanban", "todo", data.filename);
    expect(existsSync(filepath)).toBe(true);

    const written = await Bun.file(filepath).text();
    expect(written).toContain("# New Widget");
    expect(written).toContain("Build a widget");
    expect(written).toContain("- [ ] Works");
  });
});

// --- PUT /api/ticket/:column/:filename ---

describe("PUT /api/ticket/:column/:filename", () => {
  test("updates ticket content", async () => {
    writeTicket("todo", "feat--edit.md", "---\ntype: feature\n---\n\n# Original\n");

    const newContent = "---\ntype: feature\n---\n\n# Updated Title\n\nNew body.";
    const res = await callApi("/api/ticket/todo/feat--edit.md", "PUT", { content: newContent });
    const data = await res.json();
    expect(data.success).toBe(true);

    const written = await Bun.file(join(testRoot, "kanban", "todo", "feat--edit.md")).text();
    expect(written).toBe(newContent);
  });
});

// --- Frontmatter parsing (tested indirectly) ---

describe("frontmatter parsing", () => {
  test("parses inline arrays", async () => {
    writeTicket("todo", "feat--inline.md", "---\ntype: feature\npriority: high\ncreated: 2026-01-01\ndepends-on: [feat--a, feat--b]\n---\n\n# Inline Arrays\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const ticket = data.todo.find((t: any) => t.filename === "feat--inline.md");
    expect(ticket).toBeDefined();
    expect(ticket.title).toBe("Inline Arrays");
  });

  test("parses multiline arrays", async () => {
    writeTicket("todo", "feat--multi.md", "---\ntype: feature\npriority: medium\ncreated: 2026-01-01\ndepends-on:\n  - feat--x\n  - feat--y\n---\n\n# Multi Arrays\n");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const ticket = data.todo.find((t: any) => t.filename === "feat--multi.md");
    expect(ticket).toBeDefined();
  });

  test("handles missing frontmatter gracefully", async () => {
    writeTicket("todo", "feat--nofm.md", "# No Frontmatter\n\nJust markdown.");

    const res = await callApi("/api/tickets");
    const data = await res.json();
    const ticket = data.todo.find((t: any) => t.filename === "feat--nofm.md");
    expect(ticket).toBeDefined();
    expect(ticket.type).toBe("unknown");
    expect(ticket.priority).toBe("medium");
  });
});

// --- 404 for unknown routes ---

describe("unknown routes", () => {
  test("returns 404 for unknown paths", async () => {
    const res = await callApi("/api/unknown");
    expect(res.status).toBe(404);
  });
});
