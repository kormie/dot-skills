#!/usr/bin/env bash
# get-chat-id.sh — Stop OpenClaw, sniff a Telegram group chat ID, restart
#
# Usage: bash get-chat-id.sh <bot-token>
#
# Output (last two lines):
#   CHAT_ID=<id>
#   CHAT_TITLE=<title>

set -euo pipefail

BOT_TOKEN="${1:?Usage: get-chat-id.sh <bot-token>}"

COMPOSE_CMD="sudo docker compose -p clax-verbotten -f /docker/clax-verbotten/docker-compose.yml"

cleanup() {
    echo ""
    echo "Starting OpenClaw container back up..."
    $COMPOSE_CMD start openclaw >/dev/null 2>&1 || true
    echo "Container started."
}
trap cleanup EXIT

# Step 1: Stop the container so we can poll Telegram
echo "Stopping OpenClaw container (only one process can poll Telegram at a time)..."
$COMPOSE_CMD stop openclaw >/dev/null 2>&1

# Step 2: Clear any stale updates
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1" >/dev/null

echo ""
echo "============================================"
echo "  Container stopped. Now send a message"
echo "  in the target Telegram group."
echo ""
echo "  Press ENTER here once you've sent it."
echo "============================================"
echo ""

read -r

# Step 3: Fetch updates
echo "Fetching Telegram updates..."
UPDATES=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates")

# Check if we got any results
OK=$(echo "$UPDATES" | jq -r '.ok')
COUNT=$(echo "$UPDATES" | jq '.result | length')

if [ "$OK" != "true" ] || [ "$COUNT" -eq 0 ]; then
    echo "ERROR: No updates found. Make sure you sent a message in the group after the container was stopped." >&2
    exit 1
fi

# Step 4: Find group messages (chat.type == "group" or "supergroup")
GROUP_MSG=$(echo "$UPDATES" | jq -r '
    [.result[]
     | select(.message.chat.type == "group" or .message.chat.type == "supergroup")
     | .message.chat]
    | last')

if [ "$GROUP_MSG" = "null" ] || [ -z "$GROUP_MSG" ]; then
    echo "ERROR: No group messages found in updates. Found these chats:" >&2
    echo "$UPDATES" | jq -r '.result[].message.chat | "\(.type): \(.title // .first_name) (\(.id))"' >&2
    exit 1
fi

CHAT_ID=$(echo "$GROUP_MSG" | jq -r '.id')
CHAT_TITLE=$(echo "$GROUP_MSG" | jq -r '.title')

echo ""
echo "Found group: ${CHAT_TITLE} (${CHAT_ID})"
echo ""
echo "CHAT_ID=${CHAT_ID}"
echo "CHAT_TITLE=${CHAT_TITLE}"
