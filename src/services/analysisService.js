import { useProjectStore, useTaskStore } from '@/store/projectStore';
import { InvokeLLM } from '@/services/aiService';
import { projectScanner } from '@/services/projectScanner';

const IMPORTANT_PATHS = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml', 'vite.config.js', 'next.config.js'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.vue', '.svelte'];
const MAX_IMPORTANT_FILES = 5;
const MAX_IMPORTANT_CHARS = 1000; // Reduce to focus context
const MAX_SAMPLE_FILES = 10;      // Increase sample files for better coverage
const MAX_CODE_CHARS = 1500;      // Allow slightly more code per file
const MAX_FILE_LIST_ENTRIES = 50; // Limit file list for structure context
const CONTEXT_ERROR_PATTERNS = ['context length', 'token limit', 'maximum context', 'too many tokens', 'request too large'];

// The prompt template is updated to explicitly request the *indexed data* (file lists, snippets)
// and discourage the AI from asking for the whole repo.
const buildAnalysisPrompt = (projectData, fileList, importantFiles, sampleCode) => {
  const sourceDescription = projectData.zip_file_url
    ? 'Analyze the uploaded ZIP file content metadata and samples.'
    : `Analyze the GitHub repository (${projectData.github_url}) structure and code samples.`;

  return `${sourceDescription}

You are a senior software architect and technical lead (Brain Lane's "Senior Dev Brain"). Your task is to perform a comprehensive project diagnosis based ONLY on the provided INDEXED METADATA and CODE SAMPLES. **DO NOT ask for more files; extrapolate from what you have.**

INDEXED METADATA:
${fileList ? `FILE STRUCTURE (Top ${MAX_FILE_LIST_ENTRIES} entries):\n${fileList}\n` : ''}
${importantFiles ? `CONFIGURATION & KEY FILES (Truncated):\n${importantFiles}\n` : ''}

SAMPLE SOURCE CODE (Randomly selected or high-impact files - Truncated):
${sampleCode ? `${sampleCode}\n` : 'No code samples provided in context. Rely on file structure and configs.'}

Provide a DETAILED analysis matching the schema. Focus on the core aspects:

1. **PROJECT SUMMARY**: What the project does, its primary purpose and domain.
2. **TECHNOLOGY STACK**: Framework, language, dependencies (from package.json/etc.).
3. **ARCHITECTURE ANALYSIS**: Overall pattern, key components (e.g., UI, Service, Data), and main data flow.
4. **SECURITY VULNERABILITIES** (Check samples for exposed secrets, weak validation).
5. **CODE SMELLS & OPTIMIZATION** (Long files, empty blocks, missing patterns).
6. **ISSUES FOUND**: Broken imports, missing config values, obvious TODOs/FIXMEs.
7. **TEST COVERAGE GAPS**: Suggest where initial tests should be focused.

8. **COMPLETION TASKS** (15-25 critical and actionable tasks. Adhere strictly to the required fields and counts.):
- Features to complete
- Bugs/Security fixes (Highest Priority)
- Refactoring/Tests/Infra/Documentation (Minimum 5 refactor, 3 test, 2 infra/docs)

You MUST populate the tasks array with AT LEAST 15 specific, actionable tasks.

Each task MUST include ALL of the following fields: title, description, category, type, priority, estimated_effort, files_affected.
`;
};

// ... (responseSchema remains the same)

const responseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    detected_stack: {
      type: 'object',
      properties: {
        framework: { type: 'string' },
        language: { type: 'string' },
        package_manager: { type: 'string' },
        testing_framework: { type: 'string' },
        database: { type: 'string' },
        additional: { type: 'array', items: { type: 'string' } },
      },
    },
    architecture: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        external_dependencies: { type: 'array', items: { type: 'string' } },
        data_flow: { type: 'string' },
      },
    },
    security_vulnerabilities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cwe_id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    code_smells: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
        },
      },
    },
    test_suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          target_file: { type: 'string' },
          function_name: { type: 'string' },
          test_type: { type: 'string', enum: ['unit', 'integration', 'e2e'] },
          description: { type: 'string' },
          test_cases: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['feature', 'bugfix', 'refactor', 'test', 'documentation', 'security', 'infra'],
          },
          type: {
            type: 'string',
            enum: ['refactor', 'test', 'bugfix', 'feature', 'infra'],
          },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          estimated_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
          files_affected: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const normalizeTasks = (rawTasks, projectId) => {
  if (!Array.isArray(rawTasks)) return [];

  return rawTasks.map((task, index) => ({
    id: task.id || `${projectId}-task-${index + 1}`,
    project_id: projectId,
    title: String(task.title || 'Untitled task'),
    description: String(task.description || 'No description provided.'),
    category: task.category || 'refactor',
    type: task.type || 'refactor',
    priority: task.priority || 'medium',
    estimated_effort: task.estimated_effort || 'medium',
    files_affected: Array.isArray(task.files_affected) ? task.files_affected : [],
    status: task.status || 'pending',
  }));
};

const buildHeuristicTasksFromProject = (project) => {
  const tasks = [];

  tasks.push({
    title: 'Review overall project architecture',
    description:
      'Document current architecture, boundaries between modules, and key data flows to establish a baseline for refactoring.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Add core integration tests for critical flows',
    description:
      'Identify the most important user journeys and add integration tests to cover them end-to-end.',
    category: 'test',
    type: 'test',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Introduce basic CI pipeline',
    description:
      'Set up a minimal CI pipeline that runs linting and tests on every push to the main branch.',
    category: 'infra',
    type: 'infra',
    priority: 'medium',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Improve error handling in critical services',
    description:
      'Identify services with missing or weak error handling and add consistent error propagation and logging.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Harden input validation and sanitization',
    description:
      'Review all user input points and ensure they are validated and sanitized to prevent common vulnerabilities.',
    category: 'security',
    type: 'bugfix',
    priority: 'critical',
    estimated_effort: 'small',
    files_affected: [],
  });

  return tasks;
};

