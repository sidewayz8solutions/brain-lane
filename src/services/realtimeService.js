import { supabase, hasSupabase } from '@/services/supabaseClient';

if (!hasSupabase) {
  // Keep module usable even if supabase isn't configured — functions will throw with helpful message
}

export async function getInitialComments({ projectId, taskId, limit = 100 } = {}) {
  if (!supabase) throw new Error('Supabase not configured');
  let q = supabase.from('comments').select('*').order('created_at', { ascending: true }).limit(limit);
  if (taskId) q = q.eq('task_id', taskId);
  else if (projectId) q = q.eq('project_id', projectId);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export function subscribeToComments(filter = {}, onEvent) {
  if (!supabase) throw new Error('Supabase not configured');

  const { projectId, taskId } = filter || {};
  let filterClause = '';
  if (taskId) filterClause = `task_id=eq.${taskId}`;
  else if (projectId) filterClause = `project_id=eq.${projectId}`;

  const channelName = `comments:${taskId ? `task:${taskId}` : `project:${projectId || 'all'}`}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comments', filter: filterClause || undefined },
      (payload) => {
        try {
          onEvent && onEvent(payload);
        } catch (err) {
          console.error('realtime onEvent handler error', err);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('Failed to remove realtime channel', e);
    }
  };
}

export async function insertComment({ project_id, task_id, author = 'anon', text }) {
  if (!supabase) throw new Error('Supabase not configured');
  const payload = {
    project_id: project_id || null,
    task_id: task_id || null,
    author,
    text,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('comments').insert([payload]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateComment(id, updates = {}) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('comments').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteComment(id) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('comments').delete().eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}
