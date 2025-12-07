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