const collectImportantFiles = (fileContents) => {
  let importantFiles = '';
  let count = 0;
  for (const path of Object.keys(fileContents)) {
    if (IMPORTANT_PATHS.some((p) => path.toLowerCase().endsWith(p.toLowerCase()))) {
      importantFiles += `\n--- ${path} ---\n${fileContents[path]?.substring(0, MAX_IMPORTANT_CHARS)}\n`;
      count += 1;
      if (count >= MAX_IMPORTANT_FILES) break;
    }
  }
  return importantFiles;
};

const collectSampleCode = (fileContents) => {
  let sampleCode = '';
  let codeCount = 0;

  for (const [path, content] of Object.entries(fileContents)) {
    if (codeCount >= MAX_SAMPLE_FILES) break;
    if (CODE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext)) && content && content.length > 500) {
      sampleCode += `\n--- ${path} ---\n${content.substring(0, MAX_CODE_CHARS)}\n`;
      codeCount++;
    }
  }

  return sampleCode;
};

const isContextError = (message = '') => {
  const lower = message.toLowerCase();
  return CONTEXT_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
};

const formatFileList = (filePaths, limit = MAX_FILE_LIST_ENTRIES) => {
  const limited = filePaths.slice(0, limit);
  const remaining = filePaths.length - limited.length;
  const baseList = limited.join('\n');
  return remaining > 0 ? `${baseList}\n...and ${remaining} more files (truncated for context)` : baseList;
};

