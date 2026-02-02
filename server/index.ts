import { $ } from "bun";
import { handleApi } from "./api";

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
