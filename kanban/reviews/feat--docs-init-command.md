# Review: Command — docs-init

**Work Item:** [feat--docs-init-command](../ready-to-review/feat--docs-init-command.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the /docs-init slash command that scaffolds an Astro + Starlight doc site and generates .docs-config.json. Covers all 5 steps from the plan: gathering context, generating config, scaffolding site, scaffolding GitHub Actions workflows, and updating discovery files.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/commands/docs-init.md` | New command file |

## How to Verify

### Steps

1. Read the command and verify all 5 steps are documented
2. Verify the .docs-config.json template matches the spec
3. Verify GitHub Actions workflows use Bun (not npm)
4. Verify the command handles existing sites (idempotent)

### Expected Results

- Step 1: gathers project context from CLAUDE.md, README, package.json
- Step 2: generates .docs-config.json with full schema
- Step 3: scaffolds Astro site with starlight-llms-txt dependency
- Step 4: scaffolds deploy-docs.yml and docs-pr-check.yml with Bun
- Step 5: updates CLAUDE.md and suggests README updates
- Detects existing sites and skips scaffolding

## Risks / Things to Watch

- Workflows should not hardcode site directory — they reference the configured path
