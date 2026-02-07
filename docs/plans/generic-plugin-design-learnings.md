# Designing Generic Plugins for the dot-skills Marketplace

**Date:** 2026-02-07
**Context:** Lessons learned during the `github-pages-astro` plugin spec process, applicable to all future plugin development in the marketplace.

## The Core Tension

Plugins in the dot-skills marketplace are **installed once, used everywhere**. A user adds a plugin to their Claude Code settings, and it loads from the marketplace cache (`CLAUDE_PLUGIN_ROOT`) in every session, across every repo they work in. This creates a fundamental tension:

**The plugin code is shared and read-only, but every repo is different.**

Skills, commands, hooks, and scripts all live in the cached plugin directory. They cannot be customized per-repo. Yet the plugin must somehow adapt to each repo's unique structure, conventions, and terminology.

## The Pattern: Generic Plugin + Per-Repo Config

The resolution is a clean separation:

| Layer | Location | Owns |
|-------|----------|------|
| **Plugin code** | `CLAUDE_PLUGIN_ROOT` (marketplace cache) | Generic logic, framework knowledge, conventions, tooling |
| **Per-repo config** | `CLAUDE_PROJECT_DIR/<config-file>` | Repo-specific paths, mappings, terminology, feature flags |
| **Per-repo state** | Files in the repo itself | Content, data, artifacts the plugin creates or manages |

A `/init` command bridges the two layers — it scans the repo, asks the user a few questions, and generates the config file that all other commands and hooks read.

### How kanban-skill fits this pattern

The kanban-skill plugin demonstrates the same separation, though less explicitly:

| Layer | kanban-skill example |
|-------|---------------------|
| **Plugin code** | `plugins/kanban-skill/` — server, commands, skills, hooks |
| **Per-repo config** | `KANBAN_ROOT` env var points to the kanban directory. The `serve.md` command reads `CLAUDE_PROJECT_DIR` to find the data. |
| **Per-repo state** | `kanban/` directories with ticket markdown files |

The kanban-skill is simpler because its per-repo config is minimal (just a directory path). But the principle is the same: the plugin doesn't hardcode paths or assume a specific repo structure.

If kanban-skill were being designed today with this pattern fully in mind, it might have:
- A `.kanban-config.json` in each repo (column names, ticket types, priority levels, workstream conventions)
- A `/kanban-init` command that scaffolds the `kanban/` directory structure and generates the config
- Skills that read the config for terminology and conventions rather than hardcoding them

## Common Mistakes (and How to Avoid Them)

These are the patterns that emerged as traps during the `github-pages-astro` spec process:

### 1. Putting repo-specific details in skill files

**Wrong:** A SKILL.md that says "Content lives in `site/src/content/docs/`" or "Base path is `/dot-skills/`."

**Right:** A SKILL.md that says "Read `.docs-config.json` to find the site directory and base URL. Content lives in `<site.directory>/<site.contentDir>/`."

Skills are loaded from the plugin cache. They're the same file in every repo. Any repo-specific detail in a skill is wrong — it will be misleading in every other repo.

**Test:** Read your SKILL.md and ask: "Would this be correct in a completely different repo with a different name, structure, and purpose?" If not, the specific detail needs to move to the config file.

### 2. Hardcoding source-of-truth relationships

**Wrong:** A freshness check that looks for changes in `plugins/kanban-skill/server/api.ts` and flags `guides/api-reference.md` as stale.

**Right:** A freshness check that reads `sourceMappings` from the config and checks whatever the user has declared.

The plugin doesn't know what's in the repo. It shouldn't guess. The config file is where the user declares "these source files inform these doc pages," and the plugin validates those declared relationships.

### 3. Assuming directory structure

**Wrong:** A hook that checks `if modified files touch plugins/`:

**Right:** A hook that checks `if modified files match any source pattern in sourceMappings`:

The repo might not have a `plugins/` directory. It might be a monorepo, a library, or a CLI tool. The plugin must work with whatever structure the config describes.

### 4. Building features that require per-repo generation

**Wrong:** "The `/docs-init` command generates a custom SKILL.md tailored to this repo's structure."

**Right:** "The `/docs-init` command generates `.docs-config.json`. The SKILL.md (which lives in the plugin cache) instructs Claude to read the config for repo-specific details."

You cannot write files into the plugin cache — it's shared. And you shouldn't need to. The config file is the customization mechanism.

### 5. Thinking about "your repo" instead of "any repo"

This is the meta-mistake that causes all the others. When designing a plugin, you're naturally thinking about the repo you're working in right now. Every example, every path, every convention comes from your current context.

**Discipline:** After writing any component (skill, command, hook, script), mentally transplant it to a completely different project — a React app, a Python CLI, a Rust library. Does it still make sense? Does it reference things that don't exist in those projects?

## The Config File as a Contract

The per-repo config file is the most important design artifact. It's the contract between the generic plugin and each specific repo:

### What belongs in the config:
- **Paths** — where things live in this repo (site directory, content directory, source files)
- **Mappings** — relationships between source files and their documentation
- **Terminology** — project-specific vocabulary and synonyms
- **Feature flags** — which optional behaviors to enable
- **Conventions** — section purposes, naming patterns, categorization schemes

### What does NOT belong in the config:
- **Framework knowledge** — how Astro works, how Starlight renders pages, how `llms.txt` is generated. This is universal and belongs in skills.
- **Tooling commands** — `bun install`, `bunx astro build`. These are constants, not per-repo variables.
- **Writing conventions** — "use self-contained sections", "strict heading hierarchy". These are plugin-level standards.
- **Plugin logic** — how to check freshness, how to validate links. The algorithm is generic; only the inputs (from the config) vary.

### Config design principles:
1. **Declarative, not imperative** — the config says what exists and what maps to what. It doesn't say how to check or what to do.
2. **Globs over exhaustive lists** — `src/lib/**/*.ts` is better than listing every file. The config stays relevant as the repo grows.
3. **Reasonable defaults** — a minimal config should work. Advanced fields are optional.
4. **Human-editable** — the config is JSON (or YAML) that a developer can read and tweak. It's not a generated blob.

## The `/init` Command Pattern

Every plugin that needs per-repo configuration should have an init command:

1. **Detect existing state** — does the config already exist? Does the managed content (site, kanban board, etc.) already exist?
2. **Scan the project** — read README, package.json, directory structure to infer reasonable defaults
3. **Confirm with the user** — present the inferred config and let the user adjust
4. **Generate the config file** — write the config to the project root
5. **Scaffold managed content** (if needed) — create directories, starter files, workflows
6. **Update discovery files** — add references to CLAUDE.md, README, etc.

The init command should be **idempotent** — running it on a repo that's already set up should detect the existing state and only fill in missing pieces.

## Checklist for New Plugin Design

Before writing any code, answer these questions:

- [ ] What is universal to the framework/tool, and what varies per repo?
- [ ] What config does each repo need to provide?
- [ ] Does the plugin have a `/init` command that generates the config?
- [ ] Do all skills read the config instead of hardcoding paths/names/conventions?
- [ ] Do all hooks and commands degrade gracefully when the config doesn't exist?
- [ ] Would this plugin work correctly in a repo with a completely different structure?
- [ ] Is the config file human-readable and editable?
- [ ] Are framework concepts taught in skills (universal) vs. repo details in config (specific)?
