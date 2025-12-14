/**
 * Brain Lane — ChangeSet Service
 * ================================
 * Manages code changes as reviewable, revertable units.
 */

import { supabase } from './supabaseClient';

export const ChangesetStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  APPLIED: 'applied',
  REVERTED: 'reverted',
  REJECTED: 'rejected',
};

export function parseDiff(diffString) {
  const hunks = [];
  const lines = diffString.split('\n');
  let currentHunk = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      if (currentHunk) hunks.push(currentHunk);
      oldLine = parseInt(hunkMatch[1], 10);
      newLine = parseInt(hunkMatch[3], 10);
      currentHunk = {
        oldStart: oldLine,
        oldCount: parseInt(hunkMatch[2] || '1', 10),
        newStart: newLine,
        newCount: parseInt(hunkMatch[4] || '1', 10),
        changes: [],
      };
      continue;
    }
    if (!currentHunk) continue;
    if (line.startsWith('-')) {
      currentHunk.changes.push({ type: 'remove', line: oldLine++, content: line.slice(1) });
    } else if (line.startsWith('+')) {
      currentHunk.changes.push({ type: 'add', line: newLine++, content: line.slice(1) });
    } else if (line.startsWith(' ') || line === '') {
      currentHunk.changes.push({ type: 'context', oldLine: oldLine++, newLine: newLine++, content: line.slice(1) });
    }
  }
  if (currentHunk) hunks.push(currentHunk);
  return hunks;
}

export function applyDiff(originalContent, diffString) {
  const lines = originalContent.split('\n');
  const hunks = parseDiff(diffString);
  const sortedHunks = [...hunks].sort((a, b) => b.oldStart - a.oldStart);

  for (const hunk of sortedHunks) {
    const startIndex = hunk.oldStart - 1;
    const removeCount = hunk.changes.filter(c => c.type === 'remove' || c.type === 'context').length;
    const newLines = hunk.changes.filter(c => c.type === 'add' || c.type === 'context').map(c => c.content);
    lines.splice(startIndex, removeCount, ...newLines);
  }
  return lines.join('\n');
}

export function createDiff(originalContent, newContent, filePath = 'file') {
  const oldLines = originalContent.split('\n');
  const newLines = newContent.split('\n');
  const diff = [`--- a/${filePath}`, `+++ b/${filePath}`];
  let i = 0, j = 0, hunkStart = null, hunkLines = [];

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      if (hunkStart !== null) hunkLines.push(` ${oldLines[i]}`);
      i++; j++;
    } else if (i < oldLines.length && (j >= newLines.length || oldLines[i] !== newLines[j])) {
      if (hunkStart === null) {
        hunkStart = i;
        for (let k = Math.max(0, i - 3); k < i; k++) hunkLines.push(` ${oldLines[k]}`);
      }
      hunkLines.push(`-${oldLines[i]}`);
      i++;
    } else {
      if (hunkStart === null) {
        hunkStart = i;
        for (let k = Math.max(0, i - 3); k < i; k++) hunkLines.push(` ${oldLines[k]}`);
      }
      hunkLines.push(`+${newLines[j]}`);
      j++;
    }
  }

  if (hunkLines.length > 0) {
    const oldCount = hunkLines.filter(l => l.startsWith('-') || l.startsWith(' ')).length;
    const newCount = hunkLines.filter(l => l.startsWith('+') || l.startsWith(' ')).length;
    diff.push(`@@ -${(hunkStart || 0) + 1},${oldCount} +${(hunkStart || 0) + 1},${newCount} @@`);
    diff.push(...hunkLines);
  }
  return diff.join('\n');
}

class ChangesetService {
  constructor() {
    this.changesets = new Map();
    this.appliedChanges = new Map();
  }

  async createChangeset(planId, taskId, implementationResult, options = {}) {
    const { workspaceId } = options;
    const fileChanges = [];

    if (implementationResult.diffs?.length > 0) {
      for (const diff of implementationResult.diffs) {
        fileChanges.push({ type: 'modify', diff, hunks: parseDiff(diff) });
      }
    }
    if (implementationResult.fileChanges?.length > 0) {
      for (const change of implementationResult.fileChanges) {
        fileChanges.push({ type: change.path ? 'modify' : 'create', path: change.path, content: change.content });
      }
    }

    const changeset = {
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      plan_id: planId,
      task_id: taskId,
      status: ChangesetStatus.PENDING,
      file_changes: fileChanges,
      summary: this._generateSummary(fileChanges),
      created_at: new Date().toISOString(),
    };

    if (supabase && workspaceId) {
      try {
        const { data, error } = await supabase.from('changesets').insert(changeset).select().single();
        if (error) throw error;
        this.changesets.set(data.id, data);
        return data;
      } catch (err) {
        console.warn('Failed to persist changeset:', err.message);
      }
    }
    this.changesets.set(changeset.id, changeset);
    return changeset;
  }

  _generateSummary(fileChanges) {
    const created = fileChanges.filter(c => c.type === 'create').length;
    const modified = fileChanges.filter(c => c.type === 'modify').length;
    const deleted = fileChanges.filter(c => c.type === 'delete').length;
    const parts = [];
    if (created > 0) parts.push(`${created} file(s) created`);
    if (modified > 0) parts.push(`${modified} file(s) modified`);
    if (deleted > 0) parts.push(`${deleted} file(s) deleted`);
    return parts.join(', ') || 'No changes';
  }

