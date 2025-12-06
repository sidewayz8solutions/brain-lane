import { useProjectStore, useTaskStore } from '@/store/projectStore';
import { InvokeLLM } from '@/services/aiService';

const IMPORTANT_PATHS = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py'];
const MAX_IMPORTANT_FILES = 4;
const MAX_IMPORTANT_CHARS = 3000;
const MAX_SAMPLE_FILES = 5;
const MAX_CODE_CHARS = 2000;
const MAX_FILE_LIST_ENTRIES = 200;
const CONTEXT_ERROR_PATTERNS = ['context length', 'token limit', 'maximum context', 'too many tokens', 'request too large'];

const buildAnalysisPrompt = (projectData, fileList, importantFiles, sampleCode) => {
  const sourceDescription = projectData.zip_file_url
    ? 'Analyze the uploaded ZIP file and provide a comprehensive codebase analysis.'
    : `Analyze the GitHub repository at ${projectData.github_url} and provide a comprehensive codebase analysis.`;

  return `${sourceDescription}

You are a senior full-stack engineer and security specialist performing a comprehensive code review.

${fileList ? `FILE STRUCTURE:\n${fileList}\n` : ''}
${importantFiles ? `CONFIGURATION FILES:\n${importantFiles}\n` : ''}
${sampleCode ? `SAMPLE SOURCE CODE:\n${sampleCode}\n` : ''}

Provide a DETAILED analysis including:

1. **PROJECT SUMMARY**: What the project does, its purpose and main functionality.

2. **TECHNOLOGY STACK**: Framework, language, package manager, testing framework, databases, APIs.

3. **ARCHITECTURE ANALYSIS**:
- Overall architecture pattern (MVC, microservices, monolith, etc.)
- Key components and their responsibilities
- Data flow between components
- External dependencies and integrations

4. **SECURITY VULNERABILITIES** (check for common CWEs):
- CWE-79: Cross-site Scripting (XSS)
- CWE-89: SQL Injection
- CWE-522: Insufficiently Protected Credentials
- CWE-798: Hard-coded Credentials
- CWE-306: Missing Authentication
- CWE-352: Cross-Site Request Forgery (CSRF)
- CWE-918: Server-Side Request Forgery (SSRF)
- CWE-502: Deserialization of Untrusted Data
- Insecure dependencies, exposed secrets, missing input validation

5. **CODE SMELLS & OPTIMIZATION**:
- Duplicate code / DRY violations
- Long functions or god classes
- Dead code or unused imports
- Missing error handling
- Performance bottlenecks (N+1 queries, memory leaks, etc.)
- Poor naming conventions
- Missing type safety

6. **ISSUES FOUND**: TODOs, incomplete functions, broken imports, failing tests.

7. **TEST COVERAGE GAPS**: Identify uncovered code paths and suggest specific unit tests:
- Functions without test coverage
- Edge cases not tested
- Integration tests needed
- Suggested test cases with descriptions

8. **COMPLETION TASKS** (10-20 tasks, prioritized):
- Features to complete
- Bugs to fix
- Security fixes (highest priority)
- Refactoring opportunities
- Tests to add
- Documentation needed

Be specific, actionable, and reference exact files/functions when possible.`;
};

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
          category: { type: 'string', enum: ['feature', 'bugfix', 'refactor', 'test', 'documentation', 'security'] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          estimated_effort: { type: 'string', enum: ['small', 'medium', 'large'] },
          files_affected: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
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
    if (CODE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext)) && content) {
      sampleCode += `\n--- ${path} ---\n${content.substring(0, MAX_CODE_CHARS)}\n`;
      codeCount++;
    }
  }

  return sampleCode;
};

const collectPrioritySnippets = (fileContents) => {
  let readmeSnippet = '';
  let packageSnippet = '';
  for (const [path, content] of Object.entries(fileContents)) {
    const lower = path.toLowerCase();
    if (!readmeSnippet && lower.endsWith('readme.md')) {
      readmeSnippet = content.substring(0, 4000);
    }
    if (!packageSnippet && lower.endsWith('package.json')) {
      packageSnippet = content.substring(0, 3000);
    }
    if (readmeSnippet && packageSnippet) break;
  }
  return { readmeSnippet, packageSnippet };
};

const buildFallbackPrompt = (projectData, limitedFileList, readmeSnippet, packageSnippet) => {
  const description = projectData.zip_file_url
    ? 'Analyze this uploaded codebase using only the provided high-signal files.'
    : `Analyze the repository at ${projectData.github_url} using the provided summary files.`;

  return `${description}

You previously rejected this request due to context limits. Now focus strictly on the following:

${limitedFileList ? `FILE OVERVIEW (truncated):\n${limitedFileList}\n` : ''}
${packageSnippet ? `PACKAGE.JSON SUMMARY:\n${packageSnippet}\n` : ''}
${readmeSnippet ? `README EXCERPT:\n${readmeSnippet}\n` : ''}

Provide the same structured analysis (summary, stack, architecture, vulnerabilities, smells, issues, tests, prioritized tasks). Be concise but specific and reference the limited data you received.`;
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
  const fileList = formatFileList(filePaths, MAX_FILE_LIST_ENTRIES) || 'No files extracted';
  const importantFiles = collectImportantFiles(fileContents);
  const sampleCode = collectSampleCode(fileContents);
  const limitedFileList = formatFileList(filePaths, Math.min(50, MAX_FILE_LIST_ENTRIES));
  const { readmeSnippet, packageSnippet } = collectPrioritySnippets(fileContents);

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

    console.log('📋 Creating tasks from analysis result. Tasks received:', analysisResult.tasks?.length || 0);
    if (analysisResult.tasks?.length) {
      analysisResult.tasks.forEach((task) => {
        console.log('✏️ Creating task:', task.title, '| Priority:', task.priority, '| Category:', task.category);
        taskStore.createTask({
          project_id: projectId,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          estimated_effort: task.estimated_effort,
          files_affected: task.files_affected,
          status: 'pending',
        });
      });
    } else {
      console.warn('⚠️ No tasks in analysis result');
    }

    return payload;
  };

  try {
    const analysisPrompt = buildAnalysisPrompt(projectData, fileList, importantFiles, sampleCode);

    console.log('🤖 Calling AI with context files:', fileList.split('\n').length);
    const analysisResult = await InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
    });

    console.log('✅ Analysis complete, updating project store');
    return persistAnalysis(analysisResult);
  } catch (error) {
    console.error('❌ Analysis failed:', error);

    if (isContextError(error.message)) {
      console.warn('⚠️ Context limit reached. Retrying with fallback prompt.');
      try {
        const fallbackPrompt = buildFallbackPrompt(
          projectData,
          limitedFileList,
          readmeSnippet,
          packageSnippet,
        );
        const fallbackResult = await InvokeLLM({
          prompt: fallbackPrompt,
          response_json_schema: responseSchema,
        });
        console.log('✅ Fallback analysis succeeded');
        return persistAnalysis(fallbackResult, { strategy: 'fallback' });
      } catch (fallbackError) {
        console.error('❌ Fallback analysis also failed:', fallbackError);
        projectStore.updateProject(projectId, {
          status: 'error',
          error_message: fallbackError.message,
        });
        throw fallbackError;
      }
    }

    projectStore.updateProject(projectId, {
      status: 'error',
      error_message: error.message,
    });
    throw error;
  }
}
