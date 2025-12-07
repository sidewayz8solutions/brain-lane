// File Service - Handle file uploads and processing
// Use streaming ZIP reader to handle very large archives without loading into memory
import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';
import { supabase, hasSupabase } from './supabaseClient';

// Store files in memory/IndexedDB for now
// Can be replaced with Supabase Storage or S3

const fileStorage = new Map();

export const UploadFile = async ({ file }) => {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Do not load huge files in memory; store a lightweight reference
  // In production, upload to Supabase/S3 directly and keep metadata
  fileStorage.set(fileId, {
    name: file.name,
    type: file.type,
    size: file.size,
    // Keep the original File reference for streaming operations
    blob: file,
    created_at: new Date().toISOString()
  });
  
  return {
    file_url: `local://${fileId}`,
    file_id: fileId,
    file_name: file.name,
    file_size: file.size
  };
};

export const ExtractZipContents = async (file) => {
  try {
    console.log('Starting ZIP extraction for file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    // Stream entries using zip.js to avoid loading entire archive
    const reader = new ZipReader(new BlobReader(file));
    const entries = await reader.getEntries();
    console.log('ZIP entries discovered:', entries.length);

    const root = { name: '', type: 'directory', children: [] };
    const fileContents = {};

    const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.md', '.txt', '.py', '.rb', '.go', '.rs', '.java', '.vue', '.svelte'];
    const skipFolders = ['node_modules/', 'dist/', 'build/', '.git/', 'vendor/', '__pycache__/'];
    const MAX_CONTENT_BYTES = 500_000; // read small text files only

    const addToTree = (fullPath, size, isDir) => {
      const parts = fullPath.split('/').filter(Boolean);
      let current = root;
      parts.forEach((part, index) => {
        let child = current.children?.find(c => c.name === part);
        if (!child) {
          const isLeafFile = !isDir && index === parts.length - 1;
          child = isLeafFile ? { name: part, type: 'file', path: fullPath, size } : { name: part, type: 'directory', children: [] };
          current.children = current.children || [];
          current.children.push(child);
        }
        current = child;
      });
    };

    for (const entry of entries) {
      const path = entry.filename;
      if (path.startsWith('__MACOSX') || path.startsWith('.')) continue;
      const isDir = entry.directory === true;
      const size = entry.uncompressedSize || 0;

      // Skip heavy/system folders early
      if (skipFolders.some(folder => path.includes(folder))) {
        addToTree(path, size, isDir);
        continue;
      }

      addToTree(path, size, isDir);

      if (!isDir) {
        const isTextFile = textExtensions.some(ext => path.toLowerCase().endsWith(ext));
        if (isTextFile && size <= MAX_CONTENT_BYTES) {
          try {
            const content = await entry.getData(new TextWriter());
            fileContents[path] = content;
          } catch (e) {
            console.warn(`Could not read ${path}:`, e);
          }
        }
      }
    }

    await reader.close();
    console.log('Streaming extraction complete. Files with content:', Object.keys(fileContents).length);

    return {
      fileTree: root.children || [],
      fileContents,
      totalFiles: Object.keys(fileContents).length
    };
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    // Return empty result instead of throwing
    return {
      fileTree: [],
      fileContents: {},
      totalFiles: 0,
      error: error.message
    };
  }
};

// Upload all ZIP entries to Supabase Storage under a project folder, streaming per entry
export const UploadZipToSupabase = async ({ file, projectId, bucket = (import.meta.env.VITE_SUPABASE_BUCKET || 'projects') }) => {
  if (!hasSupabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  console.log('Uploading ZIP to Supabase:', { name: file.name, sizeMB: (file.size/1024/1024).toFixed(2), bucket, projectId });

  const reader = new ZipReader(new BlobReader(file));
  const entries = await reader.getEntries();
  const uploaded = [];
  const errors = [];
  const skipped = [];

  // Skip heavy folders that shouldn't be uploaded
  const skipFolders = ['node_modules/', 'dist/', 'build/', '.git/', 'vendor/', '__pycache__/', '.next/', '.nuxt/', '.cache/'];

  for (const entry of entries) {
    const path = entry.filename;
    const isDir = entry.directory === true;
    if (isDir) continue; // storage only for files
    if (path.startsWith('__MACOSX') || path.startsWith('.')) continue;

    // Skip node_modules and other heavy folders
    if (skipFolders.some(folder => path.includes(folder))) {
      skipped.push(path);
      continue;
    }

    try {
      // Stream file content into a Blob without loading entire ZIP in memory
      const blob = await entry.getData(new BlobWriter());

      // Sanitize path to avoid Supabase "Invalid key" errors
      // Replace characters that are not alphanumeric, /, ., -, _ with _
      const sanitizedPath = path.replace(/[^a-zA-Z0-9/._-]/g, '_');
      if (path !== sanitizedPath) {
        console.log(`Sanitized path: ${path} -> ${sanitizedPath}`);
      }

      const objectPath = `${projectId}/${sanitizedPath}`;
      const { error } = await supabase.storage.from(bucket).upload(objectPath, blob, {
        upsert: true,
        contentType: blob.type || 'application/octet-stream'
      });
      if (error) {
        console.error('Supabase upload error for', objectPath, error.message);
        errors.push({ path: objectPath, error: error.message });
      } else {
        uploaded.push(objectPath);
      }
    } catch (e) {
      console.warn('Failed to stream and upload entry:', path, e);
      errors.push({ path, error: e.message });
    }
  }

  await reader.close();
  console.log('Supabase upload complete. Files:', uploaded.length, 'Skipped:', skipped.length, 'Errors:', errors.length);
  return { uploaded, errors, skipped, bucket };
};

export const AnalyzeProjectStructure = (fileTree, fileContents) => {
  const detected_stack = [];
  const files = Object.keys(fileContents);
  
  // Detect frameworks and libraries
  if (files.some(f => f.includes('package.json'))) {
    try {
      const pkg = JSON.parse(fileContents[files.find(f => f.endsWith('package.json'))]);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.react) detected_stack.push('React');
      if (deps.vue) detected_stack.push('Vue');
      if (deps.next) detected_stack.push('Next.js');
      if (deps.express) detected_stack.push('Express');
      if (deps.typescript) detected_stack.push('TypeScript');
      if (deps.tailwindcss) detected_stack.push('Tailwind CSS');
    } catch (e) {}
  }
  
  if (files.some(f => f.endsWith('.py'))) detected_stack.push('Python');
  if (files.some(f => f.endsWith('.go'))) detected_stack.push('Go');
  if (files.some(f => f.endsWith('.rs'))) detected_stack.push('Rust');
  
  return {
    detected_stack,
    file_count: files.length,
    primary_language: detected_stack[0] || 'Unknown'
  };
};

export const CreateFileSignedUrl = async ({ file_url }) => {
  // For local files, return as-is
  // For Supabase/S3, generate signed URL
  return { signed_url: file_url };
};