  async getChangeset(changesetId) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('changesets').select('*').eq('id', changesetId).single();
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Failed to fetch changeset:', err.message);
      }
    }
    return this.changesets.get(changesetId) || null;
  }

  async listChangesets(planId) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('changesets').select('*').eq('plan_id', planId).order('created_at', { ascending: true });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Failed to list changesets:', err.message);
      }
    }
    return Array.from(this.changesets.values()).filter(c => c.plan_id === planId);
  }

  async previewChangeset(changesetId, projectFiles) {
    const changeset = await this.getChangeset(changesetId);
    if (!changeset) throw new Error(`Changeset not found: ${changesetId}`);

    const preview = { changeset_id: changesetId, files: [] };

    for (const change of changeset.file_changes) {
      const originalFile = projectFiles.find(f => f.path === change.path);

      if (change.type === 'create') {
        preview.files.push({
          path: change.path,
          action: 'create',
          newContent: change.content,
          linesAdded: (change.content.match(/\n/g) || []).length + 1,
          linesRemoved: 0,
        });
      } else if (change.type === 'delete') {
        preview.files.push({
          path: change.path,
          action: 'delete',
          originalContent: originalFile?.content,
          linesAdded: 0,
          linesRemoved: originalFile ? (originalFile.content.match(/\n/g) || []).length + 1 : 0,
        });
      } else if (change.type === 'modify') {
        const original = originalFile?.content || '';
        const newContent = change.diff ? applyDiff(original, change.diff) : (change.content || original);
        const originalLines = original.split('\n').length;
        const newLines = newContent.split('\n').length;

        preview.files.push({
          path: change.path,
          action: 'modify',
          originalContent: original,
          newContent,
          diff: change.diff || createDiff(original, newContent, change.path),
          linesAdded: Math.max(0, newLines - originalLines),
          linesRemoved: Math.max(0, originalLines - newLines),
        });
      }
    }
    return preview;
  }

  async applyChangeset(changesetId, projectFiles, options = {}) {
    const changeset = await this.getChangeset(changesetId);
    if (!changeset) throw new Error(`Changeset not found: ${changesetId}`);
    if (changeset.status === ChangesetStatus.APPLIED) throw new Error('Changeset already applied');

    const { onProgress = () => {} } = options;
    const results = [];
    const originalStates = new Map();

    for (let i = 0; i < changeset.file_changes.length; i++) {
      const change = changeset.file_changes[i];
      onProgress({ step: i + 1, total: changeset.file_changes.length, file: change.path });

      const fileIndex = projectFiles.findIndex(f => f.path === change.path);
      if (fileIndex >= 0) originalStates.set(change.path, { ...projectFiles[fileIndex] });

      try {
        if (change.type === 'create') {
          projectFiles.push({ path: change.path, content: change.content, name: change.path.split('/').pop() });
          results.push({ path: change.path, action: 'created', success: true });
        } else if (change.type === 'delete') {
          if (fileIndex >= 0) {
            projectFiles.splice(fileIndex, 1);
            results.push({ path: change.path, action: 'deleted', success: true });
          } else {
            results.push({ path: change.path, action: 'delete', success: false, error: 'File not found' });
          }
        } else if (change.type === 'modify') {
          if (fileIndex >= 0) {
            const original = projectFiles[fileIndex].content;
            const newContent = change.diff ? applyDiff(original, change.diff) : change.content;
            if (!newContent) throw new Error('No diff or content provided');
            projectFiles[fileIndex].content = newContent;
            results.push({ path: change.path, action: 'modified', success: true });
          } else {
            results.push({ path: change.path, action: 'modify', success: false, error: 'File not found' });
          }
        }
      } catch (err) {
        results.push({ path: change.path, action: change.type, success: false, error: err.message });
      }
    }

    this.appliedChanges.set(changesetId, { originalStates: Object.fromEntries(originalStates), appliedAt: new Date().toISOString() });
    await this._updateStatus(changesetId, ChangesetStatus.APPLIED);

    return { success: results.every(r => r.success), results, projectFiles };
  }

  async revertChangeset(changesetId, projectFiles) {
    const changeset = await this.getChangeset(changesetId);
    if (!changeset) throw new Error(`Changeset not found: ${changesetId}`);
    if (changeset.status !== ChangesetStatus.APPLIED) throw new Error('Changeset not applied');

    const appliedData = this.appliedChanges.get(changesetId);
    if (!appliedData) throw new Error('No revert data available');

    const results = [];
    for (const [path, originalState] of Object.entries(appliedData.originalStates)) {
      const fileIndex = projectFiles.findIndex(f => f.path === path);
      if (fileIndex >= 0) {
        projectFiles[fileIndex] = originalState;
        results.push({ path, action: 'reverted', success: true });
      }
    }

    // Remove created files
    for (const change of changeset.file_changes) {
      if (change.type === 'create') {
        const idx = projectFiles.findIndex(f => f.path === change.path);
        if (idx >= 0) {
          projectFiles.splice(idx, 1);
          results.push({ path: change.path, action: 'removed', success: true });
        }
      }
    }

    await this._updateStatus(changesetId, ChangesetStatus.REVERTED);
    this.appliedChanges.delete(changesetId);

    return { success: true, results, projectFiles };
  }

  async approveChangeset(changesetId) {
    return this._updateStatus(changesetId, ChangesetStatus.APPROVED);
  }

  async rejectChangeset(changesetId) {
    return this._updateStatus(changesetId, ChangesetStatus.REJECTED);
  }

  async _updateStatus(changesetId, status) {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('changesets').update({ status, updated_at: new Date().toISOString() }).eq('id', changesetId).select().single();
        if (error) throw error;
        this.changesets.set(changesetId, data);
        return data;
      } catch (err) {
        console.warn('Failed to update changeset status:', err.message);
      }
    }
    const changeset = this.changesets.get(changesetId);
    if (changeset) {
      changeset.status = status;
      changeset.updated_at = new Date().toISOString();
    }
    return changeset;
  }
}

export const changesetService = new ChangesetService();
export default changesetService;
