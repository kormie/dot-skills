# Review: Command — docs-sync

**Work Item:** [feat--docs-sync-command](../ready-to-review/feat--docs-sync-command.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the /docs-sync command that performs a comprehensive documentation freshness audit. Delegates to freshness-check.ts for the actual analysis, then presents a structured report grouped by errors, warnings, and info.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/commands/docs-sync.md` | New command file |

## How to Verify

### Steps

1. Verify command delegates to freshness-check.ts
2. Verify all audit categories from the plan are covered
3. Verify report is grouped into errors/warnings/info

### Expected Results

- Content freshness: source staleness, sidebar completeness, source coverage discovery
- Agent-readiness: frontmatter, self-containment, terminology, quick reference
- Discovery: CLAUDE.md/AGENTS.md references
- Report is presented in actionable format
- Notes that it produces reports, not auto-fixes

## Risks / Things to Watch

- Depends on freshness-check.ts producing valid JSON output
