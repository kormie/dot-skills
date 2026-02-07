# Review: Script — link-validator.ts

**Work Item:** [feat--link-validator-script](../ready-to-review/feat--link-validator-script.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Implemented the Bun-native link validator that crawls the built site output and validates internal links, anchor references, and image sources. Outputs JSON array of broken links and exits with code 1 if any are found.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/scripts/link-validator.ts` | New script |

## How to Verify

### Steps

1. Verify it finds all HTML files in the dist directory
2. Verify it extracts href from anchor tags and src from img tags
3. Verify it skips external links (http/https/mailto/tel)
4. Verify it handles both absolute and relative internal links
5. Verify anchor validation checks heading IDs in target pages

### Expected Results

- Crawls all HTML files in dist/
- Validates internal links resolve to existing files
- Validates anchor links point to existing heading IDs
- Detects broken image references
- Outputs BrokenLink[] JSON with sourcePage, target, type, reason
- Exit code 1 if broken links found, 0 if all valid

## Risks / Things to Watch

- HTML parsing uses regex rather than a proper parser — may miss edge cases with complex attribute ordering
- Does not follow redirects or handle dynamic routes