export async function runProjectAnalysis(projectId) {
  const projectStore = useProjectStore.getState();
  const taskStore = useTaskStore.getState();

  console.log('🧠 runProjectAnalysis called for project:', projectId);
  const projectData = await projectStore.getProjectAsync(projectId);

  if (!projectData) {
    throw new Error('Project not found');
  }

  const fileContents = projectData.file_contents || {};
  const filePaths = Object.keys(fileContents);
  const fileCount = filePaths.length;

  if (fileCount === 0) {
    throw new Error('No files were extracted for this project. Please re-upload the ZIP.');
  }

  console.log('🔍 Starting analysis with', fileCount, 'files');

  // Always run local ProjectScanner first to populate baseline data
  const filesForScanner = filePaths.map((path) => ({ path, content: fileContents[path] || '' }));
  let localDiagnosis = null;
  try {
    localDiagnosis = await projectScanner.scan(filesForScanner, {
      onProgress: (pct, msg) => {
        if (pct % 25 === 0) console.log(`🧭 Scanner ${pct}% – ${msg}`);
      },
    });
    const fileTreeFromScanner = filePaths.map((p) => ({ path: p, type: 'file', size: (fileContents[p] || '').length }));
    // Map scanner output to project fields
    const baselinePayload = {
      summary: localDiagnosis.summary || projectData.summary,
      detected_stack: Array.isArray(projectData.detected_stack) && projectData.detected_stack.length
        ? projectData.detected_stack
        : (localDiagnosis.frameworks || []),
      architecture: {
        pattern: (localDiagnosis.frameworks || [])[0] || 'monolith',
        components: (localDiagnosis.structure?.directories || []).slice(0, 50).map((dir) => ({
          name: dir.split('/').pop() || dir,
          responsibility: 'Module',
          files: filePaths.filter((fp) => fp.startsWith(dir)).slice(0, 20),
        })),
        external_dependencies: localDiagnosis.dependencies?.external || [],
        data_flow: 'Derived from import graph and entry points.',
      },
      // Derive basic smells/issues from scanner issues list
      code_smells: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        description: i.message,
        suggestion: 'See analysis details',
      })),
      // Security subset (type === 'security')
      security_vulnerabilities: (localDiagnosis.issues || [])
        .filter((i) => i.type === 'security')
        .slice(0, 50)
        .map((i) => ({
          cwe_id: 'N/A',
          title: i.message,
          severity: i.severity || 'high',
          file: i.file,
          line: i.line,
          description: i.message,
          recommendation: 'Remove hardcoded secrets, validate inputs, and follow security best practices.',
        })),
      // Leave test suggestions empty; filled by AI or heuristics later
      test_suggestions: projectData.test_suggestions || [],
      issues: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        line: i.line,
        description: i.message,
      })),
      file_tree: fileTreeFromScanner,
      file_contents: fileContents,
      status: 'analyzing',
      analysis_strategy: 'local-baseline',
    };
    projectStore.updateProject(projectId, baselinePayload);
    console.log('✅ Local baseline analysis populated');
  } catch (scannerErr) {
    console.warn('⚠️ Local scanner failed:', scannerErr?.message || scannerErr);
  }
  const fileList = formatFileList(filePaths, MAX_FILE_LIST_ENTRIES) || 'No files extracted';
  const importantFiles = collectImportantFiles(fileContents);
  const sampleCode = collectSampleCode(fileContents);

  const persistAnalysis = (analysisResult, opts = {}) => {
    const fileTree = filePaths.map((path) => ({
      path,
      type: 'file',
      size: fileContents[path]?.length || 0,
    }));

    const payload = {
      ...projectData,
      summary: analysisResult.summary,
      detected_stack: analysisResult.detected_stack,
      architecture: analysisResult.architecture,
      security_vulnerabilities: analysisResult.security_vulnerabilities,
      code_smells: analysisResult.code_smells,
      test_suggestions: analysisResult.test_suggestions,
      issues: analimport { useProjectStore, useTaskStore } from '@/store/projectStore';
import { InvokeLLM } from '@/services/aiService';
import { projectScanner } from '@/services/projectScanner';

const IMPORTANT_PATHS = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml', 'vite.config.js', 'next.config.js'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.vue', '.svelte'];
const MAX_IMPORTANT_FILES = 5;
const MAX_IMPORTANT_CHARS = 1000; // Reduce to focus context
const MAX_SAMPLE_FILES = 10;      // Increase sample files for better coverage
const MAX_CODE_CHARS = 1500;      // Allow slightly more code per file
const MAX_FILE_LIST_ENTRIES = 50; // Limit file list for structure context
const CONTEXT_ERROR_PATTERNS = ['context length', 'token limit', 'maximum context', 'too many tokens', 'request too large'];

// The prompt template is updated to explicitly request the *indexed data* (file lists, snippets)
// and discourage the AI from asking for the whole repo.
const buildAnalysisPrompt = (projectData, fileList, importantFiles, sampleCode) => {
  const sourceDescription = projectData.zip_file_url
    ? 'Analyze the uploaded ZIP file content metadata and samples.'
    : `Analyze the GitHub repository (${projectData.github_url}) structure and code samples.`;

  return `${sourceDescription}

You are a senior software architect and technical lead (Brain Lane's "Senior Dev Brain"). Your task is to perform a comprehensive project diagnosis based ONLY on the provided INDEXED METADATA and CODE SAMPLES. **DO NOT ask for more files; extrapolate from what you have.**

INDEXED METADATA:
${fileList ? `FILE STRUCTURE (Top ${MAX_FILE_LIST_ENTRIES} entries):\n${fileList}\n` : ''}
${importantFiles ? `CONFIGURATION & KEY FILES (Truncated):\n${importantFiles}\n` : ''}

SAMPLE SOURCE CODE (Randomly selected or high-impact files - Truncated):
${sampleCode ? `${sampleCode}\n` : 'No code samples provided in context. Rely on file structure and configs.'}

Provide a DETAILED analysis matching the schema. Focus on the core aspects:

1. **PROJECT SUMMARY**: What the project does, its primary purpose and domain.
2. **TECHNOLOGY STACK**: Framework, language, dependencies (from package.json/etc.).
3. **ARCHITECTURE ANALYSIS**: Overall pattern, key components (e.g., UI, Service, Data), and main data flow.
4. **SECURITY VULNERABILITIES** (Check samples for exposed secrets, weak validation).
5. **CODE SMELLS & OPTIMIZATION** (Long files, empty blocks, missing patterns).
6. **ISSUES FOUND**: Broken imports, missing config values, obvious TODOs/FIXMEs.
7. **TEST COVERAGE GAPS**: Suggest where initial tests should be focused.

8. **COMPLETION TASKS** (15-25 critical and actionable tasks. Adhere strictly to the required fields and counts.):
- Features to complete
- Bugs/Security fixes (Highest Priority)
- Refactoring/Tests/Infra/Documentation (Minimum 5 refactor, 3 test, 2 infra/docs)

You MUST populate the tasks array with AT LEAST 15 specific, actionable tasks.

Each task MUST include ALL of the following fields: title, description, category, type, priority, estimated_effort, files_affected.
`;
};

// ... (responseSchema remains the same)

const responseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    detected_stack: {
      type: 'object',
      properties: {
        framework: { type: 'string' },
        language: { type: 'string' },
        package_manager: { type: 'string' },
        testing_framework: { type: 'string' },
        database: { type: 'string' },
        additional: { type: 'array', items: { type: 'string' } },
      },
    },
    architecture: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        external_dependencies: { type: 'array', items: { type: 'string' } },
        data_flow: { type: 'string' },
      },
    },
    security_vulnerabilities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cwe_id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    code_smells: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
        },
      },
    },
    test_suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          target_file: { type: 'string' },
          function_name: { type: 'string' },
          test_type: { type: 'string', enum: ['unit', 'integration', 'e2e'] },
          description: { type: 'string' },
          test_cases: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['feature', 'bugfix', 'refactor', 'test', 'documentation', 'security', 'infra'],
          },
          type: {
            type: 'string',
            enum: ['refactor', 'test', 'bugfix', 'feature', 'infra'],
          },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          estimated_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
          files_affected: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const normalizeTasks = (rawTasks, projectId) => {
  if (!Array.isArray(rawTasks)) return [];

  return rawTasks.map((task, index) => ({
    id: task.id || `${projectId}-task-${index + 1}`,
    project_id: projectId,
    title: String(task.title || 'Untitled task'),
    description: String(task.description || 'No description provided.'),
    category: task.category || 'refactor',
    type: task.type || 'refactor',
    priority: task.priority || 'medium',
    estimated_effort: task.estimated_effort || 'medium',
    files_affected: Array.isArray(task.files_affected) ? task.files_affected : [],
    status: task.status || 'pending',
  }));
};

