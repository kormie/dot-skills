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
tags: [script, freshness]
---

# Script: freshness-check.ts

## Description

Implement the Bun script that performs freshness audit logic, shared between docs-sync and the Stop hook.

## Acceptance Criteria

- [ ] Reads .docs-config.json for sourceMappings
- [ ] Compares modification timestamps of source files vs doc pages
- [ ] Checks sidebar completeness
- [ ] Discovers new source matches via glob expansion
- [ ] Performs agent-readiness audit (frontmatter, terminology, self-containment)
- [ ] Outputs structured JSON report (FreshnessReport interface)
