---
type: feature
project: dot-skills
created: 2026-02-07
priority: low
session: https://claude.ai/code/session_016Jefer6qYgWUtmiEcaC143
git-ref: b3aa6dd
branch:
workstream: github-pages-astro
depends-on: [infra--gh-pages-plugin-scaffold]
depends-on-workstreams: []
tags: [script, validation]
---

# Script: link-validator.ts

## Description

Implement the Bun script that validates internal links in the built site output.

## Acceptance Criteria

- [ ] Crawls built site output (dist/ directory)
- [ ] Validates all internal links resolve to existing pages
- [ ] Validates anchor links point to existing headings
- [ ] Detects broken image references
- [ ] Outputs list of broken links with source page and target
