# Supabase Realtime / Comments test scripts

This folder contains helper scripts and SQL to set up and test the `comments` table and realtime subscriptions.

Files
- `setup-comments.sql` — SQL script to create the `comments` table, indexes, and example RLS policies (dev + recommended production policies). Paste this into Supabase SQL editor.
- `test-realtime.html` — A static HTML page you can open in two browser tabs to test realtime subscriptions using the anon key.
- `test-rest.sh` — Bash script to POST a comment to the Supabase REST endpoint and fetch recent comments. Requires `jq`.
- `test-node-realtime.js` — Node script that subscribes to realtime events and inserts a test comment. Requires `@supabase/supabase-js`.

Quick start

1. Set up env vars locally (Vite .env or export in shell):

```bash
export VITE_SUPABASE_URL=https://<project>.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJ...
export SUPABASE_URL=$VITE_SUPABASE_URL
export SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
export TASK_ID=<a-task-uuid-if-you-have-one>
```

2. Run the SQL in `setup-comments.sql` in Supabase SQL editor.

3. Test in browser with `scripts/test-realtime.html`:
   - Open the file in the browser (file:// or serve it). Enter your Supabase URL, anon key and TASK_ID, click Connect in two tabs, then Send in one tab and observe the event in the other.

4. Test with REST (requires `jq`):
   ```bash
   SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon> TASK_ID=<task> ./scripts/test-rest.sh
   ```

5. Test with Node realtime script:
   ```bash
   npm install @supabase/supabase-js
   SUPABASE_URL=https://<project>.supabase.co SUPABASE_ANON_KEY=<anon> TASK_ID=<task> node scripts/test-node-realtime.js
   ```

Notes
- Remove the `dev_allow_all_comments` policy from the SQL when moving to production and use the auth-based policies.
- If you use auth-based policies, update client inserts to include `user_id` = `auth.user().id`.
