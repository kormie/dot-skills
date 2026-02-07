# Review: Command — docs-build

**Work Item:** [feat--docs-build-command](../ready-to-review/feat--docs-build-command.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the /docs-build command that builds the Astro site and validates llms.txt output. Handles build success/failure reporting and optional link validation.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/commands/docs-build.md` | New command file |

## How to Verify

### Steps

1. Verify command reads .docs-config.json
2. Verify it runs bunx astro build
3. Verify it checks for llms.txt, llms-full.txt, llms-small.txt in output
4. Verify error handling suggests specific fixes

### Expected Results

- Reads config for site directory
- Uses bunx astro build (Bun everywhere)
- Validates all three llms.txt files exist in dist/
- Optional link validation via the link-validator.ts script
- Error output includes suggested fixes by error type

## Risks / Things to Watch

- llms.txt validation depends on starlight-llms-txt being configured in astro.config.mjs
