# Plugin Spec: github-pages-astro

**Date:** 2026-02-06
**Status:** Draft
**Plugin location:** `plugins/github-pages-astro/`

## Problem

The dot-skills repo has an Astro + Starlight documentation site (`site/`) deployed to GitHub Pages. Today, keeping docs in sync with code is entirely manual — Claude has no awareness of the doc site's structure, conventions, or build process. Docs drift out of date as plugins evolve, new features go undocumented, and build errors go unnoticed until CI fails.

Beyond that, the current docs are written for humans only. AI coding agents — Claude Code, Copilot, Cursor, etc. — increasingly consume project documentation to provide context, but human-optimized docs are a poor fit. They rely on narrative flow, implicit context, visual hierarchy, and cross-references that agents can't leverage. There's no `llms.txt`, no machine-readable summary, and no content written for chunk-based retrieval.

## Goal

A Claude Code plugin that gives Claude full knowledge of the doc site and the tools to maintain it: add pages, update content, validate builds, and keep documentation in sync with the codebase.

**Critically, the plugin should maintain two parallel documentation tracks:**

1. **Human docs** — The existing Starlight site with rich navigation, progressive disclosure, and visual design. Deployed to GitHub Pages.
2. **Agent docs** — Machine-optimized content following the `llms.txt` standard, with self-contained pages, explicit context, consistent terminology, and structured metadata. Generated at build time alongside the human site.

The two tracks share a single source of truth but produce different outputs. The human site renders to HTML; the agent track renders to `llms.txt`, `llms-full.txt`, and `llms-small.txt` plus per-page Markdown endpoints.

## Existing Infrastructure

Before designing the plugin, here's what already exists:

| Asset | Location | Notes |
|-------|----------|-------|
| Astro + Starlight site | `site/` | Scaffolded with content, sidebar config, and base/site URLs |
| Content pages | `site/src/content/docs/` | 9 pages across 3 sections (getting-started, guides, reference) |
| Astro config | `site/astro.config.mjs` | Sidebar structure, site URL, social links |
| GitHub Actions (deploy) | `.github/workflows/deploy-docs.yml` | Deploys on push to `main` when `site/**` or `docs/**` change |
| GitHub Actions (PR check) | `.github/workflows/docs-pr-check.yml` | Build check on PRs touching `site/**` or `docs/**` |
| Design docs | `docs/plans/` | Existing design documents (potential doc source material) |
| API reference | `docs/api-reference.md` | Standalone API docs (already mirrored into the site) |

## Bun-Everywhere Policy

All JavaScript/TypeScript tooling in this repo uses **Bun** as the single runtime, package manager, test runner, and bundler. No npm, no npx, no Node-specific tooling.

| Concern | Tool | Notes |
|---------|------|-------|
| Package manager | `bun install` | Replaces `npm ci` / `npm install`. Lockfile: `bun.lock` |
| Runtime | `bun run` | Replaces `node`. Runs TypeScript natively, no compilation step |
| Test runner | `bun test` | Built-in, Jest-compatible. No separate test framework needed |
| Bundler | `bun build` | Available if needed for custom build steps |
| Script execution | `bun run <script>` | For `package.json` scripts and direct `.ts` file execution |
| Dev server | `bunx astro dev` | Replaces `npx`. Runs Astro CLI through Bun |
| Build | `bunx astro build` | Replaces `npx astro build` |

**Migration required in existing infrastructure:**
- `site/package.json` — no changes needed (scripts are tool-agnostic: `astro dev`, `astro build`)
- `.github/workflows/deploy-docs.yml` — replace `npm ci` with `bun install`, `npx astro build` with `bunx astro build`, add Bun setup step
- `.github/workflows/docs-pr-check.yml` — same changes
- `site/.gitignore` — add `bun.lock` tracking (Bun lockfiles should be committed)

**Why Bun everywhere:**
- Already the runtime for kanban-skill's server
- Native TypeScript execution eliminates build steps for scripts
- Faster installs and execution than npm/node
- Single tool to learn and configure

---

## Dual Documentation Architecture

### The `llms.txt` Standard

