/**
 * Brain Lane — Project Scanner & Diagnosis Engine
 * =================================================
 * Scans uploaded projects to create a comprehensive diagnosis report:
 * - Folder tree analysis
 * - Language detection
 * - Missing imports detection
 * - Broken logic detection
 * - Circular dependency detection
 * - Project health scoring
 */

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

const FILE_EXTENSIONS = {
  // JavaScript/TypeScript
  '.js': { language: 'javascript', category: 'frontend' },
  '.jsx': { language: 'javascript-react', category: 'frontend' },
  '.ts': { language: 'typescript', category: 'frontend' },
  '.tsx': { language: 'typescript-react', category: 'frontend' },
  '.mjs': { language: 'javascript', category: 'frontend' },
  '.cjs': { language: 'javascript', category: 'backend' },
  
  // Python
  '.py': { language: 'python', category: 'backend' },
  '.pyw': { language: 'python', category: 'backend' },
  '.pyx': { language: 'cython', category: 'backend' },
  
  // Web
  '.html': { language: 'html', category: 'frontend' },
  '.htm': { language: 'html', category: 'frontend' },
  '.css': { language: 'css', category: 'frontend' },
  '.scss': { language: 'scss', category: 'frontend' },
  '.sass': { language: 'sass', category: 'frontend' },
  '.less': { language: 'less', category: 'frontend' },
  '.vue': { language: 'vue', category: 'frontend' },
  '.svelte': { language: 'svelte', category: 'frontend' },
  
  // Backend
  '.java': { language: 'java', category: 'backend' },
  '.kt': { language: 'kotlin', category: 'backend' },
  '.go': { language: 'go', category: 'backend' },
  '.rs': { language: 'rust', category: 'backend' },
  '.rb': { language: 'ruby', category: 'backend' },
  '.php': { language: 'php', category: 'backend' },
  '.cs': { language: 'csharp', category: 'backend' },
  '.cpp': { language: 'cpp', category: 'backend' },
  '.c': { language: 'c', category: 'backend' },
  '.h': { language: 'c-header', category: 'backend' },
  
  // Config/Data
  '.json': { language: 'json', category: 'config' },
  '.yaml': { language: 'yaml', category: 'config' },
  '.yml': { language: 'yaml', category: 'config' },
  '.toml': { language: 'toml', category: 'config' },
  '.xml': { language: 'xml', category: 'config' },
  '.env': { language: 'dotenv', category: 'config' },
  
  // Documentation
  '.md': { language: 'markdown', category: 'docs' },
  '.mdx': { language: 'mdx', category: 'docs' },
  '.txt': { language: 'text', category: 'docs' },
  '.rst': { language: 'restructuredtext', category: 'docs' },
  
  // Shell
  '.sh': { language: 'shell', category: 'scripts' },
  '.bash': { language: 'bash', category: 'scripts' },
  '.zsh': { language: 'zsh', category: 'scripts' },
  '.ps1': { language: 'powershell', category: 'scripts' },
  
  // SQL
  '.sql': { language: 'sql', category: 'database' },
};

const FRAMEWORK_INDICATORS = {
  // JavaScript/TypeScript
  react: { files: ['package.json'], patterns: ['"react":', 'import React', 'from "react"'] },
  nextjs: { files: ['next.config.js', 'next.config.mjs'], patterns: ['"next":'] },
  vue: { files: ['vue.config.js'], patterns: ['"vue":'] },
  nuxt: { files: ['nuxt.config.js', 'nuxt.config.ts'], patterns: ['"nuxt":'] },
  angular: { files: ['angular.json'], patterns: ['"@angular/core"'] },
  svelte: { files: ['svelte.config.js'], patterns: ['"svelte":'] },
  express: { files: [], patterns: ['"express":', 'require("express")', 'from "express"'] },
  nestjs: { files: ['nest-cli.json'], patterns: ['"@nestjs/core"'] },
  
  // Python
  django: { files: ['manage.py'], patterns: ['django', 'DJANGO_SETTINGS_MODULE'] },
  flask: { files: [], patterns: ['from flask', 'Flask(__name__)'] },
  fastapi: { files: [], patterns: ['from fastapi', 'FastAPI()'] },
  
  // Build tools
  vite: { files: ['vite.config.js', 'vite.config.ts'], patterns: ['"vite":'] },
  webpack: { files: ['webpack.config.js'], patterns: ['"webpack":'] },
  rollup: { files: ['rollup.config.js'], patterns: ['"rollup":'] },
  esbuild: { files: [], patterns: ['"esbuild":'] },
  
  // Testing
  jest: { files: ['jest.config.js'], patterns: ['"jest":'] },
  vitest: { files: ['vitest.config.js', 'vitest.config.ts'], patterns: ['"vitest":'] },
  mocha: { files: [], patterns: ['"mocha":'] },
  pytest: { files: ['pytest.ini', 'pyproject.toml'], patterns: ['pytest'] },
  
  // CSS
  tailwind: { files: ['tailwind.config.js', 'tailwind.config.ts'], patterns: ['"tailwindcss":'] },
  bootstrap: { files: [], patterns: ['"bootstrap":'] },
  
  // Database
  prisma: { files: ['prisma/schema.prisma'], patterns: ['"prisma":'] },
  mongoose: { files: [], patterns: ['"mongoose":'] },
  supabase: { files: [], patterns: ['"@supabase/supabase-js":', 'createClient'] },
};

