// Node script to test Supabase realtime and inserts
// Usage: node scripts/test-node-realtime.js
// Requires: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TASK_ID = process.env.TASK_ID || null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { realtime: { params: { eventsPerSecond: 10 } } });

async function main() {
  console.log('Fetching initial rows...');
  const { data, error } = await supabase.from('comments').select('*').eq('task_id', TASK_ID).order('created_at', { ascending: true });
  if (error) console.error('Fetch error', error);
  else console.log('Initial rows:', data.length);

  console.log('Subscribing to realtime events...');
  const channel = supabase.channel('node-realtime-test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: TASK_ID ? `task_id=eq.${TASK_ID}` : undefined }, (payload) => {
      console.log('EVENT', payload.eventType || payload.type || payload.event, payload.new || payload.record || payload);
    })
    .subscribe();

  console.log('Inserting a test comment...');
  const insert = await supabase.from('comments').insert([{ task_id: TASK_ID, author: 'node-tester', text: 'Node realtime test ' + new Date().toISOString() }]).select();
  if (insert.error) console.error('Insert error', insert.error);
  else console.log('Inserted', insert.data[0]);

  console.log('Waiting 30s to receive events...');
  await new Promise((r) => setTimeout(r, 30000));
  console.log('Unsubscribing and exiting');
  supabase.removeChannel(channel);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
