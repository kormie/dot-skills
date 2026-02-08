---
slug: github-pages-astro
status: active
priority: high
created: 2026-02-07
tickets:
  - infra--gh-pages-plugin-scaffold
  - feat--docs-site-skill
  - feat--dual-docs-skill
  - feat--docs-init-command
  - feat--docs-dev-command
  - feat--docs-build-command
  - feat--docs-sync-command
  - feat--freshness-check-script
  - feat--link-validator-script
  - feat--docs-hooks
depends-on-workstreams: []
tags: [documentation, astro, github-pages]
---

# GitHub Pages Astro Plugin

## Goal

Build a reusable Claude Code plugin that gives Claude full knowledge of any repo's Astro + Starlight documentation site and the tools to maintain it: scaffold a new site, add pages, update content, validate builds, and keep documentation in sync with the codebase. Includes dual documentation tracks (human HTML + machine-readable llms.txt).

## Scope

**Included:**
- Plugin scaffold with plugin.json and hooks.json
- Two skills: docs-site (Astro/Starlight knowledge) and dual-docs (agent-optimized writing)
- Four commands: docs-init, docs-dev, docs-build, docs-sync
- Two utility scripts: freshness-check.ts, link-validator.ts
- Two hooks: docs-freshness-check (Stop), stop-dev-server (SessionEnd)
- Marketplace registration

**Excluded:**
- MCP server (future enhancement)
- Running /docs-init on dot-skills itself (Phase 4 of the plan)
- Content migration of existing site pages

## Success Criteria

- [ ] Plugin directory structure matches the spec
- [ ] All skills, commands, hooks, and scripts are implemented
- [ ] Plugin registered in marketplace.json
- [ ] Commands use Bun everywhere (no npm/npx/node)
- [ ] All components read .docs-config.json for repo-specific details
- [ ] Plugin works generically across any repo (no hardcoded paths)

## Notes

Based on the design spec at docs/plans/2026-02-06-github-pages-astro-plugin.md. Follows the generic plugin design pattern documented in docs/plans/generic-plugin-design-learnings.md.