The site will implement the [`llms.txt` proposal](https://llmstxt.org/) — a convention for providing LLM-friendly documentation alongside human-facing sites. Three files are generated at build time:

| File | Purpose | Size target |
|------|---------|-------------|
| `/llms.txt` | Navigation index — links with brief descriptions. Table of contents for agents. | Small (fits any context window) |
| `/llms-full.txt` | Complete documentation concatenated into a single Markdown file. For deep ingestion or RAG. | Full corpus |
| `/llms-small.txt` | Ultra-compact version for constrained context windows. Core concepts only. | Minimal |

### Implementation: `starlight-llms-txt` Plugin

The [`starlight-llms-txt`](https://github.com/delucis/starlight-llms-txt) plugin (by Astro core team member Chris Swithinbank, ~17K weekly downloads) generates all three files at build time from existing Starlight content. Configuration in `astro.config.mjs`:

```js
import starlightLlmsTxt from 'starlight-llms-txt';

export default defineConfig({
  integrations: [
    starlight({
      plugins: [
        starlightLlmsTxt({
          projectName: 'dot-skills',
          // Filter out verbose reference pages from the small version
          // customSet: (pages) => pages.filter(p => !p.slug.startsWith('reference/'))
        }),
      ],
    }),
  ],
});
```

This is the foundation — it gets us the `llms.txt` files for free from existing content. But the real value comes from writing content that works well for both audiences.

### Content Authoring for Dual Audiences

The fundamental insight: **AI reads documentation as isolated chunks, not as a continuous document.** Every section must be independently meaningful when extracted from its surrounding context.

This means human docs and agent docs diverge in specific ways:

| Dimension | Human-Optimized | Agent-Optimized |
|-----------|----------------|--------------|
| **Reading mode** | Sequential/scanning, follows visual hierarchy | Chunk-based retrieval, pattern-matches against queries |
| **Context** | Readers accumulate context across sections | Each chunk must be self-contained |
| **Terminology** | Stylistic variation acceptable | Strict consistency required (same term everywhere) |
| **References** | "As mentioned above", "see the previous section" | Explicit: "As described in the Ticket Format reference, tickets use `<type>--<slug>.md` naming" |
| **Density** | Balanced — explanation, examples, narrative | High density — concise, direct, no filler |
| **Metadata** | Implicit in URL, breadcrumbs, sidebar position | Explicit frontmatter: content type, version, scope |
| **Prose style** | Pronouns ("it", "this"), relative references | Explicit nouns, no vague antecedents |

### Strategy: Single Source, Dual Optimization

Rather than maintaining completely separate content trees, we optimize the shared source to work for both audiences:

**1. Structural rules (help both audiences):**
- One concept per page
- Strict heading hierarchy (never skip levels)
- Self-contained sections that stand alone when extracted
- Consistent terminology across all pages
- Fenced code blocks with language identifiers

**2. Agent-specific additions:**
- Rich frontmatter on every page (content type, scope, related pages)
- Opening summary paragraph on every page that restates the full context
- No implicit references — always name the thing being discussed
- Alt text on any images or diagrams (multimodal agents parse this)

**3. Agent-specific generated artifacts (build-time):**
- `llms.txt` / `llms-full.txt` / `llms-small.txt` via the Starlight plugin
- Per-page `.md` endpoints (Starlight can serve raw Markdown)

**4. Content that diverges enough to warrant separate pages:**
- A dedicated "AI Agent Quick Reference" page — a single dense page with every convention, format, and rule that an agent needs to work with dot-skills. This is the page an agent would read to get full project context in one shot.
- This page lives in the human site too (under Reference) but is written in agent-optimized style: no narrative, pure structured data, every term defined inline.

### Proposed Frontmatter Extensions

Add optional frontmatter fields to content pages for agent consumption:

```yaml
---
title: Ticket Format
description: YAML frontmatter fields, naming conventions, and type prefixes for kanban tickets.
content-type: reference        # reference | guide | tutorial | overview
scope: kanban-skill            # which plugin this documents
ai-summary: >
  Kanban tickets are Markdown files named <type>--<slug>.md stored in
  kanban/{todo,in-progress,ready-to-review,done}/. Required frontmatter:
  type, project, created, priority. Optional: workstream, depends-on,
  depends-on-workstreams, tags.
related:
  - getting-started/overview
  - guides/kanban-board
---
```

The `ai-summary` field gives agents a pre-written chunk they can use without parsing the full page. The `content-type` and `scope` fields help agents filter for relevant pages. `related` makes the link graph explicit.

---

## Plugin Structure

```
plugins/github-pages-astro/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── docs-dev.md          # Start Astro dev server (via bunx)
│   ├── docs-build.md        # Build site and report errors (via bunx)
│   └── docs-sync.md         # Check docs freshness against codebase
├── skills/
│   ├── docs-site/
│   │   └── SKILL.md          # Site structure, conventions, content authoring
│   └── dual-docs/
│       └── SKILL.md          # Agent-optimized writing conventions
├── hooks/
│   ├── hooks.json
│   ├── docs-freshness-check.sh   # Stop hook: remind about doc updates
│   └── stop-dev-server.sh        # SessionEnd hook: kill astro dev
└── scripts/
    ├── freshness-check.ts    # Compare code state to doc state (bun run)
    └── link-validator.ts     # Validate internal links (bun run)
```

---

## Components

### 1. Skill: `docs-site`

**File:** `skills/docs-site/SKILL.md`

Teaches Claude everything it needs to author and maintain the doc site. Active whenever Claude works on documentation or modifies code that has corresponding docs.

**Content the skill should cover:**

#### Site architecture
- Astro + Starlight framework, content lives in `site/src/content/docs/`
- Content collection defined in `site/src/content.config.ts` (standard Starlight `docsLoader`)
- `starlight-llms-txt` plugin generates `llms.txt`, `llms-full.txt`, `llms-small.txt` at build time
- No custom components yet — just Starlight built-ins (`Card`, `CardGrid`, `LinkCard`)
- Build: `bun install && bunx astro build` from `site/`
- Dev server: `bunx astro dev` from `site/`
- Base path: `/dot-skills/` (all absolute links must include this prefix)

#### Content conventions
- Pages are `.md` or `.mdx` files under `site/src/content/docs/`
- Required frontmatter: `title`, `description`
- Optional Starlight frontmatter: `sidebar.order`, `sidebar.badge`, `tableOfContents`, `template`
- The landing page (`index.mdx`) uses `template: splash` and imports Starlight components
- All other pages use the default `doc` template (no explicit `template` field needed)

#### Sidebar management
- Sidebar is defined manually in `site/astro.config.mjs` (not autogenerated)
- Every new content page MUST have a corresponding entry in the sidebar config
- Sidebar structure mirrors the content directory: `getting-started/`, `guides/`, `reference/`
- Sidebar entries use `slug` (not `link`) pointing to the content path without file extension

#### Section purposes
| Section | Path | What belongs here |
|---------|------|-------------------|
| Getting Started | `getting-started/` | Overview, installation, quickstart — entry points for new users |
| Guides | `guides/` | Task-oriented walkthroughs (using the kanban board, workstreams, API) |
| Reference | `reference/` | Exhaustive technical details (plugin structure, ticket format, design docs) |

#### Writing style
- Use second person ("you") for guides, third person for reference docs
- Keep pages focused — one concept per page
- Use tables for structured data (frontmatter fields, API endpoints, etc.)
- Use code blocks with language tags for examples
- Internal links use the full path with base prefix: `/dot-skills/guides/kanban-board/`
- No trailing slashes in source-level links (Astro handles this)

#### Relationship to source-of-truth files
- `CLAUDE.md` is the canonical source for project conventions — reference pages should reflect it
- `docs/api-reference.md` is the canonical API reference — `guides/api-reference.md` should mirror it
- SKILL.md files in `plugins/kanban-skill/skills/` are canonical for board conventions and ticket picking — guides and reference pages should stay consistent
- Design docs in `docs/plans/` can be summarized or linked from `reference/design-docs.md`

### 1b. Skill: `dual-docs`

**File:** `skills/dual-docs/SKILL.md`

Teaches Claude the principles and conventions for writing documentation that serves both human readers and AI agents. Active alongside `docs-site` whenever Claude authors or edits documentation content.

**Content the skill should cover:**

#### The dual-audience model
- Every content page is authored once but consumed two ways: rendered HTML for humans, raw Markdown for agents
- The `starlight-llms-txt` plugin auto-generates `llms.txt`, `llms-full.txt`, `llms-small.txt` from content pages at build time
- Agent-optimized content follows the same source files — no separate content tree to maintain

#### Writing rules for agent compatibility
- **Self-contained sections** — every section must make sense when extracted in isolation. No "as mentioned above" or "see the previous section." Always name the thing explicitly.
- **Consistent terminology** — if it's called a "ticket" on one page, never call it a "card" or "item" elsewhere. Pick one term and use it everywhere.
- **Explicit nouns over pronouns** — avoid "it", "this", "these" when the antecedent could be ambiguous. Repeat the noun.
- **No implicit context** — don't assume the reader has read other pages. State prerequisites and definitions inline.
- **Dense opening paragraphs** — every page starts with a 2-3 sentence summary that restates the full context: what this page covers, what system it's part of, and why it matters. This is the chunk agents are most likely to retrieve.
- **Strict heading hierarchy** — never skip levels (H1 → H3). Agents build semantic maps from heading structure.
- **Fenced code blocks with language tags** — always. Agents parse these for executable examples.

#### Required frontmatter for agent consumption
Every content page must include these frontmatter fields:

```yaml
---
title: <Page Title>
description: <1-2 sentence description, optimized for search/retrieval>
content-type: reference | guide | tutorial | overview
scope: kanban-skill | github-pages-astro | project
ai-summary: >
  <3-5 sentence dense summary of the entire page content,
  written for an agent that will not read the full page.
  Include key facts, formats, and rules.>
related:
  - <slug of related page 1>
  - <slug of related page 2>
---
```

#### The AI Agent Quick Reference page
- A single dedicated page at `reference/agent-quick-reference.md`
- Contains every convention, format, and rule needed to work with dot-skills
- Written entirely in agent-optimized style: no narrative, structured data, every term defined inline
- This is the page agents should read first for full project context in one shot
- Think of it as `CLAUDE.md` but more comprehensive and publicly accessible

### 2. Command: `docs-dev`

**File:** `commands/docs-dev.md`

```yaml
---
name: docs-dev
description: Start the documentation site dev server for live preview
allowed-tools: [Bash]
---
```

**Behavior:**
1. Check that Bun is installed
2. Run `bun install` in `site/` if `node_modules/` doesn't exist
3. Start `bunx astro dev` in the background from `site/`
4. Save PID to `site/.astro-dev.pid`
5. Report the local URL (`http://localhost:4321/dot-skills/`)
6. Inform the user the server will auto-stop when the session ends

### 3. Command: `docs-build`

**File:** `commands/docs-build.md`

```yaml
---
name: docs-build
description: Build the documentation site and report any errors
allowed-tools: [Bash]
---
```

**Behavior:**
1. Run `bun install` in `site/` if needed
2. Run `bunx astro build` in `site/`
3. If build succeeds: report success and output path (`site/dist/`), confirm `llms.txt` files were generated
4. If build fails: display the full error output and suggest fixes
5. Validate that `llms.txt`, `llms-full.txt`, and `llms-small.txt` exist in `site/dist/`
6. Optionally run link validation (see scripts section)

### 4. Command: `docs-sync`

**File:** `commands/docs-sync.md`

```yaml
---
name: docs-sync
description: Check documentation freshness against the codebase
allowed-tools: [Bash, Read, Glob, Grep]
---
```

**Behavior:**

This is the most interesting command. It performs a freshness audit covering both human and agent docs:

**Content freshness:**
1. **Sidebar completeness** — Verify every `.md`/`.mdx` file in `site/src/content/docs/` has a sidebar entry in `astro.config.mjs`, and vice versa
2. **API reference drift** — Compare `docs/api-reference.md` (canonical) with `site/src/content/docs/guides/api-reference.md` to detect divergence
3. **Plugin structure drift** — Compare actual plugin directory layout against what `reference/plugin-structure.md` documents
4. **CLAUDE.md drift** — Check if `CLAUDE.md` conventions match what the overview and reference pages describe
5. **Missing docs for new plugins** — If `plugins/` contains directories not covered in the docs, flag them

**Agent-readiness audit:**
6. **Frontmatter completeness** — Check that every content page has the required agent frontmatter fields (`content-type`, `scope`, `ai-summary`, `related`)
7. **Self-containment check** — Scan for anti-patterns: "as mentioned above", "see above", "the previous section", vague pronouns at section starts
8. **Terminology consistency** — Flag pages that use different terms for the same concept (basic heuristic: check a known synonym list like ticket/card/item, column/status/stage)
9. **Agent quick reference freshness** — Verify `reference/agent-quick-reference.md` reflects current state of all plugins

Output: A report listing stale/missing/diverged docs with suggested actions, grouped by human-facing issues and agent-readiness issues.

### 5. Hook: `docs-freshness-check` (Stop)

**File:** `hooks/docs-freshness-check.sh`

**Trigger:** Stop (runs when Claude tries to end a turn)

**Logic:**
1. Check `git diff --name-only HEAD` for files modified in this session
2. If modifications touch `plugins/`, `CLAUDE.md`, or `docs/api-reference.md`:
   - Check whether corresponding doc pages in `site/src/content/docs/` were also modified
   - If not: exit code 2 with a message reminding Claude to update docs
3. If no relevant source files changed, or if docs were also updated: exit 0

This is a soft enforcement — it flags when code changes likely need doc updates but doesn't block on every change. The heuristic:

| Source change | Expected doc update |
|---------------|-------------------|
| `plugins/kanban-skill/server/api.ts` | `guides/api-reference.md` |
| `plugins/kanban-skill/skills/*/SKILL.md` | `guides/kanban-board.md` or `guides/workstreams.md` |
| `plugins/kanban-skill/commands/*.md` | `reference/plugin-structure.md` |
| `plugins/kanban-skill/hooks/*` | `reference/plugin-structure.md` |
| `CLAUDE.md` | `getting-started/overview.md`, `reference/*` |
| New plugin directory | Flag as needing new doc pages |

**Important design decision:** This hook should be conservative. It should only fire when there's a clear signal that docs are stale — not on every code change. False positives train users to ignore the hook.

### 6. Hook: `stop-dev-server` (SessionEnd)

**File:** `hooks/stop-dev-server.sh`

**Trigger:** SessionEnd

**Logic:**
1. Check for `site/.astro-dev.pid`
2. If found, read PID and kill the process
3. Fallback: `pkill -f "astro dev"` scoped to the site directory
4. Remove PID file

Mirrors the pattern from kanban-skill's `stop-server-on-exit.sh`.

### 7. Scripts

Utility scripts that commands invoke. These live in `scripts/` rather than `hooks/` because they're tools, not lifecycle hooks.

#### `freshness-check.ts`

A Bun script that implements the freshness audit logic for `docs-sync`. Extractable into a script so both the command and the hook can share logic.

**Inputs:** Project root path
**Output:** JSON report of stale/missing/diverged items

```typescript
interface FreshnessReport {
  sidebarOrphans: string[];      // sidebar entries with no matching file
  undocumentedPages: string[];   // content files with no sidebar entry
  stalePages: StaleItem[];       // pages that may be out of date
  missingPluginDocs: string[];   // plugin dirs with no doc coverage
}

interface StaleItem {
  docPage: string;
  sourceFile: string;
  reason: string;  // e.g., "source modified more recently than doc"
}
```

#### `link-validator.ts`

A Bun script that crawls the built site output (`site/dist/`) and validates:
- All internal links resolve to existing pages
- Anchor links (`#section`) point to existing headings
- No broken image references

**Inputs:** Path to `site/dist/`
**Output:** List of broken links with source page and target

---

## Marketplace Registration

Add the new plugin to `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    { "name": "kanban-skill", ... },
    {
      "name": "github-pages-astro",
      "source": "./plugins/github-pages-astro",
      "description": "Documentation site management for Astro + Starlight on GitHub Pages",
      "version": "1.0.0",
      "author": { "name": "David Kormushoff" }
    }
  ]
}
```

## Plugin Registration

**File:** `plugins/github-pages-astro/.claude-plugin/plugin.json`

```json
{
  "name": "github-pages-astro",
  "description": "Documentation site management for Astro + Starlight on GitHub Pages",
  "version": "1.0.0",
  "author": { "name": "David Kormushoff" },
  "hooks": "./hooks/hooks.json"
}
```

---

## Design Decisions & Open Questions

### Decisions made

1. **Separate plugin, not part of kanban-skill.** The doc site is a distinct concern. Keeping it as its own plugin means it can be enabled/disabled independently and reused in other repos with Astro + Starlight sites.

2. **Soft doc-freshness enforcement via Stop hook.** The hook reminds but doesn't hard-block. Hard-blocking would be too aggressive — not every code change needs a doc update, and the heuristic can't be perfect.

3. **Sidebar is manually managed, not autogenerated.** Starlight supports autogenerated sidebar from directory structure, but manual control gives better labeling and ordering. The plugin should validate that sidebar entries and files stay in sync rather than trying to autogenerate.

4. **Freshness check as both command and hook.** The `/docs-sync` command gives a full audit on demand. The Stop hook does a lightweight version (just checks git diff overlap). They share logic via `scripts/freshness-check.ts`.

5. **Bun everywhere.** Bun is the sole JS/TS toolchain across the entire repo — runtime, package manager, test runner, bundler. No npm, no npx, no Node-specific tooling. This applies to the doc site, all plugin scripts, CI workflows, and any future JS/TS code.

6. **Single source, dual output.** Human and agent docs come from the same content files. Agent-optimized artifacts (`llms.txt` files) are generated at build time by `starlight-llms-txt`. There is no separate agent content tree to maintain.

7. **`starlight-llms-txt` for agent discovery.** Rather than building custom agent-doc generation, use the established Starlight plugin. It's maintained by an Astro core team member, handles the full `llms.txt` spec, and integrates cleanly with the existing build.

8. **Agent optimization is a writing discipline, not a tool.** The `dual-docs` skill teaches Claude how to write content that works for both audiences. The tooling validates compliance (`docs-sync` agent-readiness audit) but the content itself is authored once in a dual-compatible style.

9. **Dedicated Agent Quick Reference page.** One dense, structured page that gives any AI agent full project context in a single read. This is the highest-value agent-facing content — more useful than `llms-full.txt` for coding agents because it's curated, not concatenated.

### Open questions

1. **Should the skill cover Astro/Starlight generically or be specific to this repo?** Current spec is repo-specific (documents this site's sections, conventions, base path). A more generic version could teach Claude Astro/Starlight in general and be parameterized per-repo. Starting repo-specific is simpler; can generalize later if reuse demand emerges.

2. **Should `docs-sync` auto-fix or just report?** Current spec is report-only. Auto-fix (e.g., copying `docs/api-reference.md` into the site content) is tempting but risky — the site version may have Starlight-specific formatting that a raw copy would break. Recommend: report only, let Claude decide how to fix.

3. **Should the plugin manage the GitHub Actions workflows?** The workflows need updating to use Bun instead of npm/Node. The plugin could own this migration and validate the workflows stay correct. Leaning toward: yes, include workflow migration as an implementation step, but don't make the plugin responsible for ongoing workflow validation.

4. **How should the freshness check handle new plugins?** When a new plugin is added to `plugins/`, the check should flag that no doc pages exist for it. But should it also generate a doc stub? Leaning toward just flagging — stub generation is better handled by Claude in context.

5. **Should `/docs-dev` open the browser automatically?** The kanban `/serve` command does. Whether this is desirable depends on the environment (works in desktop Claude Code, not in headless/SSH sessions). Could gate on `DISPLAY` or `BROWSER` env var.

6. **How strict should agent-readiness enforcement be?** The `docs-sync` audit checks for agent frontmatter and self-containment patterns. Should missing `ai-summary` fields block a PR, or just produce warnings? Leaning toward warnings-only initially — let the discipline develop before enforcing.

7. **Should `llms-small.txt` exclude certain sections?** The `starlight-llms-txt` plugin supports filtering. Verbose reference pages (like full API endpoint listings) may be better excluded from the small version to keep it within tight context windows. Need to experiment with what fits.

8. **MCP server for docs?** Beyond static `llms.txt` files, an MCP server could expose documentation dynamically — agents could query for specific topics rather than ingesting the full corpus. This is a future enhancement, not in scope for v1, but worth keeping in mind as the content grows.

---

## Implementation Order

Recommended build sequence:

### Phase 1: Foundation
1. **Bun migration for `site/`** — Replace `npm` lockfile with `bun.lock`, verify `bun install && bunx astro build` works, update `.github/workflows/` to use Bun
2. **Install `starlight-llms-txt`** — `bun add starlight-llms-txt` in `site/`, configure in `astro.config.mjs`, verify `llms.txt` files appear in build output
3. **Plugin scaffold** — Create directory structure, `plugin.json`, empty `hooks.json`

### Phase 2: Skills (highest value, no dependencies)
4. **Skill: `docs-site`** — Write the SKILL.md with full site knowledge (updated for Bun and llms.txt)
5. **Skill: `dual-docs`** — Write the SKILL.md with dual-audience writing conventions

### Phase 3: Commands and hooks
6. **Command: `docs-dev`** — Dev server command (via `bunx`) + SessionEnd hook to clean up
7. **Command: `docs-build`** — Build command with `llms.txt` validation
8. **Command: `docs-sync`** — Freshness audit including agent-readiness checks
9. **Script: `freshness-check.ts`** — Shared freshness logic (runs via `bun run`)
10. **Hook: `docs-freshness-check`** — Stop hook using freshness logic
11. **Script: `link-validator.ts`** — Post-build link validation (runs via `bun run`)

### Phase 4: Content
12. **Add agent frontmatter to existing pages** — Add `content-type`, `scope`, `ai-summary`, `related` to all 9 existing content pages
13. **Write Agent Quick Reference page** — `reference/agent-quick-reference.md` — the single-page dense summary for AI agents
14. **Marketplace registration** — Add to `marketplace.json`
15. **Update existing docs** — Add a page about this plugin to the doc site itself

---

## Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                     Claude Code Session                        │
│                                                               │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   Commands   │  │     Skills     │  │      Hooks       │  │
│  │              │  │                │  │                  │  │
│  │ /docs-dev    │  │ docs-site:     │  │ Stop: check      │  │
│  │ starts dev   │  │ site structure │  │ doc freshness    │  │
│  │ server       │  │ & conventions  │  │ when code        │  │
│  │              │  │                │  │ changes          │  │
│  │ /docs-build  │  │ dual-docs:     │  │                  │  │
│  │ builds site  │  │ agent-friendly │  │ SessionEnd:      │  │
│  │ + validates  │  │ writing rules  │  │ stop dev server  │  │
│  │ llms.txt     │  │ & frontmatter  │  │                  │  │
│  │              │  │ conventions    │  │                  │  │
│  │ /docs-sync   │  │                │  │                  │  │
│  │ audits human │  │                │  │                  │  │
│  │ + agent docs │  │                │  │                  │  │
│  └──────┬───────┘  └────────────────┘  └────────┬─────────┘  │
│         │                                        │            │
└─────────┼────────────────────────────────────────┼────────────┘
          │                                        │
          ▼                                        ▼
   ┌──────────────┐                      ┌──────────────────┐
   │    site/     │                      │    plugins/      │
   │  (Astro +   │                      │  (source of      │
   │  Starlight  │                      │   truth for      │
   │  + llms-txt │                      │   doc content)   │
   │   plugin)   │                      └──────────────────┘
   └──────┬──────┘
          │
     bunx astro build
          │
    ┌─────┴──────┐
    ▼            ▼
┌────────┐  ┌──────────────┐
│  HTML  │  │  llms.txt    │
│  site  │  │  llms-full   │
│  for   │  │  llms-small  │
│ humans │  │  for agents  │
└───┬────┘  └──────┬───────┘
    │              │
    └──────┬───────┘
           ▼
    ┌─────────────┐
    │  GitHub     │
    │  Pages      │
    │  (serves    │
    │  both)      │
    └─────────────┘
```
