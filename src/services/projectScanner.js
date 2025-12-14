/**
 * Brain Lane — Project Scanner & Indexing Engine v2
 * ===================================================
 * Comprehensive project analysis for AI-assisted engineering:
 *
 * Core Features:
 * - Folder tree analysis with file categorization
 * - Language & framework detection
 * - Entry point identification
 * - TODO/FIXME/HACK hotspot scanning
 * - Test coverage estimation
 * - Config file presence detection
 * - Dependency analysis (external, missing, unused)
 * - Circular dependency detection
 * - Module summary generation
 * - Project health scoring & readiness assessment
 *
 * Output: project_index object compatible with Brain Lane v2 schema
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
// ENTRY POINT DETECTION
// ============================================================================

const ENTRY_POINT_PATTERNS = {
  // JavaScript/TypeScript
  js: {
    files: ['index.js', 'index.ts', 'index.jsx', 'index.tsx', 'main.js', 'main.ts', 'app.js', 'app.ts', 'server.js', 'server.ts'],
    patterns: [
      /ReactDOM\.render\(/,
      /ReactDOM\.createRoot\(/,
      /createApp\(/,
      /express\(\)/,
      /new\s+Hono\(/,
      /Fastify\(/,
      /app\.listen\(/,
      /server\.listen\(/,
    ],
  },
  // Python
  python: {
    files: ['main.py', 'app.py', '__main__.py', 'manage.py', 'wsgi.py', 'asgi.py'],
    patterns: [
      /if\s+__name__\s*==\s*['"]__main__['"]/,
      /uvicorn\.run\(/,
      /app\.run\(/,
      /Flask\(__name__\)/,
      /FastAPI\(\)/,
    ],
  },
  // Go
  go: {
    files: ['main.go', 'cmd/main.go'],
    patterns: [/func\s+main\s*\(\)/],
  },
  // Rust
  rust: {
    files: ['main.rs', 'lib.rs'],
    patterns: [/fn\s+main\s*\(\)/],
  },
};

// ============================================================================
// CONFIG FILE DETECTION
// ============================================================================

const CONFIG_FILE_PATTERNS = {
  // Package managers
  'package.json': { type: 'npm', category: 'package_manager' },
  'package-lock.json': { type: 'npm-lock', category: 'package_manager' },
  'yarn.lock': { type: 'yarn', category: 'package_manager' },
  'pnpm-lock.yaml': { type: 'pnpm', category: 'package_manager' },
  'requirements.txt': { type: 'pip', category: 'package_manager' },
  'Pipfile': { type: 'pipenv', category: 'package_manager' },
  'pyproject.toml': { type: 'poetry', category: 'package_manager' },
  'Cargo.toml': { type: 'cargo', category: 'package_manager' },
  'go.mod': { type: 'go-mod', category: 'package_manager' },
  'Gemfile': { type: 'bundler', category: 'package_manager' },
  'composer.json': { type: 'composer', category: 'package_manager' },

  // Build/bundler configs
  'vite.config.js': { type: 'vite', category: 'build' },
  'vite.config.ts': { type: 'vite', category: 'build' },
  'webpack.config.js': { type: 'webpack', category: 'build' },
  'rollup.config.js': { type: 'rollup', category: 'build' },
  'esbuild.config.js': { type: 'esbuild', category: 'build' },
  'tsconfig.json': { type: 'typescript', category: 'build' },
  'jsconfig.json': { type: 'javascript', category: 'build' },

  // Linting/formatting
  '.eslintrc': { type: 'eslint', category: 'lint' },
  '.eslintrc.js': { type: 'eslint', category: 'lint' },
  '.eslintrc.json': { type: 'eslint', category: 'lint' },
  'eslint.config.js': { type: 'eslint-flat', category: 'lint' },
  '.prettierrc': { type: 'prettier', category: 'lint' },
  '.prettierrc.js': { type: 'prettier', category: 'lint' },
  'biome.json': { type: 'biome', category: 'lint' },
  '.editorconfig': { type: 'editorconfig', category: 'lint' },

  // Testing
  'jest.config.js': { type: 'jest', category: 'test' },
  'jest.config.ts': { type: 'jest', category: 'test' },
  'vitest.config.js': { type: 'vitest', category: 'test' },
  'vitest.config.ts': { type: 'vitest', category: 'test' },
  'pytest.ini': { type: 'pytest', category: 'test' },
  'setup.cfg': { type: 'pytest', category: 'test' },
  'cypress.config.js': { type: 'cypress', category: 'test' },
  'playwright.config.ts': { type: 'playwright', category: 'test' },

  // CI/CD
  '.github/workflows': { type: 'github-actions', category: 'ci' },
  '.gitlab-ci.yml': { type: 'gitlab-ci', category: 'ci' },
  'Jenkinsfile': { type: 'jenkins', category: 'ci' },
  '.circleci/config.yml': { type: 'circleci', category: 'ci' },
  'azure-pipelines.yml': { type: 'azure-devops', category: 'ci' },

  // Containerization
  'Dockerfile': { type: 'docker', category: 'container' },
  'docker-compose.yml': { type: 'docker-compose', category: 'container' },
  'docker-compose.yaml': { type: 'docker-compose', category: 'container' },
  '.dockerignore': { type: 'docker', category: 'container' },
  'kubernetes': { type: 'kubernetes', category: 'container' },
  'k8s': { type: 'kubernetes', category: 'container' },

  // Environment
  '.env': { type: 'dotenv', category: 'env' },
  '.env.example': { type: 'dotenv-template', category: 'env' },
  '.env.local': { type: 'dotenv', category: 'env' },
  '.env.development': { type: 'dotenv', category: 'env' },
  '.env.production': { type: 'dotenv', category: 'env' },

  // Database
  'prisma/schema.prisma': { type: 'prisma', category: 'database' },
  'drizzle.config.ts': { type: 'drizzle', category: 'database' },
  'knexfile.js': { type: 'knex', category: 'database' },
  'ormconfig.json': { type: 'typeorm', category: 'database' },

  // Deployment
  'vercel.json': { type: 'vercel', category: 'deploy' },
  'netlify.toml': { type: 'netlify', category: 'deploy' },
  'fly.toml': { type: 'fly', category: 'deploy' },
  'render.yaml': { type: 'render', category: 'deploy' },
  'railway.json': { type: 'railway', category: 'deploy' },
  'app.yaml': { type: 'gcp-app-engine', category: 'deploy' },
  'serverless.yml': { type: 'serverless', category: 'deploy' },
  'sam.yaml': { type: 'aws-sam', category: 'deploy' },
};

// ============================================================================
// TODO/FIXME PATTERNS
// ============================================================================

const TODO_PATTERNS = [
  { pattern: /\/\/\s*(TODO):\s*(.+)/gi, type: 'TODO' },
  { pattern: /\/\/\s*(FIXME):\s*(.+)/gi, type: 'FIXME' },
  { pattern: /\/\/\s*(HACK):\s*(.+)/gi, type: 'HACK' },
  { pattern: /\/\/\s*(XXX):\s*(.+)/gi, type: 'XXX' },
  { pattern: /\/\/\s*(BUG):\s*(.+)/gi, type: 'BUG' },
  { pattern: /\/\/\s*(OPTIMIZE):\s*(.+)/gi, type: 'OPTIMIZE' },
  { pattern: /#\s*(TODO):\s*(.+)/gi, type: 'TODO' },
  { pattern: /#\s*(FIXME):\s*(.+)/gi, type: 'FIXME' },
  { pattern: /#\s*(HACK):\s*(.+)/gi, type: 'HACK' },
  { pattern: /\/\*\s*(TODO):\s*(.+?)\*\//gi, type: 'TODO' },
  { pattern: /\/\*\s*(FIXME):\s*(.+?)\*\//gi, type: 'FIXME' },
];

// ============================================================================
// TEST FILE PATTERNS
// ============================================================================

const TEST_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /_test\.[jt]sx?$/,
  /_spec\.[jt]sx?$/,
  /test_.*\.py$/,
  /.*_test\.py$/,
  /.*_test\.go$/,
  /.*_test\.rs$/,
  /__tests__\//,
  /tests?\//,
  /spec\//,
];

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
// PROJECT SCANNER CLASS (Enhanced for Brain Lane v2)
// ============================================================================

export class ProjectScanner {
  constructor() {
    this.files = new Map();
    this.reset();
  }

  reset() {
    this.files.clear();
    // Legacy diagnosis format
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
    // New v2 project_index format
    this.projectIndex = {
      file_tree: [],
      languages: {},
      frameworks: [],
      package_managers: [],
      entry_points: [],
      config_files: [],
      todo_fixme_locations: [],
      todo_fixme_count: 0,
      test_files: [],
      test_coverage_estimate: 0,
      module_summaries: [],
      dependencies: {
        external: [],
        missing: [],
        internal_graph: {},
      },
      circular_deps: [],
      readiness_score: 0,
      readiness_breakdown: {},
    };
  }

  /**
   * Scan files from uploaded project (legacy API)
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

  /**
   * Create comprehensive project index (v2 API)
   * Returns project_index compatible with Brain Lane v2 schema
   */
  async createIndex(files, options = {}) {
    this.reset();
    const onProgress = options.onProgress || (() => {});

    // Store files
    for (const file of files) {
      this.files.set(file.path, file.content);
    }

    onProgress(5, 'Building file tree...');
    this._buildFileTree();

    onProgress(15, 'Detecting languages and frameworks...');
    this._detectLanguagesAndFrameworksV2();

    onProgress(25, 'Detecting package managers...');
    this._detectPackageManagers();

    onProgress(35, 'Identifying entry points...');
    this._identifyEntryPoints();

    onProgress(45, 'Scanning config files...');
    this._scanConfigFiles();

    onProgress(55, 'Scanning TODO/FIXME hotspots...');
    this._scanTodoFixme();

    onProgress(65, 'Detecting test files...');
    this._detectTestFiles();

    onProgress(75, 'Generating module summaries...');
    this._generateModuleSummaries();

    onProgress(85, 'Analyzing dependencies...');
    const fileImports = await this._analyzeImports();
    this.projectIndex.circular_deps = detectCircularDependencies(fileImports);

    onProgress(95, 'Calculating readiness score...');
    this._calculateReadinessScore();

    onProgress(100, 'Index complete!');

    return this.projectIndex;
  }

  // ==========================================================================
  // V2 INDEXING METHODS
  // ==========================================================================

  _buildFileTree() {
    const tree = [];
    for (const [path, content] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext] || { language: 'unknown', category: 'other' };
      const lines = (content.match(/\n/g) || []).length + 1;

      tree.push({
        path,
        name: path.split('/').pop(),
        extension: ext,
        language: info.language,
        category: info.category,
        lines,
        size: content.length,
      });
    }
    this.projectIndex.file_tree = tree;
  }

  _detectLanguagesAndFrameworksV2() {
    const languages = {};
    const frameworkHits = {};

    for (const [path, content] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext];

      if (info) {
        if (!languages[info.language]) {
          languages[info.language] = { count: 0, lines: 0 };
        }
        languages[info.language].count++;
        languages[info.language].lines += (content.match(/\n/g) || []).length + 1;
      }

      // Check framework indicators
      for (const [framework, indicators] of Object.entries(FRAMEWORK_INDICATORS)) {
        if (indicators.files.some(f => path.endsWith(f))) {
          frameworkHits[framework] = (frameworkHits[framework] || 0) + 10;
        }
        for (const pattern of indicators.patterns) {
          if (content.includes(pattern)) {
            frameworkHits[framework] = (frameworkHits[framework] || 0) + 1;
          }
        }
      }
    }

    this.projectIndex.languages = languages;
    this.projectIndex.frameworks = Object.entries(frameworkHits)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name, confidence]) => ({ name, confidence }));

    // Also update legacy diagnosis
    this.diagnosis.languages = Object.fromEntries(
      Object.entries(languages).map(([k, v]) => [k, v.count])
    );
    this.diagnosis.frameworks = this.projectIndex.frameworks.map(f => f.name);
  }

  _detectPackageManagers() {
    const managers = [];
    for (const [path] of this.files) {
      const filename = path.split('/').pop();
      const config = CONFIG_FILE_PATTERNS[filename];
      if (config?.category === 'package_manager') {
        managers.push({
          type: config.type,
          path,
        });
      }
    }
    this.projectIndex.package_managers = managers;
  }

  _identifyEntryPoints() {
    const entryPoints = [];

    for (const [path, content] of this.files) {
      const filename = path.split('/').pop().toLowerCase();
      const ext = path.substring(path.lastIndexOf('.'));

      // Check by filename
      for (const [lang, config] of Object.entries(ENTRY_POINT_PATTERNS)) {
        if (config.files.some(f => filename === f.toLowerCase())) {
          entryPoints.push({
            path,
            type: 'filename_match',
            language: lang,
            confidence: 'high',
          });
          break;
        }
      }

      // Check by content patterns
      for (const [lang, config] of Object.entries(ENTRY_POINT_PATTERNS)) {
        for (const pattern of config.patterns) {
          if (pattern.test(content)) {
            // Avoid duplicates
            if (!entryPoints.some(e => e.path === path)) {
              entryPoints.push({
                path,
                type: 'pattern_match',
                language: lang,
                confidence: 'medium',
              });
            }
            break;
          }
        }
      }
    }

    this.projectIndex.entry_points = entryPoints;
    this.diagnosis.structure.entryPoints = entryPoints.map(e => e.path);
  }

  _scanConfigFiles() {
    const configs = [];

    for (const [path, content] of this.files) {
      const filename = path.split('/').pop();

      // Check exact filename matches
      const config = CONFIG_FILE_PATTERNS[filename];
      if (config) {
        const parsed = this._tryParseConfig(content, filename);
        configs.push({
          path,
          type: config.type,
          category: config.category,
          parsed_data: parsed,
        });
        continue;
      }

      // Check path patterns (for directories like .github/workflows)
      for (const [pattern, cfg] of Object.entries(CONFIG_FILE_PATTERNS)) {
        if (path.includes(pattern) && !configs.some(c => c.path === path)) {
          configs.push({
            path,
            type: cfg.type,
            category: cfg.category,
          });
        }
      }
    }

    this.projectIndex.config_files = configs;
  }

  _tryParseConfig(content, filename) {
    try {
      if (filename.endsWith('.json')) {
        return JSON.parse(content);
      }
      // For other formats, just return null (could add YAML/TOML parsing)
      return null;
    } catch {
      return null;
    }
  }

  _scanTodoFixme() {
    const locations = [];

    for (const [path, content] of this.files) {
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const { pattern, type } of TODO_PATTERNS) {
          const regex = new RegExp(pattern.source, pattern.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            locations.push({
              path,
              line: i + 1,
              type,
              text: match[2]?.trim() || match[0],
            });
          }
        }
      }
    }

    this.projectIndex.todo_fixme_locations = locations;
    this.projectIndex.todo_fixme_count = locations.length;
  }

  _detectTestFiles() {
    const testFiles = [];
    let totalCodeFiles = 0;

    for (const [path] of this.files) {
      const ext = path.substring(path.lastIndexOf('.'));
      const info = FILE_EXTENSIONS[ext];

      // Only count code files
      if (info && ['frontend', 'backend'].includes(info.category)) {
        totalCodeFiles++;

        // Check if it's a test file
        const isTest = TEST_FILE_PATTERNS.some(pattern => pattern.test(path));
        if (isTest) {
          testFiles.push({
            path,
            language: info.language,
          });
        }
      }
    }

    this.projectIndex.test_files = testFiles;

    // Estimate test coverage (rough heuristic: test files / code files ratio)
    const nonTestCodeFiles = totalCodeFiles - testFiles.length;
    if (nonTestCodeFiles > 0) {
      // Assume each test file covers ~2 source files on average
      const estimatedCoverage = Math.min(100, Math.round((testFiles.length * 2 / nonTestCodeFiles) * 100));
      this.projectIndex.test_coverage_estimate = estimatedCoverage;
    }
  }

  _generateModuleSummaries() {
    const summaries = [];
    const significantFiles = Array.from(this.files.entries())
      .filter(([path]) => {
        const ext = path.substring(path.lastIndexOf('.'));
        const info = FILE_EXTENSIONS[ext];
        return info && ['frontend', 'backend'].includes(info.category);
      })
      .sort((a, b) => b[1].length - a[1].length) // Sort by size
      .slice(0, 20); // Top 20 largest files

    for (const [path, content] of significantFiles) {
      const lines = content.split('\n');
      const exports = this._extractExports(content, path);
      const imports = extractImports(content, this._getLanguage(path));

      summaries.push({
        path,
        lines: lines.length,
        exports,
        imports: imports.slice(0, 10), // Limit imports
        first_lines: lines.slice(0, 5).join('\n'), // First 5 lines as preview
      });
    }

    this.projectIndex.module_summaries = summaries;
  }

  _extractExports(content, path) {
    const exports = [];
    const ext = path.substring(path.lastIndexOf('.'));

    if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
      // ES6 exports
      const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:const|let|var|function|class|async function)\s+(\w+)/g);
      for (const match of exportMatches) {
        exports.push(match[1]);
      }
      // Named exports
      const namedExports = content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g);
      for (const match of namedExports) {
        exports.push(...match[1].split(',').map(s => s.trim().split(' ')[0]));
      }
    } else if (['.py'].includes(ext)) {
      // Python: look for class and function definitions at module level
      const defMatches = content.matchAll(/^(?:class|def|async def)\s+(\w+)/gm);
      for (const match of defMatches) {
        if (!match[1].startsWith('_')) {
          exports.push(match[1]);
        }
      }
    }

    return exports.slice(0, 15); // Limit to 15 exports
  }

  _getLanguage(path) {
    const ext = path.substring(path.lastIndexOf('.'));
    const info = FILE_EXTENSIONS[ext];
    if (!info) return 'javascript';
    if (info.language.includes('typescript')) return 'typescript';
    if (info.language.includes('javascript')) return 'javascript';
    return info.language;
  }

  _calculateReadinessScore() {
    const breakdown = {
      has_entry_point: 0,
      has_package_manager: 0,
      has_tests: 0,
      has_ci: 0,
      has_docker: 0,
      has_env_template: 0,
      low_todo_count: 0,
      no_circular_deps: 0,
    };

    // Entry point (15 points)
    if (this.projectIndex.entry_points.length > 0) {
      breakdown.has_entry_point = 15;
    }

    // Package manager (15 points)
    if (this.projectIndex.package_managers.length > 0) {
      breakdown.has_package_manager = 15;
    }

    // Tests (20 points)
    if (this.projectIndex.test_files.length > 0) {
      breakdown.has_tests = Math.min(20, this.projectIndex.test_files.length * 4);
    }

    // CI/CD (15 points)
    const hasCI = this.projectIndex.config_files.some(c => c.category === 'ci');
    if (hasCI) {
      breakdown.has_ci = 15;
    }

    // Docker (10 points)
    const hasDocker = this.projectIndex.config_files.some(c => c.category === 'container');
    if (hasDocker) {
      breakdown.has_docker = 10;
    }

    // Env template (10 points)
    const hasEnvTemplate = this.projectIndex.config_files.some(c => c.type === 'dotenv-template');
    if (hasEnvTemplate) {
      breakdown.has_env_template = 10;
    }

    // Low TODO count (10 points)
    if (this.projectIndex.todo_fixme_count < 5) {
      breakdown.low_todo_count = 10;
    } else if (this.projectIndex.todo_fixme_count < 15) {
      breakdown.low_todo_count = 5;
    }

    // No circular deps (5 points)
    if (this.projectIndex.circular_deps.length === 0) {
      breakdown.no_circular_deps = 5;
    }

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    this.projectIndex.readiness_score = totalScore;
    this.projectIndex.readiness_breakdown = breakdown;
  }

  // ==========================================================================
  // LEGACY METHODS (preserved for backwards compatibility)
  // ==========================================================================

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

// Export constants for external use
export {
  FILE_EXTENSIONS,
  FRAMEWORK_INDICATORS,
  ENTRY_POINT_PATTERNS,
  CONFIG_FILE_PATTERNS,
  TODO_PATTERNS,
  TEST_FILE_PATTERNS,
};

export default projectScanner;
