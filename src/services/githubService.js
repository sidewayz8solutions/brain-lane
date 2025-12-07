// Lightweight GitHub helper for creating branches, committing files, and opening PRs

const GITHUB_API = 'https://api.github.com';
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN || null;

const hasToken = () => !!TOKEN;

async function apiFetch(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (hasToken()) headers['Authorization'] = `token ${TOKEN}`;

  const url = hasToken() ? `${GITHUB_API}${path}` : `/api/github${path}`;

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`GitHub API error ${resp.status}: ${text}`);
  }

  return resp.json().catch(() => ({}));
}

export async function getRef(repoFullName, ref) {
  return apiFetch(`/repos/${repoFullName}/git/ref/${encodeURIComponent(ref)}`);
}

export async function createBranch(repoFullName, baseBranch, newBranch) {
  // Get base branch SHA
  const baseRef = await getRef(repoFullName, `heads/${baseBranch}`);
  const sha = baseRef.object?.sha;
  if (!sha) throw new Error('Could not get base branch SHA');

  return apiFetch(`/repos/${repoFullName}/git/refs`, 'POST', {
    ref: `refs/heads/${newBranch}`,
    sha,
  });
}

export async function getFileSha(repoFullName, path, branch) {
  try {
    const res = await apiFetch(`/repos/${repoFullName}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
    return res.sha;
  } catch (e) {
    return null;
  }
}

export async function createOrUpdateFile(repoFullName, branch, path, content, message = 'Apply Brain Lane automated patch') {
  // Use browser btoa for base64 encoding
  const encoded = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(content || ''))) : Buffer.from(content || '', 'utf-8').toString('base64');
  const sha = await getFileSha(repoFullName, path, branch);

  const payload = {
    message,
    content: encoded,
    branch,
  };

  if (sha) payload.sha = sha;

  return apiFetch(`/repos/${repoFullName}/contents/${encodeURIComponent(path)}`, 'PUT', payload);
}

export async function createPullRequest(repoFullName, base, head, title, body = '') {
  return apiFetch(`/repos/${repoFullName}/pulls`, 'POST', {
    title,
    head,
    base,
    body,
  });
}

export default {
  createBranch,
  createOrUpdateFile,
  createPullRequest,
};
