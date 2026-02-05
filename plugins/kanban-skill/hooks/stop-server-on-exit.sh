#!/bin/bash
set -eo pipefail

# Kill the kanban server process and clean up the PID file.
# The PID file may be in the plugin server directory (where `serve` cd's into)
# or in the current working directory.

PID_FILE=""

if [[ -n "${CLAUDE_PLUGIN_ROOT:-}" ]] && [[ -f "${CLAUDE_PLUGIN_ROOT}/server/.kanban-server.pid" ]]; then
  PID_FILE="${CLAUDE_PLUGIN_ROOT}/server/.kanban-server.pid"
elif [[ -f ".kanban-server.pid" ]]; then
  PID_FILE=".kanban-server.pid"
fi

if [[ -n "${PID_FILE}" ]]; then
  PID=$(cat "${PID_FILE}")
  if kill "${PID}" 2>/dev/null; then
    echo "Stopped kanban server (PID ${PID})"
  else
    echo "Kanban server (PID ${PID}) was already stopped"
  fi
  rm -f "${PID_FILE}"
else
  # Last resort: find and kill by process name
  if pkill -f "kanban-skill/server" 2>/dev/null; then
    echo "Stopped kanban server via pkill"
  else
    echo "No kanban server process found"
  fi
fi
