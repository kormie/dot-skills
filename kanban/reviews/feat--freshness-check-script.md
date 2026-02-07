# Review: Script — freshness-check.ts

**Work Item:** [feat--freshness-check-script](../ready-to-review/feat--freshness-check-script.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the Bun-native freshness check script that performs the documentation audit. Handles source mapping staleness, sidebar completeness, source coverage discovery, agent-readiness auditing (frontmatter, self-containment, terminology), and agent discovery verification. Outputs structured JSON matching the FreshnessReport interface from the plan.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/scripts/freshness-check.ts` | New script |

## How to Verify

### Steps

1. Verify the FreshnessReport output interface matches the plan spec
2. Verify source mapping staleness compares file modification times
3. Verify sidebar extraction parses astro.config.mjs slug entries
4. Verify self-containment patterns catch documented anti-patterns
5. Verify terminology check uses .docs-config.json terminology map

### Expected Results

- Outputs valid JSON FreshnessReport with all fields
- Handles missing .docs-config.json gracefully
- Expands glob patterns for source coverage discovery
- Checks all 6 anti-patterns for self-containment
- Verifies agent discovery in CLAUDE.md/AGENTS.md

## Risks / Things to Watch

- Frontmatter parsing is simplified (line-by-line YAML) — may not handle multi-line values or nested structures
- Glob expansion uses Bun's native Glob API
