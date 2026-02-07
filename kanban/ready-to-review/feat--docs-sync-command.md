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
tags: [command, sync, freshness]
---

# Command: docs-sync

## Description

Implement the /docs-sync command that performs a documentation freshness audit driven by .docs-config.json.

## Acceptance Criteria

- [ ] Checks source mapping staleness via timestamps
- [ ] Verifies sidebar completeness (files ↔ sidebar entries)
- [ ] Discovers new source files matching existing glob patterns
- [ ] Audits agent-readiness (frontmatter, self-containment, terminology)
- [ ] Verifies agent discovery chain (CLAUDE.md/AGENTS.md references)
- [ ] Produces structured report with suggested actions
