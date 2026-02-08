# Review: Command — docs-dev

**Work Item:** [feat--docs-dev-command](../ready-to-review/feat--docs-dev-command.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the /docs-dev command that starts the Astro dev server for live preview using bunx. Handles dependency installation, PID file management, and user communication.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/commands/docs-dev.md` | New command file |

## How to Verify

### Steps

1. Verify command reads .docs-config.json for site directory
2. Verify it checks for Bun, installs dependencies, starts dev server
3. Verify PID file is saved for SessionEnd cleanup
4. Verify it prints URL instead of opening browser

### Expected Results

- Reads config, falls back to suggesting /docs-init
- Uses bunx astro dev (not npx)
- Saves PID to .astro-dev.pid in site directory
- Prints URL, does not attempt browser open

## Risks / Things to Watch

- PID file path must match what stop-dev-server.sh looks for
