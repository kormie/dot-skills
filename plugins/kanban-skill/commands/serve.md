---
name: serve
description: Start the kanban board web viewer
allowed-tools: [Bash]
---

# Kanban Serve

Start the kanban board web viewer at localhost:3333.

## Instructions

1. First, check if bun is installed. If not, tell the user to install it.

2. Start the Bun server in background from the plugin's server directory:
   - Set KANBAN_ROOT to the current project directory (where Claude Code is running)
   - The server files are at ${CLAUDE_PLUGIN_ROOT}/server/

3. Open the browser to http://localhost:3333

4. Tell the user:
   - The board is running at http://localhost:3333
   - To stop: pkill -f "kanban-skill/server"
   - The server will auto-stop when the Claude session ends

## Example Commands

```bash
# Start server in background
cd "${CLAUDE_PLUGIN_ROOT}/server" && KANBAN_ROOT="${CLAUDE_PROJECT_DIR}" bun run index.ts &

# Open browser (macOS)
open http://localhost:3333
```
