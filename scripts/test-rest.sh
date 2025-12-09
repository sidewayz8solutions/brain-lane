#!/usr/biset -euo pipefail

# Usage:
# SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon> TASK_ID=<task-uuid> ./scripts/test-rest.sh

SUPABASE_URL=${SUPABASE_URL:-}
ANON_KEY=${SUPABASE_ANON_KEY:-}
TASK_ID=${TASK_ID:-}

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables"
  exit 1
fi

if [[ -z "$TASK_ID" ]]; then
  echo "Warning: TASK_ID not set — insert without task scope"
fi

echo "Posting a test comment to $SUPABASE_URL"

PAYLOAD=$(jq -nc --arg task "$TASK_ID" --arg author "rest-test" --arg text "Test from REST $(date -Iseconds)" '{task_id: ($task==""?null:$task), author: $author, text: $text}')

curl -sS -X POST "$SUPABASE_URL/rest/v1/comments" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$PAYLOAD" | jq .

echo
echo "Fetching last 5 comments (filtered by task if TASK_ID provided)"
if [[ -n "$TASK_ID" ]]; then
  FILTER="task_id=eq.$TASK_ID"
else
  FILTER=""
fi

curl -sS -X GET "$SUPABASE_URL/rest/v1/comments?${FILTER}&select=*&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq .
#!/usr/bin/env bash
# Quick REST test script for Supabase comments table
# Usage:
#   SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon> TASK_ID=<task-uuid> ./scripts/test-rest.sh

set -euo pipefail

SUPABASE_URL=${SUPABASE_URL:-}
ANON_KEY=${SUPABASE_ANON_KEY:-}
TASK_ID=${TASK_ID:-}

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables"
  exit 1
fi

echo "Using SUPABASE_URL=$SUPABASE_URL"

BODY=$(jq -nc --arg task "$TASK_ID" --arg author "curl-test" --arg text "Hello from curl $(date -Iseconds)" '{task_id: $task, author: $author, text: $text}')

echo "Posting comment (REST) to comments table..."
curl -sS -X POST "$SUPABASE_URL/rest/v1/comments" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d "$BODY" | jq .

echo
echo "Fetching last 5 comments for task"
curl -sS -X GET "$SUPABASE_URL/rest/v1/comments?task_id=eq.$TASK_ID&select=*&order=created_at.desc&limit=5" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq .
