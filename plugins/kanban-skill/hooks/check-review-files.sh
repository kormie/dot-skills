#!/usr/bin/env bash
set -eo pipefail

# Stop hook: Block agent from stopping if any tickets in ready-to-review/
# are missing a corresponding review file in reviews/.
#
# Exit 0 = all good, agent can stop
# Exit 2 + stderr = block agent, stderr message fed back to Claude

KANBAN_DIR="${CLAUDE_PROJECT_DIR}/kanban"
READY_DIR="${KANBAN_DIR}/ready-to-review"
REVIEWS_DIR="${KANBAN_DIR}/reviews"

# If ready-to-review doesn't exist or is empty, nothing to check
if [[ ! -d "$READY_DIR" ]]; then
  exit 0
fi

missing=()

for ticket in "$READY_DIR"/*.md; do
  # Handle glob with no matches
  [[ -e "$ticket" ]] || continue

  slug=$(basename "$ticket")

  if [[ ! -f "$REVIEWS_DIR/$slug" ]]; then
    missing+=("$slug")
  fi
done

if [[ ${#missing[@]} -eq 0 ]]; then
  exit 0
fi

# Build the blocking message
{
  echo "BLOCKED: Missing review files for ${#missing[@]} ticket(s) in ready-to-review/."
  echo ""
  echo "The following tickets need review files created in kanban/reviews/:"
  echo ""
  for slug in "${missing[@]}"; do
    echo "  - $slug"
  done
  echo ""
  echo "Each review file should follow this template:"
  echo ""
  echo '# Review: <Title>'
  echo ''
  echo '**Work Item:** [<slug>](../ready-to-review/<slug>.md)'
  echo '**Branch:** <git branch name>'
  echo '**Date:** <YYYY-MM-DD>'
  echo ''
  echo '## Summary'
  echo ''
  echo '<2-4 sentences: what changed and why>'
  echo ''
  echo '## Key Files'
  echo ''
  echo '| File | What changed |'
  echo '|------|-------------|'
  echo '| `path/to/file` | <brief description> |'
  echo ''
  echo '## How to Verify'
  echo ''
  echo '### Steps'
  echo ''
  echo '1. <concrete verification step>'
  echo ''
  echo '### Expected Results'
  echo ''
  echo '<What the reviewer should see>'
  echo ''
  echo '## Risks / Things to Watch'
  echo ''
  echo '- <anything notable>'
  echo ""
  echo "Create the missing review file(s) before completing this session."
} >&2

exit 2
