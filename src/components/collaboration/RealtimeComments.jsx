import React, { useEffect, useState, useRef } from 'react';
import { getInitialComments, subscribeToComments, insertComment } from '@/services/realtimeService';

export default function RealtimeComments({ projectId, currentUser = { name: 'You' } }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let cleanup;

    (async () => {
      try {
        const initial = await getInitialComments(projectId);
        if (!mounted.current) return;
        setComments(initial || []);
      } catch (err) {
        console.error('Failed to load comments', err);
      }

      cleanup = subscribeToComments(projectId, (payload) => {
        // Supabase postgres_changes payload shape: { eventType, new, old }
        const ev = payload.eventType || payload.type || payload.event;
        const record = payload.new || payload.record || payload.new_record || payload;

        if (!record) return;

        if (ev === 'INSERT' || ev === 'INSERT') {
          setComments((prev) => [...prev, record]);
        } else if (ev === 'UPDATE') {
          setComments((prev) => prev.map((c) => (c.id === record.id ? record : c)));
        } else if (ev === 'DELETE') {
          setComments((prev) => prev.filter((c) => c.id !== (payload.old?.id || record.id)));
        }
      });
    })();

    return () => {
      mounted.current = false;
      cleanup && cleanup();
    };
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setText('');
      await insertComment({ project_id: projectId, author: currentUser?.name || 'anon', text: text.trim() });
      // optimistic UI: actual insert will arrive via realtime subscription
    } catch (err) {
      console.error('Failed to post comment', err);
      // restore text so user can retry
      setText(text);
    }
  };

  return (
    <div className="realtime-comments border rounded p-4 bg-white">
      <h3 className="text-lg font-medium mb-2">Live Comments</h3>
      <div className="comments-list max-h-48 overflow-auto mb-3">
        {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet.</div>}
        {comments.map((c) => (
          <div key={c.id || Math.random()} className="comment p-2 border-b">
            <div className="text-sm font-semibold">{c.author || 'anon'}</div>
            <div className="text-sm text-gray-800">{c.text}</div>
            <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          aria-label="Add comment"
          className="flex-1 border rounded px-2 py-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
        />
        <button type="submit" className="btn btn-primary px-3 py-1 rounded bg-blue-600 text-white">Post</button>
      </form>
    </div>
  );
}