const buildHeuristicTasksFromProject = (project) => {
  const tasks = [];

  tasks.push({
    title: 'Review overall project architecture',
    description:
      'Document current architecture, boundaries between modules, and key data flows to establish a baseline for refactoring.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Add core integration tests for critical flows',
    description:
      'Identify the most important user journeys and add integration tests to cover them end-to-end.',
    category: 'test',
    type: 'test',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Introduce basic CI pipeline',
    description:
      'Set up a minimal CI pipeline that runs linting and tests on every push to the main branch.',
    category: 'infra',
    type: 'infra',
    priority: 'medium',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Improve error handling in critical services',
    description:
      'Identify services with missing or weak error handling and add consistent error propagation and logging.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affimport { useProjectStore, useTaskStore } from '@/store/projectStore';
import { InvokeLLM } from '@/services/aiService';
import { projectScanner } from '@/services/projectScanner';

const IMPORTANT_PATHS = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml', 'vite.config.js', 'next.config.js'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.vue', '.svelte'];
const MAX_IMPORTANT_FILES = 5;
const MAX_IMPORTANT_CHARS = 1000; // Reduce to focus context
const MAX_SAMPLE_FILES = 10;      // Increase sample files for better coverage
const MAX_CODE_CHARS = 1500;      // Allow slightly more code per file
const MAX_FILE_LIST_ENTRIES = 50; // Limit file list for structure context
const CONTEXT_ERROR_PATTERNS = ['context length', 'token limit', 'maximum context', 'too many tokens', 'request too large'];

// The prompt template is updated to explicitly request the *indexed data* (file lists, snippets)
// and discourage the AI from asking for the whole repo.
const buildAnalysisPrompt = (projectData, fileList, importantFiles, sampleCode) => {
  const sourceDescription = projectData.zip_file_url
    ? 'Analyze the uploaded ZIP file content metadata and samples.'
    : `Analyze the GitHub repository (${projectData.github_url}) structure and code samples.`;

  return `${sourceDescription}

You are a senior software architect and technical lead (Brain Lane's "Senior Dev Brain"). Your task is to perform a comprehensive project diagnosis based ONLY on the provided INDEXED METADATA and CODE SAMPLES. **DO NOT ask for more files; extrapolate from what you have.**

INDEXED METADATA:
${fileList ? `FILE STRUCTURE (Top ${MAX_FILE_LIST_ENTRIES} entries):\n${fileList}\n` : ''}
${importantFiles ? `CONFIGURATION & KEY FILES (Truncated):\n${importantFiles}\n` : ''}

SAMPLE SOURCE CODE (Randomly selected or high-impact files - Truncated):
${sampleCode ? `${sampleCode}\n` : 'No code samples provided in context. Rely on file structure and configs.'}

Provide a DETAILED analysis matching the schema. Focus on the core aspects:

1. **PROJECT SUMMARY**: What the project does, its primary purpose and domain.
2. **TECHNOLOGY STACK**: Framework, language, dependencies (from package.json/etc.).
3. **ARCHITECTURE ANALYSIS**: Overall pattern, key components (e.g., UI, Service, Data), and main data flow.
4. **SECURITY VULNERABILITIES** (Check samples for exposed secrets, weak validation).
5. **CODE SMELLS & OPTIMIZATION** (Long files, empty blocks, missing patterns).
6. **ISSUES FOUND**: Broken imports, missing config values, obvious TODOs/FIXMEs.
7. **TEST COVERAGE GAPS**: Suggest where initial tests should be focused.

8. **COMPLETION TASKS** (15-25 critical and actionable tasks. Adhere strictly to the required fields and counts.):
- Features to complete
- Bugs/Security fixes (Highest Priority)
- Refactoring/Tests/Infra/Documentation (Minimum 5 refactor, 3 test, 2 infra/docs)

You MUST populate the tasks array with AT LEAST 15 specific, actionable tasks.

Each task MUST include ALL of the following fields: title, description, category, type, priority, estimated_effort, files_affected.
`;
};

// ... (responseSchema remains the same)

const responseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    detected_stack: {
      type: 'object',
      properties: {
        framework: { type: 'string' },
        language: { type: 'string' },
        package_manager: { type: 'string' },
        testing_framework: { type: 'string' },
        database: { type: 'string' },
        additional: { type: 'array', items: { type: 'string' } },
      },
    },
    architecture: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              files: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        external_dependencies: { type: 'array', items: { type: 'string' } },
        data_flow: { type: 'string' },
      },
    },
    security_vulnerabilities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cwe_id: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    code_smells: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          description: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          file: { type: 'string' },
          line: { type: 'number' },
          description: { type: 'string' },
        },
      },
    },
    test_suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          target_file: { type: 'string' },
          function_name: { type: 'string' },
          test_type: { type: 'string', enum: ['unit', 'integration', 'e2e'] },
          description: { type: 'string' },
          test_cases: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: {
            type: 'string',
            enum: ['feature', 'bugfix', 'refactor', 'test', 'documentation', 'security', 'infra'],
          },
          type: {
            type: 'string',
            enum: ['refactor', 'test', 'bugfix', 'feature', 'infra'],
          },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          estimated_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
          files_affected: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const normalizeTasks = (rawTasks, projectId) => {
  if (!Array.isArray(rawTasks)) return [];

  return rawTasks.map((task, index) => ({
    id: task.id || `${projectId}-task-${index + 1}`,
    project_id: projectId,
    title: String(task.title || 'Untitled task'),
    description: String(task.description || 'No description provided.'),
    category: task.category || 'refactor',
    type: task.type || 'refactor',
    priority: task.priority || 'medium',
    estimated_effort: task.estimated_effort || 'medium',
    files_affected: Array.isArray(task.files_affected) ? task.files_affected : [],
    status: task.status || 'pending',
  }));
};

const buildHeuristicTasksFromProject = (project) => {
  const tasks = [];

  tasks.push({
    title: 'Review overall project architecture',
    description:
      'Document current architecture, boundaries between modules, and key data flows to establish a baseline for refactoring.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Add core integration tests for critical flows',
    description:
      'Identify the most important user journeys and add integration tests to cover them end-to-end.',
    category: 'test',
    type: 'test',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Introduce basic CI pipeline',
    description:
      'Set up a minimal CI pipeline that runs linting and tests on every push to the main branch.',
    category: 'infra',
    type: 'infra',
    priority: 'medium',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Improve error handling in critical services',
    description:
      'Identify services with missing or weak error handling and add consistent error propagation and logging.',
    category: 'refactor',
    type: 'refactor',
    priority: 'high',
    estimated_effort: 'medium',
    files_affected: [],
  });

  tasks.push({
    title: 'Harden input validation and sanitization',
    description:
      'Review all user input points and ensure they are validated and sanitized to prevent common vulnerabilities.',
    category: 'security',
    type: 'bugfix',
    priority: 'critical',
    estimated_effort: 'small',
    files_affected: [],
  });

  return tasks;
};

