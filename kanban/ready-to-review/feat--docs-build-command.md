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
tags: [command, build]
---

# Command: docs-build

## Description

Implement the /docs-build command that builds the documentation site and validates llms.txt output.

## Acceptance Criteria

- [ ] Reads .docs-config.json for site directory
- [ ] Runs bun install if needed
- [ ] Runs bunx astro build
- [ ] Reports success/failure with output path
- [ ] Validates llms.txt, llms-full.txt, llms-small.txt exist
- [ ] Optionally runs link validation
