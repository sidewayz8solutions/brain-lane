import { useProjectStore, useTaskStore } from '@/store/projectStore';
import { InvokeLLM } from '@/services/aiService';

const IMPORTANT_PATHS = ['package.json', 'requirements.txt', 'README.md', 'setup.py', 'pyproject.toml'];
const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py'];

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
  for (const path of Object.keys(fileContents)) {
    if (IMPORTANT_PATHS.some((p) => path.endsWith(p))) {
      importantFiles += `\n--- ${path} ---\n${fileContents[path]?.substring(0, 3000)}\n`;
    }
  }
  return importantFiles;
};

const collectSampleCode = (fileContents) => {
  let sampleCode = '';
  let codeCount = 0;

  for (const [path, content] of Object.entries(fileContents)) {
    if (codeCount >= 5) break;
    if (CODE_EXTENSIONS.some((ext) => path.endsWith(ext)) && content && content.length < 5000) {
      sampleCode += `\n--- ${path} ---\n${content.substring(0, 2000)}\n`;
      codeCount++;
    }
  }

  return sampleCode;
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
  const fileCount = Object.keys(fileContents).length;

  if (fileCount === 0) {
    throw new Error('No files were extracted for this project. Please re-upload the ZIP.');
  }

  console.log('🔍 Starting analysis with', fileCount, 'files');
  const fileList = Object.keys(fileContents).join('\n') || 'No files extracted';
  const importantFiles = collectImportantFiles(fileContents);
  const sampleCode = collectSampleCode(fileContents);

  try {
    const analysisPrompt = buildAnalysisPrompt(projectData, fileList, importantFiles, sampleCode);

    console.log('🤖 Calling AI with context files:', fileList.split('\n').length);
    const analysisResult = await InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: responseSchema,
    });

    const fileTree = Object.keys(fileContents).map((path) => ({
      path,
      type: 'file',
      size: fileContents[path]?.length || 0,
    }));

    console.log('✅ Analysis complete, updating project store');
    projectStore.updateProject(projectId, {
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
    });

    if (analysisResult.tasks?.length) {
      analysisResult.tasks.forEach((task) => {
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
    }

    return {
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
    };
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    projectStore.updateProject(projectId, {
      status: 'error',
      error_message: error.message,
    });
    throw error;
  }
}
