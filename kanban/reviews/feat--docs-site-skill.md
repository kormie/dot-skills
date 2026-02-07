# Review: Skill — docs-site

**Work Item:** [feat--docs-site-skill](../ready-to-review/feat--docs-site-skill.md)
**Branch:** claude/build-gh-pages-astro-plugin-VSGAN
**Date:** 2026-02-07

## Summary

Wrote the docs-site SKILL.md that teaches Claude how to author and maintain Astro + Starlight documentation sites. The skill is fully generic — it reads .docs-config.json for all repo-specific details and covers fundamentals, content conventions, sidebar management, source mappings, and the Bun-everywhere policy.

## Key Files

| File | What changed |
|------|-------------|
| `plugins/github-pages-astro/skills/docs-site/SKILL.md` | New skill file |

## How to Verify

### Steps

1. Read the SKILL.md and verify it covers all sections from the plan
2. Search for any hardcoded repo-specific paths or names — there should be none
3. Confirm it instructs reading .docs-config.json before any docs work

### Expected Results

- Covers: Astro/Starlight fundamentals, .docs-config.json reading, content conventions, sidebar management, section purposes, source-of-truth relationships, Bun policy, writing style
- No references to specific repos, paths like "dot-skills", or specific base URLs
- Uses `<site.directory>` style placeholders for config-driven values

## Risks / Things to Watch

- The skill should remain generic as the plugin evolves — any repo-specific detail is a bug