// ============================================================================
// IMPORT/DEPENDENCY PARSING
// ============================================================================

const IMPORT_PATTERNS = {
  javascript: [
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  typescript: [
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)*from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  python: [
    /^import\s+(\w+(?:\.\w+)*)/gm,
    /^from\s+(\w+(?:\.\w+)*)\s+import/gm,
  ],
  css: [
    /@import\s+['"]([^'"]+)['"]/g,
    /@import\s+url\(['"]?([^'")]+)['"]?\)/g,
  ],
};

function extractImports(content, language) {
  const imports = new Set();
  const patterns = IMPORT_PATTERNS[language] || IMPORT_PATTERNS.javascript;
  
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      imports.add(match[1]);
    }
  }
  
  return Array.from(imports);
}

function isRelativeImport(importPath) {
  return importPath.startsWith('.') || importPath.startsWith('/');
}

function isBuiltinModule(importPath, language) {
  const builtins = {
    javascript: ['fs', 'path', 'http', 'https', 'crypto', 'util', 'os', 'child_process', 'stream', 'events', 'buffer', 'url', 'querystring', 'zlib'],
    python: ['os', 'sys', 'json', 're', 'math', 'random', 'datetime', 'collections', 'itertools', 'functools', 'typing', 'pathlib', 'logging', 'unittest', 'asyncio'],
  };
  
  const moduleBuiltins = builtins[language] || [];
  const moduleName = importPath.split('/')[0].split('.')[0];
  return moduleBuiltins.includes(moduleName);
}

// ============================================================================
// CODE ISSUE DETECTION
// ============================================================================

