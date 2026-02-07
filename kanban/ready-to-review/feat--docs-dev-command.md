---
type: feature
project: dot-skills
created: 2026-02-07
priority: medium
session: https://claude.ai/code/session_016Jefer6qYgWUtmiEcaC143
git-ref: b3aa6dd
branch:
workstream: github-pages-astro
depends-on: [infra--gh-pages-plugin-scaffold]
depends-on-workstreams: []
tags: [command, dev-server]
---

# Command: docs-dev

## Description

Implement the /docs-dev command that starts the Astro dev server for live preview using bunx.

## Acceptance Criteria

- [ ] Reads .docs-config.json for site directory and base URL
- [ ] Checks Bun is installed
- [ ] Runs bun install if node_modules missing
- [ ] Starts bunx astro dev in background
- [ ] Saves PID to .astro-dev.pid
- [ ] Prints local URL