const collectImportantFiles = (fileContents) => {
  let importantFiles = '';
  let count = 0;
  for (const path of Object.keys(fileContents)) {
    if (IMPORTANT_PATHS.some((p) => path.toLowerCase().endsWith(p.toLowerCase()))) {
      importantFiles += `\n--- ${path} ---\n${fileContents[path]?.substring(0, MAX_IMPORTANT_CHARS)}\n`;
      count += 1;
      if (count >= MAX_IMPORTANT_FILES) break;
    }
  }
  return importantFiles;
};

const collectSampleCode = (fileContents) => {
  let sampleCode = '';
  let codeCount = 0;

  for (const [path, content] of Object.entries(fileContents)) {
    if (codeCount >= MAX_SAMPLE_FILES) break;
    if (CODE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext)) && content && content.length > 500) {
      sampleCode += `\n--- ${path} ---\n${content.substring(0, MAX_CODE_CHARS)}\n`;
      codeCount++;
    }
  }

  return sampleCode;
};

const isContextError = (message = '') => {
  const lower = message.toLowerCase();
  return CONTEXT_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
};

const formatFileList = (filePaths, limit = MAX_FILE_LIST_ENTRIES) => {
  const limited = filePaths.slice(0, limit);
  const remaining = filePaths.length - limited.length;
  const baseList = limited.join('\n');
  return remaining > 0 ? `${baseList}\n...and ${remaining} more files (truncated for context)` : baseList;
};

