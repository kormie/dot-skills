---
type: infra
project: dot-skills
created: 2026-02-07
priority: high
session: https://claude.ai/code/session_016Jefer6qYgWUtmiEcaC143
git-ref: b3aa6dd
branch: claude/build-gh-pages-astro-plugin-VSGAN
workstream: github-pages-astro
depends-on: []
depends-on-workstreams: []
tags: [plugin-scaffold, github-pages]
---

# Plugin Scaffold: github-pages-astro

## Description

Create the directory structure, plugin.json, and empty hooks.json for the github-pages-astro plugin. This is the foundation that all other tickets build upon.

## Acceptance Criteria

- [ ] Directory structure matches the spec (commands/, skills/, hooks/, scripts/, .claude-plugin/)
- [ ] plugin.json contains correct metadata
- [ ] hooks.json has empty hook arrays ready for population
- [ ] Marketplace.json updated with new plugin entry

## Context

First ticket in the github-pages-astro workstream. Establishes the plugin directory structure following the pattern set by kanban-skill.
