// File Service - Handle file uploads and processing
import JSZip from 'jszip';

// Store files in memory/IndexedDB for now
// Can be replaced with Supabase Storage or S3

const fileStorage = new Map();

export const UploadFile = async ({ file }) => {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Store in memory (for demo) - in production use Supabase/S3
  fileStorage.set(fileId, {
    name: file.name,
    type: file.type,
    size: file.size,
    data: arrayBuffer,
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
    
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    console.log('ZIP loaded, processing entries...');
    
    const fileTree = [];
    const fileContents = {};
    
    const processEntry = async (relativePath, zipEntry) => {
      if (zipEntry.dir) {
        return { name: relativePath, type: 'directory', children: [] };
      }
      
      // Only process text-based files
      const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.md', '.txt', '.py', '.rb', '.go', '.rs', '.java', '.vue', '.svelte'];
      const isTextFile = textExtensions.some(ext => relativePath.toLowerCase().endsWith(ext));
      
      // Skip node_modules, dist, build folders for performance
      const skipFolders = ['node_modules/', 'dist/', 'build/', '.git/', 'vendor/', '__pycache__/'];
      const shouldSkip = skipFolders.some(folder => relativePath.includes(folder));
      
      if (isTextFile && !shouldSkip && zipEntry._data?.uncompressedSize < 500000) { // Skip files > 500KB
        try {
          const content = await zipEntry.async('string');
          fileContents[relativePath] = content;
        } catch (e) {
          console.warn(`Could not read ${relativePath}:`, e);
        }
      }
      
      return { name: relativePath, type: 'file', size: zipEntry._data?.uncompressedSize || 0 };
    };
    
    // Build file tree
    const entries = [];
    const allFiles = Object.entries(contents.files);
    console.log('Total entries in ZIP:', allFiles.length);
    
    for (const [path, entry] of allFiles) {
      if (!path.startsWith('__MACOSX') && !path.startsWith('.')) {
        entries.push(await processEntry(path, entry));
      }
    }
    
    console.log('Processed entries:', entries.length);
    
    // Organize into tree structure
    const root = { name: '', type: 'directory', children: [] };
    
    entries.forEach(entry => {
      const parts = entry.name.split('/').filter(Boolean);
      let current = root;
      
      parts.forEach((part, index) => {
        let child = current.children?.find(c => c.name === part);
        if (!child) {
          child = index === parts.length - 1 && entry.type === 'file'
            ? { name: part, type: 'file', path: entry.name, size: entry.size }
            : { name: part, type: 'directory', children: [] };
          current.children = current.children || [];
          current.children.push(child);
        }
        current = child;
      });
    });
    
    console.log('Extraction complete. Files with content:', Object.keys(fileContents).length);
    
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

