// Lightweight WebContainer service wrapper
// Dynamically imports the @webcontainer/api when available and provides helpers
// to write files and run commands inside the in-browser container.

let webcontainer = null;
let container = null;

export async function ensureWebContainer() {
    if (container) return container;
    try {
        const { WebContainer } = await import('@webcontainer/api');
        webcontainer = WebContainer;
        container = await WebContainer.boot();
        return container;
    } catch (err) {
        throw new Error('WebContainer API not available. Install @webcontainer/api and run in a supported browser. ' + err.message);
    }
}

export async function loadProjectIntoWebContainer(project) {
    const c = await ensureWebContainer();

    const files = project.file_contents || {};
    const writePromises = Object.entries(files).map(async ([path, content]) => {
        const dir = path.split('/').slice(0, -1).join('/') || '/';
        try {
            await c.fs.mkdir(dir, { recursive: true });
        } catch (e) {
            // ignore
        }
        await c.fs.writeFile(path, content);
    });

    await Promise.all(writePromises);
    return c;
}

export async function runCommandInWebContainer({ project, command = 'npm', args = ['run', 'start'], onOutput }) {
    const c = await loadProjectIntoWebContainer(project);

    // Ensure node_modules exists by running install if package.json present
    try {
        if (project.file_contents && Object.keys(project.file_contents).some(p => p.endsWith('package.json'))) {
            const install = await c.spawn('bash', ['-lc', 'npm install --no-audit --no-fund'], {
                stdout: 'pipe',
                stderr: 'pipe'
            });

            install.output.pipeTo(new WritableStream({
                write(chunk) { onOutput?.(chunk); }
            }));

            await install.exit;
        }
    } catch (err) {
        // continue; sometimes installs fail in constrained envs
        onOutput?.(`Install step failed: ${err.message}`);
    }

    // Run the requested command
    const spawned = await c.spawn('bash', ['-lc', [command, ...args].join(' ')], {
        stdout: 'pipe',
        stderr: 'pipe'
    });

    const reader = spawned.output.getReader();
    const decoder = new TextDecoder();

    const streamLoop = async () => {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            onOutput?.(text);
        }
    };

    const p = streamLoop();
    const exitCode = await spawned.exit;
    await p;

    return { exitCode };
}

export function isWebContainerAvailable() {
    return !!container;
}
// Minimal WebContainer service wrapper. Uses dynamic import so builds won't fail when the
// @webcontainer/api package is not installed in environments where it's unsupported.
let containerInstance = null;
let loadedProjectId = null;

const DEFAULT_TIMEOUT_MS = 90_000;

async function bootContainer() {
  if (containerInstance) return containerInstance;
  try {
    const wc = await import('@webcontainer/api');
    containerInstance = await wc.WebContainer.boot();
    return containerInstance;
  } catch (err) {
    throw new Error('WebContainer API not available in this environment: ' + err.message);
  }
}

async function writeFileRecursive(container, path, content) {
  // Ensure leading slash
  const p = path.startsWith('/') ? path : `/${path}`;
  // Create parent dirs if needed (best-effort)
  const parts = p.split('/').slice(1, -1);
  let acc = '';
  for (const part of parts) {
    acc += `/${part}`;
    try {
      // mkdir may not exist, but attempt
      // eslint-disable-next-line no-undef
      await container.fs.mkdir(acc).catch(() => {});
    } catch (e) {
      // ignore
    }
  }

  await container.fs.writeFile(p, content);
}

export async function loadProjectIntoWebContainer(project) {
  if (!project || !project.id) throw new Error('project is required');
  const container = await bootContainer();

  if (loadedProjectId === project.id) return container;

  // Clear root (best-effort)
  try {
    await container.fs.rm('/', { recursive: true }).catch(() => {});
  } catch (e) {
    // ignore removal errors
  }

  // Write files
  const fileEntries = Object.entries(project.file_contents || {});
  for (const [path, content] of fileEntries) {
    try {
      await writeFileRecursive(container, path, content || '');
    } catch (err) {
      // ignore write errors for now
      console.warn('webcontainer: failed to write', path, err?.message || err);
    }
  }

  loadedProjectId = project.id;
  return container;
}

async function execWithStreaming(container, command, args = [], onOutput) {
  const proc = await container.spawn(command, args, { stdout: 'pipe', stderr: 'pipe' });
  const output = [];
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    try { proc.kill(); } catch (e) {}
    onOutput?.('\n[brain-lane] Command timed out and was terminated.');
  }, DEFAULT_TIMEOUT_MS);

  try {
    await proc.output.pipeTo(new WritableStream({
      write(chunk) {
        const text = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
        output.push(text);
        onOutput?.(text);
      }
    }));
  } catch (e) {
    // pipeTo may throw if stream closed; continue
  }

  const exitCode = await proc.exit;
  clearTimeout(timer);
  return { exitCode, output: output.join(''), timedOut };
}

export async function runCommandInWebContainer({ project, command, args = [], onOutput }) {
  if (!project) throw new Error('project required');
  const container = await loadProjectIntoWebContainer(project);

  // If project has package.json and no node_modules, install dependencies
  try {
    const hasPackageJson = await container.fs.readFile('/package.json', 'utf-8').then(() => true).catch(() => false);
    if (hasPackageJson) {
      const hasNodeModules = await container.fs.readdir('/').then(list => list.includes('node_modules')).catch(() => false);
      if (!hasNodeModules) {
        onOutput?.('[brain-lane] Installing dependencies (npm install)...\n');
        await execWithStreaming(container, 'npm', ['install'], onOutput);
      }
    }
  } catch (e) {
    onOutput?.('[brain-lane] Failed to check/install dependencies: ' + (e?.message || e) + '\n');
  }

  return execWithStreaming(container, command, args, onOutput);
}

export default {
  loadProjectIntoWebContainer,
  runCommandInWebContainer,
};
