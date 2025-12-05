// storageService.js
// Supabase Storage for large project data (file contents, file tree)
// Falls back to IndexedDB when Supabase is not configured

import { supabase, hasSupabase } from '@/services/supabaseClient';

const DB_NAME = 'brain-lane-db';
const STORE_NAME = 'project-files';
const BUCKET = 'project-files';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProjectFiles(projectId, { fileContents = {}, fileTree = [] }) {
  const payload = { projectId, fileContents, fileTree, savedAt: new Date().toISOString() };
  if (hasSupabase) {
    try {
      const path = `${projectId}.json`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob([JSON.stringify(payload)], { type: 'application/json' }), { upsert: true, contentType: 'application/json' });
      if (error) {
        // If bucket doesn't exist or blocked by policy, fall back
        console.warn('Supabase upload failed, falling back to IndexedDB:', error.message);
      } else {
        return true;
      }
    } catch (e) {
      console.warn('Supabase upload exception, falling back to IndexedDB:', e.message);
    }
  }
  // Fallback: IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(payload);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function loadProjectFiles(projectId) {
  if (hasSupabase) {
    try {
      const path = `${projectId}.json`;
      const { data, error } = await supabase.storage.from(BUCKET).download(path);
      if (!error && data) {
        const text = await data.text();
        const json = JSON.parse(text);
        return { fileContents: json.fileContents || {}, fileTree: json.fileTree || [] };
      }
    } catch (e) {
      console.warn('Supabase download exception, falling back to IndexedDB:', e.message);
    }
  }
  // Fallback: IndexedDB
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(projectId);
    req.onsuccess = () => {
      const result = req.result || { fileContents: {}, fileTree: [] };
      resolve({ fileContents: result.fileContents || {}, fileTree: result.fileTree || [] });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearProjectFiles(projectId) {
  if (hasSupabase) {
    try {
      const path = `${projectId}.json`;
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {}
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(projectId);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllProjectFiles() {
  if (hasSupabase) {
    try {
      // Note: Supabase Storage doesn't support list+clear with anon by default; skip to avoid requiring elevated policies
    } catch {}
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
