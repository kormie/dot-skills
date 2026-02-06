import { handleApi } from "./api";

const KANBAN_ROOT = process.env.KANBAN_ROOT || process.cwd();
const PORT = parseInt(process.env.PORT || "3333");

const staticDir = import.meta.dir + "/static";
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve index.html for root
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(Bun.file(staticDir + "/index.html"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // API routes
    if (url.pathname.startsWith("/api/")) {
      return handleApi(req, url, KANBAN_ROOT);
    }

    // Serve static files (CSS, JS, etc.)
    const ext = url.pathname.substring(url.pathname.lastIndexOf("."));
    const mimeType = mimeTypes[ext];
    if (mimeType) {
      const file = Bun.file(staticDir + url.pathname);
      if (await file.exists()) {
        return new Response(file, { headers: { "Content-Type": mimeType } });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Kanban board running at http://localhost:${PORT}`);
console.log(`Serving kanban from: ${KANBAN_ROOT}`);
console.log(`To stop: pkill -f "kanban-skill/server"`);
