---
type: feature
project: dot-skills
created: 2026-02-07
priority: medium
session: https://claude.ai/code/session_016Jefer6qYgWUtmiEcaC143
git-ref: b3aa6dd
branch:
workstream: github-pages-astro
depends-on: [feat--freshness-check-script]
depends-on-workstreams: []
tags: [hooks, freshness, dev-server]
---

# Hooks: docs-freshness-check and stop-dev-server

## Description

Implement the Stop hook that checks doc freshness when code changes, and the SessionEnd hook that stops the Astro dev server.

## Acceptance Criteria

- [ ] Stop hook reads .docs-config.json sourceMappings
- [ ] Stop hook checks git diff for modified source files
- [ ] Stop hook warns (exit 2) if source changed but docs didn't
- [ ] Stop hook exits 0 if no .docs-config.json exists
- [ ] SessionEnd hook reads .docs-config.json for site directory
- [ ] SessionEnd hook kills astro dev process and cleans up PID file
