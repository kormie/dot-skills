# dot-skills

Personal Claude Code plugin marketplace.

## Installation

Register this marketplace by adding to `~/.claude/plugins/known_marketplaces.json`:

```json
{
  "dot-skills": {
    "source": {
      "source": "github",
      "repo": "kormie/dot-skills"
    },
    "installLocation": "~/.claude/plugins/marketplaces/dot-skills",
    "autoUpdate": true
  }
}
```

Then enable plugins in Claude Code settings.

## Plugins

### kanban-skill

Kanban board management with web viewer for tracking work across Claude Code sessions.

**Commands:**
- `/kanban-serve` - Start web viewer at localhost:3333

**Skills:**
- `kanban-tracker` - Board management conventions
- `ticket-picker` - Select next ticket to work on