const CODE_ISSUE_PATTERNS = {
  javascript: [
    // Console logs in production
    { pattern: /console\.(log|debug|info)\(/g, type: 'debug', severity: 'low', message: 'Console statement found' },
    // TODO/FIXME comments
    { pattern: /\/\/\s*(TODO|FIXME|HACK|XXX):/gi, type: 'todo', severity: 'info', message: 'TODO/FIXME comment' },
    // Empty catch blocks
    { pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g, type: 'error-handling', severity: 'medium', message: 'Empty catch block' },
    // Hardcoded secrets (basic)
    { pattern: /(api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi, type: 'security', severity: 'high', message: 'Potential hardcoded secret' },
    // == instead of ===
    { pattern: /[^=!]==[^=]/g, type: 'logic', severity: 'low', message: 'Loose equality (== instead of ===)' },
    // Unused variables (basic heuristic)
    { pattern: /(?:const|let|var)\s+(\w+)\s*=(?!.*\1)/g, type: 'unused', severity: 'low', message: 'Potentially unused variable' },
    // Alert/confirm/prompt
    { pattern: /\b(alert|confirm|prompt)\s*\(/g, type: 'debug', severity: 'low', message: 'Browser dialog used' },
    // Sync file operations
    { pattern: /\.(readFileSync|writeFileSync|existsSync)\(/g, type: 'performance', severity: 'medium', message: 'Synchronous file operation' },
  ],
  typescript: [
    // @ts-ignore
    { pattern: /@ts-ignore/g, type: 'type-safety', severity: 'medium', message: '@ts-ignore suppressing type error' },
    // any type
    { pattern: /:\s*any\b/g, type: 'type-safety', severity: 'low', message: 'Using "any" type' },
    // Non-null assertion
    { pattern: /\w+!/g, type: 'type-safety', severity: 'low', message: 'Non-null assertion operator' },
  ],
  python: [
    // Print statements
    { pattern: /\bprint\s*\(/g, type: 'debug', severity: 'low', message: 'Print statement found' },
    // Pass in except
    { pattern: /except.*:\s*\n\s*pass/g, type: 'error-handling', severity: 'medium', message: 'Empty except block' },
    // Hardcoded secrets
    { pattern: /(api[_-]?key|password|secret|token)\s*=\s*['"][^'"]{8,}['"]/gi, type: 'security', severity: 'high', message: 'Potential hardcoded secret' },
    // eval usage
    { pattern: /\beval\s*\(/g, type: 'security', severity: 'high', message: 'eval() usage is dangerous' },
  ],
};

function detectCodeIssues(content, language, filePath) {
  const issues = [];
  const patterns = CODE_ISSUE_PATTERNS[language] || CODE_ISSUE_PATTERNS.javascript;
  
  for (const { pattern, type, severity, message } of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const upToMatch = content.substring(0, match.index);
      const lineNumber = (upToMatch.match(/\n/g) || []).length + 1;
      
      issues.push({
        type,
        severity,
        message,
        file: filePath,
        line: lineNumber,
        match: match[0].substring(0, 50),
      });
    }
  }
  
  return issues;
}

// ============================================================================
// CIRCULAR DEPENDENCY DETECTION
// ============================================================================

function detectCircularDependencies(fileImports) {
  const circular = [];
  const visited = new Set();
  const stack = new Set();

  function dfs(file, path = []) {
    if (stack.has(file)) {
      // Found a cycle
      const cycleStart = path.indexOf(file);
      const cycle = path.slice(cycleStart).concat(file);
      circular.push(cycle);
      return;
    }

    if (visited.has(file)) return;

    visited.add(file);
    stack.add(file);
    path.push(file);

    const imports = fileImports[file] || [];
    for (const imp of imports) {
      if (fileImports[imp]) {
        dfs(imp, [...path]);
      }
    }

    stack.delete(file);
  }

  for (const file of Object.keys(fileImports)) {
    dfs(file);
  }

  // Dedupe cycles
  const uniqueCycles = [];
  const seen = new Set();
  for (const cycle of circular) {
    const key = [...cycle].sort().join('->');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCycles.push(cycle);
    }
  }

  return uniqueCycles;
}

// ============================================================================
// PROJECT SCANNER CLASS
// ============================================================================

export class ProjectScanner {
  constructor() {
    this.files = new Map();
    this.reset();
  }

  reset() {
    this.files.clear();
    this.diagnosis = {
      summary: '',
      score: 0,
      languages: {},
      frameworks: [],
      structure: {
        totalFiles: 0,
        totalLines: 0,
        directories: [],
        entryPoints: [],
      },
      dependencies: {
        external: [],
        missing: [],
        unused: [],
      },
      issues: [],
      circularDeps: [],
      recommendations: [],
    };
  }

  /**
   * Scan files from uploaded project
   * @param {Array<{path: string, content: string}>} files - Array of file objects
   */
  async scan(files, options = {}) {
    this.reset();
    
    const onProgress = options.onProgress || (() => {});
    
    // Store files
    for (const file of files) {
      this.files.set(file.path, file.content);
    }

    onProgress(10, 'Analyzing folder structure...');
    await this._analyzeStructure();

    onProgress(25, 'Detecting languages and frameworks...');
    await this._detectLanguagesAndFrameworks();

    onProgress(40, 'Parsing imports and dependencies...');
    const fileImports = await this._analyzeImports();

    onProgress(55, 'Detecting circular dependencies...');
    this.diagnosis.circularDeps = detectCircularDependencies(fileImports);

    onProgress(70, 'Scanning for code issues...');
    await this._scanForIssues();

    onProgress(85, 'Generating recommendations...');
    this._generateRecommendations();

    onProgress(95, 'Calculating project score...');
    this._calculateScore();

    onProgress(100, 'Diagnosis complete!');
    
    return this.diagnosis;
  }

  async _analyzeStructure() {
    const directories = new Set();
    let totalLines = 0;
    const entryPoints = [];

    for (const [path, content] of this.files) {
      // Extract directory
      const dir = path.substring(0, path.lastIndexOf('/')) || '/';
      directories.add(dir);

      // Count lines
      totalLines += (content.match(/\n/g) || []).length + 1;

      // Detect entry points
      const filename = path.split('/').pop().toLowerCase();
      if (['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'index.jsx', 'index.tsx', 'main.py', 'app.py', '__main__.py'].includes(filename)) {
        entryPoints.push(path);
      }
    }

    this.diagnosis.structure = {
      totalFiles: this.files.size,
      totalLines,
      directories: Array.from(directories).sort(),
      entryPoints,
    };
  }

  async _detectLanguagesAndFrameworks() {
    const languages = {};
    const frameworkHits = {};

    for (const [path, content] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext];
      
      if (info) {
        languages[info.language] = (languages[info.language] || 0) + 1;
      }

      // Check framework indicators
      const filename = path.split('/').pop();
      for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
        // Check filename
        if (indicators.files.some(f => path.endsWith(f))) {
          frameworkHits[framework] = (frameworkHits[framework] || 0) + 10;
        }
        // Check patterns in content
        for (const pattern of indicators.patterns) {
          if (content.includes(pattern)) {
            frameworkHits[framework] = (frameworkHits[framework] || 0) + 1;
          }
        }
      }
    }

    this.diagnosis.languages = languages;
    this.diagnosis.frameworks = Object.entries(frameworkHits)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }

  async _analyzeImports() {
    const fileImports = {};
    const allExternalDeps = new Set();
    const allLocalImports = new Set();
    const declaredDeps = new Set();

    // Get declared dependencies from package.json
    const packageJson = this.files.get('package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        Object.keys(deps).forEach(d => declaredDeps.add(d));
      } catch (e) {
        // Invalid package.json
      }
    }

    for (const [path, content] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext];
      if (!info) continue;

      const language = info.language.includes('typescript') ? 'typescript' : 
                       info.language.includes('javascript') ? 'javascript' :
                       info.language;

      const imports = extractImports(content, language);
      fileImports[path] = [];

      for (const imp of imports) {
        if (isRelativeImport(imp)) {
          // Resolve relative import
          const resolved = this._resolveImportPath(path, imp);
          fileImports[path].push(resolved);
          allLocalImports.add(resolved);
        } else if (!isBuiltinModule(imp, language)) {
          // External dependency
          const pkgName = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
          allExternalDeps.add(pkgName);
        }
      }
    }

    // Find missing local imports
    const existingFiles = new Set(this.files.keys());
    const missingImports = [];
    for (const imp of allLocalImports) {
      // Check various extensions
      const possibilities = [imp, `${imp}.js`, `${imp}.ts`, `${imp}.jsx`, `${imp}.tsx`, `${imp}/index.js`, `${imp}/index.ts`];
      if (!possibilities.some(p => existingFiles.has(p))) {
        missingImports.push(imp);
      }
    }

    // Find missing external dependencies
    const missingDeps = [];
    for (const dep of allExternalDeps) {
      if (!declaredDeps.has(dep)) {
        missingDeps.push(dep);
      }
    }

    this.diagnosis.dependencies = {
      external: Array.from(allExternalDeps),
      missing: [...missingImports, ...missingDeps.map(d => `npm: ${d}`)],
      unused: [], // Would need more sophisticated analysis
    };

    return fileImports;
  }

  _resolveImportPath(fromPath, importPath) {
    if (importPath.startsWith('/')) {
      return importPath;
    }

    const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/')) || '';
    const parts = [...fromDir.split('/'), ...importPath.split('/')];
    const resolved = [];

    for (const part of parts) {
      if (part === '' || part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    return resolved.join('/');
  }

  async _scanForIssues() {
    const issues = [];

    for (const [path, content] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext];
      if (!info) continue;

      const language = info.language.includes('typescript') ? 'typescript' : 
                       info.language.includes('javascript') ? 'javascript' :
                       info.language;

      const fileIssues = detectCodeIssues(content, language, path);
      issues.push(...fileIssues);
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    issues.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    this.diagnosis.issues = issues;
  }

  _generateRecommendations() {
    const recs = [];
    const { issues, circularDeps, dependencies, structure, frameworks } = this.diagnosis;

    // Security issues
    const securityIssues = issues.filter(i => i.type === 'security');
    if (securityIssues.length > 0) {
      recs.push({
        priority: 'critical',
        category: 'security',
        title: 'Fix Security Vulnerabilities',
        description: `Found ${securityIssues.length} potential security issues including hardcoded secrets.`,
        action: 'Review and remove all hardcoded credentials. Use environment variables instead.',
      });
    }

    // Circular dependencies
    if (circularDeps.length > 0) {
      recs.push({
        priority: 'high',
        category: 'architecture',
        title: 'Resolve Circular Dependencies',
        description: `Found ${circularDeps.length} circular dependency chains that can cause issues.`,
        action: 'Refactor to break circular import chains. Consider using dependency injection.',
      });
    }

    // Missing dependencies
    if (dependencies.missing.length > 0) {
      recs.push({
        priority: 'high',
        category: 'dependencies',
        title: 'Fix Missing Dependencies',
        description: `${dependencies.missing.length} imports reference missing files or packages.`,
        action: 'Install missing packages or create missing files.',
      });
    }

    // Empty error handling
    const emptyHandlers = issues.filter(i => i.type === 'error-handling');
    if (emptyHandlers.length > 0) {
      recs.push({
        priority: 'medium',
        category: 'reliability',
        title: 'Improve Error Handling',
        description: `Found ${emptyHandlers.length} empty catch/except blocks.`,
        action: 'Add proper error logging and handling in catch blocks.',
      });
    }

    // Debug statements
    const debugIssues = issues.filter(i => i.type === 'debug');
    if (debugIssues.length > 5) {
      recs.push({
        priority: 'low',
        category: 'cleanup',
        title: 'Remove Debug Statements',
        description: `Found ${debugIssues.length} console.log/print statements.`,
        action: 'Remove or replace with proper logging before production.',
      });
    }

    // No tests detected
    const hasTests = frameworks.includes('jest') || frameworks.includes('vitest') || 
                     frameworks.includes('mocha') || frameworks.includes('pytest');
    if (!hasTests && structure.totalFiles > 10) {
      recs.push({
        priority: 'medium',
        category: 'testing',
        title: 'Add Test Coverage',
        description: 'No testing framework detected in the project.',
        action: 'Add Jest, Vitest, or pytest and write unit tests for critical functionality.',
      });
    }

    // No TypeScript
    const hasJS = this.diagnosis.languages['javascript'] > 0 || 
                  this.diagnosis.languages['javascript-react'] > 0;
    const hasTS = this.diagnosis.languages['typescript'] > 0 || 
                  this.diagnosis.languages['typescript-react'] > 0;
    if (hasJS && !hasTS && structure.totalFiles > 20) {
      recs.push({
        priority: 'low',
        category: 'type-safety',
        title: 'Consider TypeScript',
        description: 'Large JavaScript project without TypeScript.',
        action: 'Migrate to TypeScript for better type safety and IDE support.',
      });
    }

    this.diagnosis.recommendations = recs;
  }

  _calculateScore() {
    let score = 100;
    const { issues, circularDeps, dependencies, recommendations } = this.diagnosis;

    // Deduct for issues
    const issueDeductions = {
      high: 10,
      medium: 5,
      low: 2,
      info: 0,
    };
    for (const issue of issues.slice(0, 20)) { // Cap at 20 to prevent score going too negative
      score -= issueDeductions[issue.severity] || 0;
    }

    // Deduct for circular deps
    score -= circularDeps.length * 8;

    // Deduct for missing deps
    score -= dependencies.missing.length * 5;

    // Deduct for critical recommendations
    const criticalRecs = recommendations.filter(r => r.priority === 'critical');
    score -= criticalRecs.length * 10;

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Generate summary
    let summary = '';
    if (score >= 80) {
      summary = 'This project is in good shape with minor issues to address.';
    } else if (score >= 60) {
      summary = 'This project has some issues that should be addressed for production readiness.';
    } else if (score >= 40) {
      summary = 'This project needs significant work to address security and architecture issues.';
    } else {
      summary = 'This project has critical issues that must be resolved before deployment.';
    }

    this.diagnosis.score = Math.round(score);
    this.diagnosis.summary = summary;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const projectScanner = new ProjectScanner();
export default projectScanner;