export async function runProjectAnalysis(projectId) {
  const projectStore = useProjectStore.getState();
  const taskStore = useTaskStore.getState();

  console.log('🧠 runProjectAnalysis called for project:', projectId);
  const projectData = await projectStore.getProjectAsync(projectId);

  if (!projectData) {
    throw new Error('Project not found');
  }

  const fileContents = projectData.file_contents || {};
  const filePaths = Object.keys(fileContents);
  const fileCount = filePaths.length;

  if (fileCount === 0) {
    throw new Error('No files were extracted for this project. Please re-upload the ZIP.');
  }

  console.log('🔍 Starting analysis with', fileCount, 'files');

  // Always run local ProjectScanner first to populate baseline data
  const filesForScanner = filePaths.map((path) => ({ path, content: fileContents[path] || '' }));
  let localDiagnosis = null;
  try {
    localDiagnosis = await projectScanner.scan(filesForScanner, {
      onProgress: (pct, msg) => {
        if (pct % 25 === 0) console.log(`🧭 Scanner ${pct}% – ${msg}`);
      },
    });
    const fileTreeFromScanner = filePaths.map((p) => ({ path: p, type: 'file', size: (fileContents[p] || '').length }));
    // Map scanner output to project fields
    const baselinePayload = {
      summary: localDiagnosis.summary || projectData.summary,
      detected_stack: Array.isArray(projectData.detected_stack) && projectData.detected_stack.length
        ? projectData.detected_stack
        : (localDiagnosis.frameworks || []),
      architecture: {
        pattern: (localDiagnosis.frameworks || [])[0] || 'monolith',
        components: (localDiagnosis.structure?.directories || []).slice(0, 50).map((dir) => ({
          name: dir.split('/').pop() || dir,
          responsibility: 'Module',
          files: filePaths.filter((fp) => fp.startsWith(dir)).slice(0, 20),
        })),
        external_dependencies: localDiagnosis.dependencies?.external || [],
        data_flow: 'Derived from import graph and entry points.',
      },
      // Derive basic smells/issues from scanner issues list
      code_smells: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        description: i.message,
        suggestion: 'See analysis details',
      })),
      // Security subset (type === 'security')
      security_vulnerabilities: (localDiagnosis.issues || [])
        .filter((i) => i.type === 'security')
        .slice(0, 50)
        .map((i) => ({
          cwe_id: 'N/A',
          title: i.message,
          severity: i.severity || 'high',
          file: i.file,
          line: i.line,
          description: i.message,
          recommendation: 'Remove hardcoded secrets, validate inputs, and follow security best practices.',
        })),
      // Leave test suggestions empty; filled by AI or heuristics later
      test_suggestions: projectData.test_suggestions || [],
      issues: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        line: i.line,
        description: i.message,
      })),
      file_tree: fileTreeFromScanner,
      file_contents: fileContents,
      status: 'analyzing',
      analysis_strategy: 'local-baseline',
    };
    projectStore.updateProject(projectId, baselinePayload);
    console.log('✅ Local baseline analysis populated');
  } catch (scannerErr) {
    console.warn('⚠️ Local scanner failed:', scannerErr?.message || scannerErr);
  }
  const fileList = formatFileList(filePaths, MAX_FILE_LIST_ENTRIES) || 'No files extracted';
  const importantFiles = collectImportantFiles(fileContents);
  const sampleCode = collectSampleCode(fileContents);

  const persistAnalysis = (analysisResult, opts = {}) => {
    const fileTree = filePaths.map((path) => ({
      path,
      type: 'file',
      size: fileContents[path]?.length || 0,
    }));

    const payload = {
      ...projectData,
      summary: analysisResult.summary,
      detected_stack: analysisResult.detected_stack,
      architecture: analysisResult.architecture,
      security_vulnerabilities: analysisResult.security_vulnerabilities,
      code_smells: analysisResult.code_smells,
      test_suggestions: analysisResult.test_suggestions,
      issues: analysisResult.issues,
      file_tree: fileTree,
      file_contents: fileContents,
      status: 'ready',
      analysis_strategy: opts.strategy || 'full',
    };

    projectStore.updateProject(projectId, payload);

    const normalizedTasks = normalizeTasks(analysisResult.tasks || [], projectId);

    console.log('📋 Creating tasks from analysis result. Tasks received:', normalizedTasks.length);
    if (normalizedTasks.length) {
      normalizedTasks.forEach((task) => {
        // Ensure no duplicate tasks are created
        const existingTask = taskStore.tasks.find(
          (t) => t.project_id === projectId && t.title === task.title
        );
        if (!existingTask) {
          console.log('✏️ Creating task:', task.title, '| Priority:', task.priority, '| Category:', task.category, '| Type:', task.type);
          taskStore.createTask(task);
        } else {
          console.log('⏭️ Skipping duplicate task:', task.title);
        }
      });
    } else {
      console.warn('⚠️ No tasks in AI analysis result');
    }

    return payload;
  };

  try {
    const analysisPrompt = buildAnalysisPrompt(projectData, fileList, importantFiles, sampleCode);

    console.log('🤖 Calling AI with targeted context blocks.');
    const analysisResult = await InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
    });

    console.log('✅ AI Analysis complete, updating project store');

    let finalResult = analysisResult || {};

    if (!Array.isArray(finalResult.tasks) || finalResult.tasks.length < 15) {
      console.warn('⚠️ Analysis returned insufficient tasks, generating tasks from findings...');
      try {
        const { GenerateTasks } = await import('@/services/aiService');
        const taskGenResult = await GenerateTasks({
          summary: finalResult.summary,
          detected_stack: finalResult.detected_stack,
          architecture: finalResult.architecture,
          security_vulnerabilities: finalResult.security_vulnerabilities,
          code_smells: finalResult.code_smells,
          issues: finalResult.issues,
        });

        if (taskGenResult?.tasks?.length) {
          console.log('✅ Fallback task generation produced', taskGenResult.tasks.length, 'tasks');
          finalResult = { ...finalResult, tasks: taskGenResult.tasks };
        } else {
          console.warn('⚠️ Fallback task generation returned no tasks');
        }
      } catch (taskErr) {
        console.error('❌ Failed to generate tasks from analysis:', taskErr);
      }
    }

    // Fallback 2: if tasks are STILL empty, synthesize basic tasks from project metadata
    if (!finalResult.tasks || !finalResult.tasks.length) {
      console.warn('⚠️ No tasks from AI, synthesizing heuristic tasks');
      finalResult.tasks = buildHeuristicTasksFromProject(projectData);
    }

    return persistAnalysis(finalResult);
  } catch (error) {
    console.error('❌ Analysis failed:', error);

    if (isContextError(error.message)) {
      // The secondary fallback strategy (retry with even less context) is now implicitly handled by the refined prompt in V1.
      // If it fails now, it is a definitive failure for the current LLM limits.
      console.error('❌ Definitive context limit failure after refined prompting.');
    }

    // If local baseline exists, mark ready with baseline
    if (localDiagnosis) {
      const baselineReady = {
        ...projectData,
        status: 'ready',
        analysis_strategy: 'baseline-only',
        // Merge AI-generated fields (if any partial data came through before failure) with baseline
        summary: projectData.summary || localDiagnosis.summary,
        detected_stack: projectData.detected_stack || localDiagnosis.frameworks,
      };
      projectStore.updateProject(projectId, baselineReady);
      console.warn('⚠️ Using baseline-only results due to AI failure');
      return baselineReady;
    } else {
      projectStore.updateProject(projectId, {
        status: 'error',
        error_message: error.message,
      });
      throw error;
    }
  }
}ected: [],
  });

  tasks.push({
    title: 'Harden input validation and sanitization',
    description:
      'Review all user input points and ensure they are validated and sanitized to prevent common vulnerabilities.',
    category: 'security',
    type: 'bugfix',
    priority: 'critical',
    estimated_effort: 'small',
    files_affected: [],
  });

  return tasks;
};

const collectImportantFiles = (fileContents) => {
  let importantFiles = '';
  let count = 0;
  for (const path of Object.keys(fileContents)) {
    if (IMPORTANT_PATHS.some((p) => path.toLowerCase().endsWith(p.toLowerCase()))) {
      importantFiles += `\n--- ${path} ---\n${fileContents[path]?.substring(0, MAX_IMPORTANT_CHARS)}\n`;
      count += 1;
      if (count >= MAX_IMPORTANT_FILES) break;
    }
  }
  return importantFiles;
};

const collectSampleCode = (fileContents) => {
  let sampleCode = '';
  let codeCount = 0;

  for (const [path, content] of Object.entries(fileContents)) {
    if (codeCount >= MAX_SAMPLE_FILES) break;
    if (CODE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext)) && content && content.length > 500) {
      sampleCode += `\n--- ${path} ---\n${content.substring(0, MAX_CODE_CHARS)}\n`;
      codeCount++;
    }
  }

  return sampleCode;
};

const isContextError = (message = '') => {
  const lower = message.toLowerCase();
  return CONTEXT_ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
};

const formatFileList = (filePaths, limit = MAX_FILE_LIST_ENTRIES) => {
  const limited = filePaths.slice(0, limit);
  const remaining = filePaths.length - limited.length;
  const baseList = limited.join('\n');
  return remaining > 0 ? `${baseList}\n...and ${remaining} more files (truncated for context)` : baseList;
};

