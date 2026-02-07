---
type: feature
project: dot-skills
created: 2026-02-07
priority: high
session: https://claude.ai/code/session_016Jefer6qYgWUtmiEcaC143
git-ref: b3aa6dd
branch:
workstream: github-pages-astro
depends-on: [feat--docs-site-skill]
depends-on-workstreams: []
tags: [command, init, scaffold]
---

# Command: docs-init

## Description

Implement the /docs-init command that scaffolds an Astro + Starlight doc site and generates .docs-config.json for any repo.

## Acceptance Criteria

- [ ] Gathers project context from CLAUDE.md, README, package.json
- [ ] Generates .docs-config.json with sections, sourceMappings, terminology
- [ ] Scaffolds Astro site if one doesn't exist (using Bun)
- [ ] Scaffolds GitHub Actions workflows (using Bun, not npm)
- [ ] Updates agent discovery files (CLAUDE.md, README)
- [ ] Detects existing site and skips scaffolding when appropriate
