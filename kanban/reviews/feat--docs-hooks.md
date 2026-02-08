# Review: Hooks — docs-freshness-check and stop-dev-server

**Work Item:** [feat--docs-hooks](../ready-to-review/feat--docs-hooks.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented two lifecycle hooks: a Stop hook that checks documentation freshness when source files are modified, and a SessionEnd hook that kills the Astro dev server process. Both hooks read .docs-config.json and degrade gracefully when the config doesn't exist.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/hooks/docs-freshness-check.sh` | Stop hook |
| `plugins/github-pages-astro/hooks/stop-dev-server.sh` | SessionEnd hook |
| `plugins/github-pages-astro/hooks/hooks.json` | Hook configuration |

## How to Verify

### Steps

1. Verify docs-freshness-check.sh exits 0 when no .docs-config.json exists
2. Verify it checks git diff for modified files against sourceMappings
3. Verify it exits 2 with descriptive stderr when docs are stale
4. Verify stop-dev-server.sh reads PID from .astro-dev.pid
5. Verify stop-dev-server.sh falls back to pkill if no PID file
6. Verify both scripts are executable

### Expected Results

- Freshness hook: silent pass when no config, soft block (exit 2) when source changed but docs didn't
- Dev server hook: kills process by PID, falls back to pkill, cleans up PID file
- hooks.json references both hooks with correct paths and timeouts
- Both scripts are chmod +x

## Risks / Things to Watch

- Freshness hook uses bun -e for inline JS — requires Bun to be installed
- Freshness hook's glob matching is simplified (prefix match) — may have false positives with overlapping patterns