export async function runProjectAnalysis(projectId) {
  const projectStore = useProjectStore.getState();
  const taskStore = useTaskStore.getState();

  console.log('🧠 runProjectAnalysis called for project:', projectId);
  const projectData = await projectStore.getProjectAsync(projectId);

  if (!projectData) {
    throw new Error('Project not found');
  }

  const fileContents = projectData.file_contents || {};
  const filePaths = Object.keys(fileContents);
  const fileCount = filePaths.length;

  if (fileCount === 0) {
    throw new Error('No files were extracted for this project. Please re-upload the ZIP.');
  }

  console.log('🔍 Starting analysis with', fileCount, 'files');

  // Always run local ProjectScanner first to populate baseline data
  const filesForScanner = filePaths.map((path) => ({ path, content: fileContents[path] || '' }));
  let localDiagnosis = null;
  try {
    localDiagnosis = await projectScanner.scan(filesForScanner, {
      onProgress: (pct, msg) => {
        if (pct % 25 === 0) console.log(`🧭 Scanner ${pct}% – ${msg}`);
      },
    });
    const fileTreeFromScanner = filePaths.map((p) => ({ path: p, type: 'file', size: (fileContents[p] || '').length }));
    // Map scanner output to project fields
    const baselinePayload = {
      summary: localDiagnosis.summary || projectData.summary,
      detected_stack: Array.isArray(projectData.detected_stack) && projectData.detected_stack.length
        ? projectData.detected_stack
        : (localDiagnosis.frameworks || []),
      architecture: {
        pattern: (localDiagnosis.frameworks || [])[0] || 'monolith',
        components: (localDiagnosis.structure?.directories || []).slice(0, 50).map((dir) => ({
          name: dir.split('/').pop() || dir,
          responsibility: 'Module',
          files: filePaths.filter((fp) => fp.startsWith(dir)).slice(0, 20),
        })),
        external_dependencies: localDiagnosis.dependencies?.external || [],
        data_flow: 'Derived from import graph and entry points.',
      },
      // Derive basic smells/issues from scanner issues list
      code_smells: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        description: i.message,
        suggestion: 'See analysis details',
      })),
      // Security subset (type === 'security')
      security_vulnerabilities: (localDiagnosis.issues || [])
        .filter((i) => i.type === 'security')
        .slice(0, 50)
        .map((i) => ({
          cwe_id: 'N/A',
          title: i.message,
          severity: i.severity || 'high',
          file: i.file,
          line: i.line,
          description: i.message,
          recommendation: 'Remove hardcoded secrets, validate inputs, and follow security best practices.',
        })),
      // Leave test suggestions empty; filled by AI or heuristics later
      test_suggestions: projectData.test_suggestions || [],
      issues: (localDiagnosis.issues || []).slice(0, 100).map((i) => ({
        type: i.type,
        severity: i.severity,
        file: i.file,
        line: i.line,
        description: i.message,
      })),
      file_tree: fileTreeFromScanner,
      file_contents: fileContents,
      status: 'analyzing',
      analysis_strategy: 'local-baseline',
    };
    projectStore.updateProject(projectId, baselinePayload);
    console.log('✅ Local baseline analysis populated');
  } catch (scannerErr) {
    console.warn('⚠️ Local scanner failed:', scannerErr?.message || scannerErr);
  }
  const fileList = formatFileList(filePaths, MAX_FILE_LIST_ENTRIES) || 'No files extracted';
  const importantFiles = collectImportantFiles(fileContents);
  const sampleCode = collectSampleCode(fileContents);

  const persistAnalysis = (analysisResult, opts = {}) => {
    const fileTree = filePaths.map((path) => ({
      path,
      type: 'file',
      size: fileContents[path]?.length || 0,
    }));

    const payload = {
      ...projectData,
      summary: analysisResult.summary,
      detected_stack: analysisResult.detected_stack,
      architecture: analysisResult.architecture,
      security_vulnerabilities: analysisResult.security_vulnerabilities,
      code_smells: analysisResult.code_smells,
      test_suggestions: analysisResult.test_suggestions,
      issues: analysisResult.issues,
      file_tree: fileTree,
      file_contents: fileContents,
      status: 'ready',
      analysis_strategy: opts.strategy || 'full',
    };

    projectStore.updateProject(projectId, payload);

    const normalizedTasks = normalizeTasks(analysisResult.tasks || [], projectId);

    console.log('📋 Creating tasks from analysis result. Tasks received:', normalizedTasks.length);
    if (normalizedTasks.length) {
      normalizedTasks.forEach((task) => {
        // Ensure no duplicate tasks are created
        const existingTask = taskStore.tasks.find(
          (t) => t.project_id === projectId && t.title === task.title
        );
        if (!existingTask) {
          console.log('✏️ Creating task:', task.title, '| Priority:', task.priority, '| Category:', task.category, '| Type:', task.type);
          taskStore.createTask(task);
        } else {
          console.log('⏭️ Skipping duplicate task:', task.title);
        }
      });
    } else {
      console.warn('⚠️ No tasks in AI analysis result');
    }

    return payload;
  };

  try {
    const analysisPrompt = buildAnalysisPrompt(projectData, fileList, importantFiles, sampleCode);

    console.log('🤖 Calling AI with targeted context blocks.');
    const analysisResult = await InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
    });

    console.log('✅ AI Analysis complete, updating project store');

    let finalResult = analysisResult || {};

    if (!Array.isArray(finalResult.tasks) || finalResult.tasks.length < 15) {
      console.warn('⚠️ Analysis returned insufficient tasks, generating tasks from findings...');
      try {
        const { GenerateTasks } = await import('@/services/aiService');
        const taskGenResult = await GenerateTasks({
          summary: finalResult.summary,
          detected_stack: finalResult.detected_stack,
          architecture: finalResult.architecture,
          security_vulnerabilities: finalResult.security_vulnerabilities,
          code_smells: finalResult.code_smells,
          issues: finalResult.issues,
        });

        if (taskGenResult?.tasks?.length) {
          console.log('✅ Fallback task generation produced', taskGenResult.tasks.length, 'tasks');
          finalResult = { ...finalResult, tasks: taskGenResult.tasks };
        } else {
          console.warn('⚠️ Fallback task generation returned no tasks');
        }
      } catch (taskErr) {
        console.error('❌ Failed to generate tasks from analysis:', taskErr);
      }
    }

    // Fallback 2: if tasks are STILL empty, synthesize basic tasks from project metadata
    if (!finalResult.tasks || !finalResult.tasks.length) {
      console.warn('⚠️ No tasks from AI, synthesizing heuristic tasks');
      finalResult.tasks = buildHeuristicTasksFromProject(projectData);
    }

    return persistAnalysis(finalResult);
  } catch (error) {
    console.error('❌ Analysis failed:', error);

    if (isContextError(error.message)) {
      // The secondary fallback strategy (retry with even less context) is now implicitly handled by the refined prompt in V1.
      // If it fails now, it is a definitive failure for the current LLM limits.
      console.error('❌ Definitive context limit failure after refined prompting.');
    }

    // If local baseline exists, mark ready with baseline
    if (localDiagnosis) {
      const baselineReady = {
        ...projectData,
        status: 'ready',
        analysis_strategy: 'baseline-only',
        // Merge AI-generated fields (if any partial data came through before failure) with baseline
        summary: projectData.summary || localDiagnosis.summary,
        detected_stack: projectData.detected_stack || localDiagnosis.frameworks,
      };
      projectStore.updateProject(projectId, baselineReady);
      console.warn('⚠️ Using baseline-only results due to AI failure');
      return baselineReady;
    } else {
      projectStore.updateProject(projectId, {
        status: 'error',
        error_message: error.message,
      });
      throw error;
    }
  }
}ysisResult.issues,
      file_tree: fileTree,
      file_contents: fileContents,
      status: 'ready',
      analysis_strategy: opts.strategy || 'full',
    };

    projectStore.updateProject(projectId, payload);

    const normalizedTasks = normalizeTasks(analysisResult.tasks || [], projectId);

    console.log('📋 Creating tasks from analysis result. Tasks received:', normalizedTasks.length);
    if (normalizedTasks.length) {
      normalizedTasks.forEach((task) => {
        // Ensure no duplicate tasks are created
        const existingTask = taskStore.tasks.find(
          (t) => t.project_id === projectId && t.title === task.title
        );
        if (!existingTask) {
          console.log('✏️ Creating task:', task.title, '| Priority:', task.priority, '| Category:', task.category, '| Type:', task.type);
          taskStore.createTask(task);
        } else {
          console.log('⏭️ Skipping duplicate task:', task.title);
        }
      });
    } else {
      console.warn('⚠️ No tasks in AI analysis result');
    }

    return payload;
  };

  try {
    const analysisPrompt = buildAnalysisPrompt(projectData, fileList, importantFiles, sampleCode);

    console.log('🤖 Calling AI with targeted context blocks.');
    const analysisResult = await InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
    });

    console.log('✅ AI Analysis complete, updating project store');

    let finalResult = analysisResult || {};

    if (!Array.isArray(finalResult.tasks) || finalResult.tasks.length < 15) {
      console.warn('⚠️ Analysis returned insufficient tasks, generating tasks from findings...');
      try {
        const { GenerateTasks } = await import('@/services/aiService');
        const taskGenResult = await GenerateTasks({
          summary: finalResult.summary,
          detected_stack: finalResult.detected_stack,
          architecture: finalResult.architecture,
          security_vulnerabilities: finalResult.security_vulnerabilities,
          code_smells: finalResult.code_smells,
          issues: finalResult.issues,
        });

        if (taskGenResult?.tasks?.length) {
          console.log('✅ Fallback task generation produced', taskGenResult.tasks.length, 'tasks');
          finalResult = { ...finalResult, tasks: taskGenResult.tasks };
        } else {
          console.warn('⚠️ Fallback task generation returned no tasks');
        }
      } catch (taskErr) {
        console.error('❌ Failed to generate tasks from analysis:', taskErr);
      }
    }

    // Fallback 2: if tasks are STILL empty, synthesize basic tasks from project metadata
    if (!finalResult.tasks || !finalResult.tasks.length) {
      console.warn('⚠️ No tasks from AI, synthesizing heuristic tasks');
      finalResult.tasks = buildHeuristicTasksFromProject(projectData);
    }

    return persistAnalysis(finalResult);
  } catch (error) {
    console.error('❌ Analysis failed:', error);

    if (isContextError(error.message)) {
      // The secondary fallback strategy (retry with even less context) is now implicitly handled by the refined prompt in V1.
      // If it fails now, it is a definitive failure for the current LLM limits.
      console.error('❌ Definitive context limit failure after refined prompting.');
    }

    // If local baseline exists, mark ready with baseline
    if (localDiagnosis) {
      const baselineReady = {
        ...projectData,
        status: 'ready',
        analysis_strategy: 'baseline-only',
        // Merge AI-generated fields (if any partial data came through before failure) with baseline
        summary: projectData.summary || localDiagnosis.summary,
        detected_stack: projectData.detected_stack || localDiagnosis.frameworks,
      };
      projectStore.updateProject(projectId, baselineReady);
      console.warn('⚠️ Using baseline-only results due to AI failure');
      return baselineReady;
    } else {
      projectStore.updateProject(projectId, {
        status: 'error',
        error_message: error.message,
      });
      throw error;
    }
  }
}
