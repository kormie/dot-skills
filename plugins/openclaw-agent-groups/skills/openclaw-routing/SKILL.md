---
name: openclaw-routing
description: Understand OpenClaw agent routing, Telegram bindings, and the openclaw.json config structure
allowed-tools: Read, Grep, Glob
---

# OpenClaw Agent Routing

Background knowledge for working with OpenClaw's multi-agent Telegram routing.

## How Agent Routing Works

OpenClaw supports multiple agents, each with their own model, workspace, and personality. Agents are routed to specific Telegram chats via **bindings** — rules that match incoming messages to an agent based on channel type and peer ID.

When a message arrives:
1. OpenClaw checks `channels.telegram.groups` to see if the group is allowed
2. It scans `bindings` for a match on channel + peer kind + peer ID
3. If a binding matches, the message is routed to that agent's session
4. If no binding matches, the message goes to the `main` agent (default)

## openclaw.json Structure

The config lives at `data/.openclaw/openclaw.json` inside the Clax-Verbotten repo (host path: `~/repos/Clax-Verbotten/data/.openclaw/openclaw.json`).

### agents.list

Array of agent definitions:

```json
{
  "id": "research-orchestrator",
  "name": "Research Director",
  "model": "anthropic/claude-opus-4-6"
}
```

- `id` — unique identifier, used in bindings and workspace paths
- `name` — display name, used for Telegram admin title
- `model` — model alias (resolved via `agents.models.aliases`)

### channels.telegram.groups

Allowlist of Telegram group chat IDs. Only groups listed here will be processed:

```json
"groups": {
  "-5257193888": {
    "requireMention": false
  }
}
```

- Key: the Telegram chat ID (negative number for groups/supergroups)
- `requireMention`: if `true`, the bot only responds when @mentioned. If `false`, it responds to all messages.

### bindings

Array of routing rules:

```json
{
  "agentId": "research-orchestrator",
  "match": {
    "channel": "telegram",
    "peer": {
      "kind": "group",
      "id": "-5257193888"
    }
  }
}
```

- `agentId` — must match an `id` in `agents.list`
- `match.channel` — `"telegram"` or `"whatsapp"`
- `match.peer.kind` — `"group"` or `"private"`
- `match.peer.id` — the Telegram chat ID as a string

## Agent Workspaces

Each agent gets its own workspace directory:

- **Host path**: `~/repos/Clax-Verbotten/workspaces/<agent-id>/`
- **Container mount**: `/data/.openclaw/workspace-<agent-id>/`
- The `main` agent uses `workspaces/main/` → `/data/.openclaw/workspace/` (no suffix)

Workspace contents (AGENTS.md, SOUL.md, IDENTITY.md, etc.) define the agent's personality and instructions.

## Telegram Bot API Endpoints

### getUpdates

Fetch recent messages sent to the bot. Only works when no other process is polling (the OpenClaw container must be stopped first).

```
GET https://api.telegram.org/bot<token>/getUpdates
```

Returns an array of `Update` objects. Group messages have `message.chat.id` (negative number) and `message.chat.title`.

### setChatAdministratorCustomTitle

Set a custom title for the bot in a group (e.g. "Research Director"):

```
POST https://api.telegram.org/bot<token>/setChatAdministratorCustomTitle
  chat_id=<group-chat-id>
  user_id=<bot-user-id>
  custom_title=<title>
```

Requirements:
- Bot must be an administrator in the group
- Bot must have been promoted by the group creator (not another admin)
- Title max 16 characters

### getMe

Get the bot's own user info (needed for `user_id` in other calls):

```
GET https://api.telegram.org/bot<token>/getMe
```

## Clax-Specific Paths

| What | Path |
|------|------|
| OpenClaw config | `~/repos/Clax-Verbotten/data/.openclaw/openclaw.json` |
| Compose file | `/docker/clax-verbotten/docker-compose.yml` |
| Container name | `clax-verbotten-openclaw-1` |
| Bot token env var | `TELEGRAM_BOT_TOKEN` |
| Agent workspaces | `~/repos/Clax-Verbotten/workspaces/<agent-id>/` |

## Compose Commands

```bash
# Stop/start/restart
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml stop openclaw
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml start openclaw
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml restart openclaw

# Logs
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml logs --tail 30 openclaw

# Read env from running container
sudo docker exec clax-verbotten-openclaw-1 printenv TELEGRAM_BOT_TOKEN
```
