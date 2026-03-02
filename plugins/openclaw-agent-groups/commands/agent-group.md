---
name: agent-group
description: Bind an OpenClaw agent to a Telegram group
allowed-tools: [Bash, Read, Write, Edit, Grep, Glob]
---

# /agent-group

Bind an OpenClaw agent to a Telegram group chat. Automates the full flow: validate agent, sniff chat ID, update config, set admin title, restart, and verify.

## Usage

```
/agent-group <agent-id> [group-name]
```

- `agent-id` — The agent ID from `openclaw.json` (e.g. `research-orchestrator`)
- `group-name` — Optional hint to help identify the group in Telegram updates

## Instructions

### Step 1: Validate agent

Read the OpenClaw config:

```bash
cat ~/repos/Clax-Verbotten/data/.openclaw/openclaw.json
```

Parse `agents.list` and confirm the provided `agent-id` exists. If no agent ID was provided, list available agents and ask the user to pick one.

If the agent ID doesn't exist, show the available agents and stop.

### Step 2: Check for existing binding

Check `bindings` in the config. If the agent already has a binding to a Telegram group, warn the user and ask whether to replace it or add an additional binding.

### Step 3: Get bot token

Read the bot token from the running container:

```bash
sudo docker exec clax-verbotten-openclaw-1 printenv TELEGRAM_BOT_TOKEN
```

If the container isn't running, read it from the `.env` file:

```bash
grep TELEGRAM_BOT_TOKEN ~/repos/Clax-Verbotten/.env | cut -d= -f2
```

### Step 4: Get group chat ID

Run the helper script from the plugin:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/scripts/get-chat-id.sh" "<bot-token>"
```

The script will:
1. Stop the OpenClaw container (only one process can poll Telegram at a time)
2. Print instructions for the user to send a message in the target group
3. Wait for the user to confirm they've sent a message
4. Call the Telegram `getUpdates` API to grab the chat ID
5. Print the chat ID and group title
6. Start the container back up

Capture the chat ID and group title from the script output (last two lines: `CHAT_ID=<id>` and `CHAT_TITLE=<title>`).

If the script fails or no updates are found, ask the user to try again — they may need to send another message or check that the bot is added to the group.

### Step 5: Update openclaw.json

Make two edits to `~/repos/Clax-Verbotten/data/.openclaw/openclaw.json`:

**5a. Add group to allowlist**

Add the chat ID to `channels.telegram.groups`:

```json
"<chat-id>": {
  "requireMention": false
}
```

**5b. Add binding**

Add a new entry to the `bindings` array:

```json
{
  "agentId": "<agent-id>",
  "match": {
    "channel": "telegram",
    "peer": {
      "kind": "group",
      "id": "<chat-id>"
    }
  }
}
```

Use the `Edit` tool for surgical JSON edits. Read the file first, then make the changes. Be careful to preserve valid JSON — watch for trailing commas.

### Step 6: Set admin title (best-effort)

Try to set the bot's display title in the group to the agent's `name` field from `agents.list`:

```bash
# Get the bot's own user ID
BOT_INFO=$(curl -s "https://api.telegram.org/bot<bot-token>/getMe")
BOT_USER_ID=$(echo "$BOT_INFO" | jq -r '.result.id')

# Set the custom title
curl -s "https://api.telegram.org/bot<bot-token>/setChatAdministratorCustomTitle" \
  -d "chat_id=<chat-id>" \
  -d "user_id=$BOT_USER_ID" \
  -d "custom_title=<agent-name>"
```

This will fail if:
- The bot isn't an admin in the group
- The bot wasn't promoted by the group creator

If it fails, tell the user:
> "Couldn't set the admin title automatically. To set it manually: open the group in Telegram → tap the bot's name → Edit → set the title to `<agent-name>`."

### Step 7: Restart container

```bash
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml restart openclaw
```

Wait a few seconds for startup, then check logs:

```bash
sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml logs --tail 30 openclaw
```

### Step 8: Verify

Look in the logs for:
- The agent session being created (mentions the agent ID)
- The Telegram channel connecting
- No errors related to bindings or group config

Report the result to the user:

> **Done!** Agent `<agent-id>` is now bound to group `<group-title>` (`<chat-id>`).
>
> Messages in that group will be routed to the `<agent-id>` agent.

If there are errors in the logs, show them and suggest troubleshooting steps.

## Troubleshooting

- **"Bot is not a member of the group"**: Add the bot to the group first via Telegram
- **No updates found**: Make sure someone sent a message in the group _after_ the container was stopped
- **Admin title failed**: The bot must be promoted to admin by the group creator
- **Container won't start**: Check `docker compose logs` for config parse errors — likely a JSON syntax issue in openclaw.json
