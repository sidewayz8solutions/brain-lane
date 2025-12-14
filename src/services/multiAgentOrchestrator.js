/**
 * Brain Lane — Multi-Agent Orchestration System v2
 * =================================================
 * AI-assisted engineering platform with specialized agents:
 *
 * 🏗️ Architect — System design & architecture analysis
 * 🔍 Gap Analyzer — Identifies missing components to reach goals
 * 📋 Task Planner — Converts backlog into executable plans
 * ⚙️ Implementer — Produces reviewable ChangeSets
 * 🧪 Test & QA — Proposes tests for validation
 * 🚀 DevOps — Deployment & infrastructure
 * 📊 Run Log Interpreter — Analyzes build/test logs
 *
 * Legacy agents (backwards compatibility):
 * 🔍 Code Auditor, 🔧 Syntax Fixer, ✨ Feature Completer, etc.
 */

import { aiEngine } from './aiEngine';
import { jobQueue, JOB_TYPES } from './jobQueue';
import {
  AgentType as NewAgentType,
  AGENT_DEFINITIONS as NEW_AGENT_DEFINITIONS,
  GLOBAL_SYSTEM_PROMPT,
  USER_PROMPTS,
  RESPONSE_SCHEMAS,
  buildUserPrompt,
  getAgentDefinition,
} from './agentPrompts';

// ============================================================================
// AGENT TYPES (Combined legacy + new)
// ============================================================================

// Re-export new agent types
export { NewAgentType as PrimaryAgentType };

// Legacy agent types (for backwards compatibility)
export const AgentType = {
  // New primary agents from spec
  ARCHITECT: 'architect',
  GAP_ANALYZER: 'gap_analyzer',
  TASK_PLANNER: 'task_planner',
  IMPLEMENTER: 'implementer',
  TEST_QA: 'test_qa',
  DEVOPS: 'devops',
  RUN_LOG_INTERPRETER: 'run_log_interpreter',
  // Legacy agents (preserved for backwards compatibility)
  CODE_AUDITOR: 'code_auditor',
  SYNTAX_FIXER: 'syntax_fixer',
  FEATURE_COMPLETER: 'feature_completer',
  UI_DESIGNER: 'ui_designer',
  DEPLOYMENT_ARCHITECT: 'deployment_architect',
  DOCUMENTATION_WRITER: 'documentation_writer',
  TEST_ENGINEER: 'test_engineer',
};

export const AgentStatus = {
  IDLE: 'idle',
  WORKING: 'working',
  COMPLETED: 'completed',
  FAILED: 'failed',
  WAITING: 'waiting',
};

// ============================================================================
// LEGACY AGENT DEFINITIONS (for backwards compatibility)
// ============================================================================

const LEGACY_AGENT_DEFINITIONS = {
  [AgentType.CODE_AUDITOR]: {
    name: 'Code Auditor',
    emoji: '🔍',
    description: 'Analyzes code for security vulnerabilities, performance issues, and best practice violations',
    capabilities: ['security_audit', 'performance_review', 'best_practices', 'dependency_check'],
    model: 'gpt-4o',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are an expert code auditor. Your job is to:
1. Identify security vulnerabilities (XSS, SQL injection, secrets exposure, etc.)
2. Find performance bottlenecks and inefficiencies
3. Check for best practice violations
4. Review dependency usage and suggest updates
5. Provide severity ratings and remediation steps

Always be specific about line numbers and provide actionable fixes.`,
  },

  [AgentType.SYNTAX_FIXER]: {
    name: 'Syntax Fixer',
    emoji: '🔧',
    description: 'Automatically repairs broken syntax, malformed code, and common errors',
    capabilities: ['syntax_repair', 'import_fix', 'bracket_matching', 'type_correction'],
    model: 'gpt-4o-mini',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a syntax repair specialist. Your job is to:
1. Fix malformed JavaScript/TypeScript/JSX syntax
2. Repair broken imports and exports
3. Fix bracket/parenthesis matching issues
4. Correct type errors and missing declarations
5. Fix JSON syntax errors

Output the complete fixed code, preserving the original intent.`,
  },

  [AgentType.FEATURE_COMPLETER]: {
    name: 'Feature Completer',
    emoji: '✨',
    description: 'Implements missing functionality, completes stub functions, and adds requested features',
    capabilities: ['implement_function', 'complete_stub', 'add_feature', 'integrate_api'],
    model: 'gpt-4o',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a feature implementation expert. Your job is to:
1. Complete stub functions with full implementations
2. Add missing CRUD operations
3. Implement API integrations
4. Add error handling and edge cases
5. Ensure type safety and proper validation

Generate production-ready code with proper error handling.`,
  },

  [AgentType.UI_DESIGNER]: {
    name: 'UI Designer',
    emoji: '🎨',
    description: 'Generates UI components, layouts, and styling using modern frameworks',
    capabilities: ['generate_component', 'create_layout', 'add_styling', 'accessibility'],
    model: 'gpt-4o',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a UI/UX implementation expert. Your job is to:
1. Generate React components with proper structure
2. Create responsive layouts using Tailwind CSS
3. Add animations with Framer Motion
4. Ensure accessibility (ARIA labels, keyboard nav)
5. Follow shadcn/ui component patterns

Generate beautiful, accessible, responsive components.`,
  },

  [AgentType.DEPLOYMENT_ARCHITECT]: {
    name: 'Deployment Architect',
    emoji: '🚀',
    description: 'Creates deployment configurations, CI/CD pipelines, and infrastructure code',
    capabilities: ['docker_config', 'ci_cd', 'cloud_deploy', 'env_setup'],
    model: 'gpt-4o',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a DevOps and deployment expert. Your job is to:
1. Generate Dockerfiles and docker-compose configs
2. Create CI/CD workflows (GitHub Actions, GitLab CI)
3. Set up cloud deployment (Vercel, AWS, GCP)
4. Configure environment variables and secrets
5. Optimize build and deployment processes

Generate production-ready deployment configurations.`,
  },

  [AgentType.DOCUMENTATION_WRITER]: {
    name: 'Documentation Writer',
    emoji: '📝',
    description: 'Generates documentation, README files, API docs, and code comments',
    capabilities: ['readme', 'api_docs', 'jsdoc', 'changelog'],
    model: 'gpt-4o-mini',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a technical documentation expert. Your job is to:
1. Write comprehensive README files
2. Generate API documentation with examples
3. Add JSDoc/TSDoc comments to functions
4. Create user guides and tutorials
5. Maintain changelogs

Write clear, concise, helpful documentation.`,
  },

  [AgentType.TEST_ENGINEER]: {
    name: 'Test Engineer',
    emoji: '🧪',
    description: 'Creates unit tests, integration tests, and test scenarios',
    capabilities: ['unit_tests', 'integration_tests', 'e2e_tests', 'test_coverage'],
    model: 'gpt-4o',
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are a test engineering expert. Your job is to:
1. Write comprehensive unit tests
2. Create integration tests for APIs
3. Generate E2E test scenarios
4. Ensure edge cases are covered
5. Follow testing best practices (AAA pattern, mocking)

Generate thorough, maintainable test suites.`,
  },
};

// Merge new and legacy definitions
const AGENT_DEFINITIONS = {
  ...NEW_AGENT_DEFINITIONS,
  ...LEGACY_AGENT_DEFINITIONS,
};

// ============================================================================
// AGENT CLASS (Enhanced with new prompt system)
// ============================================================================

class Agent {
  constructor(type) {
    this.type = type;
    this.definition = AGENT_DEFINITIONS[type];
    this.status = AgentStatus.IDLE;
    this.currentTask = null;
    this.history = [];
    this.stats = {
      tasksCompleted: 0,
      totalTokens: 0,
      avgResponseTime: 0,
    };
  }

  /**
   * Execute agent with structured context (new API)
   * @param {Object} context - Structured context for the agent
   */
  async executeWithContext(context) {
    this.status = AgentStatus.WORKING;
    this.currentTask = context;
    const startTime = Date.now();

    try {
      // Use new prompt builder if available
      let prompt;
      if (USER_PROMPTS[this.type]) {
        prompt = buildUserPrompt(this.type, context);
      } else {
        prompt = this._buildPrompt(context);
      }

      const response = await aiEngine.invoke({
        prompt,
        systemPrompt: this.definition.systemPrompt,
        type: 'agent',
        model: this.definition.model,
        temperature: this.definition.temperature || 0.3,
        maxTokens: this.definition.maxTokens || 4000,
        responseSchema: RESPONSE_SCHEMAS[this.type],
      });

      const elapsed = Date.now() - startTime;
      this.stats.tasksCompleted++;
      this.stats.totalTokens += response.tokensUsed || 0;
      this.stats.avgResponseTime =
        (this.stats.avgResponseTime * (this.stats.tasksCompleted - 1) + elapsed) / this.stats.tasksCompleted;

      const result = this._parseResponse(response.text || response, context);

      this.history.push({
        context,
        result,
        timestamp: new Date().toISOString(),
        elapsed,
        tokensUsed: response.tokensUsed || 0,
      });

      this.status = AgentStatus.COMPLETED;
      this.currentTask = null;

      return result;
    } catch (error) {
      this.status = AgentStatus.FAILED;
      this.currentTask = null;
      throw error;
    }
  }

  /**
   * Legacy execute method (backwards compatible)
   */
  async execute(task) {
    this.status = AgentStatus.WORKING;
    this.currentTask = task;
    const startTime = Date.now();

    try {
      const response = await aiEngine.invoke({
        prompt: this._buildPrompt(task),
        systemPrompt: this.definition.systemPrompt,
        type: 'agent',
        model: this.definition.model,
        temperature: this.definition.temperature || 0.3,
      });

      const elapsed = Date.now() - startTime;
      this.stats.tasksCompleted++;
      this.stats.totalTokens += response.tokensUsed || 0;
      this.stats.avgResponseTime =
        (this.stats.avgResponseTime * (this.stats.tasksCompleted - 1) + elapsed) / this.stats.tasksCompleted;

      const result = this._parseResponse(response.text, task);

      this.history.push({
        task,
        result,
        timestamp: new Date().toISOString(),
        elapsed,
      });

      this.status = AgentStatus.COMPLETED;
      this.currentTask = null;

      return result;
    } catch (error) {
      this.status = AgentStatus.FAILED;
      this.currentTask = null;
      throw error;
    }
  }

  _buildPrompt(task) {
    return `Task: ${task.description || task.goal || 'Analyze and process'}

Context:
${task.context || task.indexSummary || 'No additional context provided.'}

Files:
${task.files?.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n') || 'No files provided.'}

Requirements:
${task.requirements?.join('\n') || '- Complete the task as described'}

Please provide your analysis and/or code changes.`;
  }

  _parseResponse(text, task) {
    // Handle both string and object responses
    if (typeof text === 'object') {
      return {
        success: true,
        agent: this.type,
        agentName: this.definition.name,
        emoji: this.definition.emoji,
        structured: text,
        raw: JSON.stringify(text, null, 2),
      };
    }

    // Try to extract code blocks and analysis
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    // Extract unified diffs
    const diffs = [];
    const diffRegex = /```diff\n([\s\S]*?)```/g;
    while ((match = diffRegex.exec(text)) !== null) {
      diffs.push(match[1].trim());
    }

    // Extract file changes if formatted
    const fileChanges = [];
    const fileRegex = /(?:File|Create|Update|Modify):\s*`?([^`\n]+)`?\n```(?:\w+)?\n([\s\S]*?)```/g;
    while ((match = fileRegex.exec(text)) !== null) {
      fileChanges.push({
        path: match[1].trim(),
        content: match[2].trim(),
      });
    }

    return {
      success: true,
      agent: this.type,
      agentName: this.definition.name,
      emoji: this.definition.emoji,
      analysis: text.replace(codeBlockRegex, '').trim(),
      codeBlocks,
      diffs,
      fileChanges,
      raw: text,
    };
  }

  getStatus() {
    return {
      type: this.type,
      ...this.definition,
      status: this.status,
      currentTask: this.currentTask,
      stats: this.stats,
    };
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

// ============================================================================
// MULTI-AGENT ORCHESTRATOR
// ============================================================================

class MultiAgentOrchestrator {
  constructor() {
    this.agents = {};
    this.taskQueue = [];
    this.executionHistory = [];
    this.isRunning = false;

    // Initialize all agents
    for (const type of Object.values(AgentType)) {
      this.agents[type] = new Agent(type);
    }
  }

  /**
   * Get all available agents
   */
  getAgents() {
    return Object.values(this.agents).map(agent => agent.getStatus());
  }

  /**
   * Get specific agent
   */
  getAgent(type) {
    return this.agents[type]?.getStatus();
  }

  /**
   * Execute a single agent on a task
   */
  async executeAgent(agentType, task) {
    const agent = this.agents[agentType];
    if (!agent) throw new Error(`Unknown agent type: ${agentType}`);

    return await agent.execute(task);
  }

  /**
   * Run multiple agents in sequence on a project
   */
  async runPipeline(files, options = {}) {
    const {
      agents = [AgentType.CODE_AUDITOR, AgentType.SYNTAX_FIXER],
      stopOnError = false,
      onProgress = () => {},
    } = options;

    this.isRunning = true;
    const results = [];
    let currentFiles = [...files];

    for (let i = 0; i < agents.length; i++) {
      const agentType = agents[i];
      const agent = this.agents[agentType];

      onProgress({
        step: i + 1,
        total: agents.length,
        agent: agentType,
        status: 'running',
      });

      try {
        const result = await agent.execute({
          description: `Analyze and process project files`,
          files: currentFiles,
          context: `Previous agent results: ${results.length > 0 ? JSON.stringify(results.map(r => r.analysis).slice(-2)) : 'None'}`,
        });

        results.push(result);

        // Apply file changes from this agent
        if (result.fileChanges?.length > 0) {
          for (const change of result.fileChanges) {
            const existingIdx = currentFiles.findIndex(f => f.path === change.path);
            if (existingIdx >= 0) {
              currentFiles[existingIdx] = { ...currentFiles[existingIdx], content: change.content };
            } else {
              currentFiles.push({ path: change.path, content: change.content, name: change.path.split('/').pop() });
            }
          }
        }

        onProgress({
          step: i + 1,
          total: agents.length,
          agent: agentType,
          status: 'completed',
          result,
        });
      } catch (error) {
        results.push({
          success: false,
          agent: agentType,
          error: error.message,
        });

        onProgress({
          step: i + 1,
          total: agents.length,
          agent: agentType,
          status: 'failed',
          error: error.message,
        });

        if (stopOnError) break;
      }
    }

    this.isRunning = false;

    const execution = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      agents: agents,
      results,
      finalFiles: currentFiles,
      success: results.every(r => r.success),
    };

    this.executionHistory.push(execution);

    return execution;
  }

  /**
   * Run agents in parallel on independent tasks
   */
  async runParallel(tasks) {
    const promises = tasks.map(({ agentType, task }) => 
      this.executeAgent(agentType, task)
    );

    return await Promise.allSettled(promises);
  }

  /**
   * Smart routing — let AI decide which agents to use
   */
  async smartRoute(files, goal) {
    const prompt = `Given this project goal and files, determine which agents should be used and in what order.

Goal: ${goal}

File types present: ${[...new Set(files.map(f => f.name.split('.').pop()))].join(', ')}
Number of files: ${files.length}

Available agents:
${Object.entries(AGENT_DEFINITIONS).map(([type, def]) => 
  `- ${type}: ${def.description}`
).join('\n')}

Respond with a JSON array of agent types to use in order, e.g.:
["code_auditor", "syntax_fixer", "feature_completer"]`;

    const response = await aiEngine.invoke({
      prompt,
      type: 'analysis',
      model: 'gpt-4o-mini',
    });

    try {
      const agentSequence = JSON.parse(response.text.match(/\[[\s\S]*\]/)?.[0] || '[]');
      return agentSequence.filter(a => Object.values(AgentType).includes(a));
    } catch {
      // Default sequence
      return [AgentType.CODE_AUDITOR, AgentType.SYNTAX_FIXER];
    }
  }

  /**
   * Get execution history
   */
  getHistory() {
    return this.executionHistory;
  }

  /**
   * Get orchestrator stats
   */
  getStats() {
    return {
      totalExecutions: this.executionHistory.length,
      successRate: this.executionHistory.filter(e => e.success).length / (this.executionHistory.length || 1),
      agentStats: Object.fromEntries(
        Object.entries(this.agents).map(([type, agent]) => [type, agent.stats])
      ),
      isRunning: this.isRunning,
    };
  }

  // ==========================================================================
  // NEW SPEC-ALIGNED WORKFLOWS
  // ==========================================================================

  /**
   * Run the full Brain Lane analysis workflow
   * Architect → Gap Analyzer → Task Planner
   */
  async runAnalysisWorkflow(projectIndex, goal, options = {}) {
    const { onProgress = () => {} } = options;
    const results = {};

    try {
      // Step 1: Architect Agent
      onProgress({ step: 1, total: 3, agent: 'architect', status: 'running' });
      const architectResult = await this.agents[AgentType.ARCHITECT].executeWithContext({
        stackSummary: this._formatStackSummary(projectIndex),
        entrypoints: projectIndex.entry_points || [],
        depsHighlights: this._formatDependencies(projectIndex.dependencies),
        userDescription: goal.description,
        keyFilesExcerpts: projectIndex.module_summaries?.slice(0, 5) || [],
        constraints: goal.constraints,
      });
      results.architect = architectResult;
      onProgress({ step: 1, total: 3, agent: 'architect', status: 'completed', result: architectResult });

      // Step 2: Gap Analyzer
      onProgress({ step: 2, total: 3, agent: 'gap_analyzer', status: 'running' });
      const gapResult = await this.agents[AgentType.GAP_ANALYZER].executeWithContext({
        goal: goal.title,
        indexSummary: results.architect?.analysis || this._formatIndexSummary(projectIndex),
        todoHotspots: projectIndex.todo_fixme_locations || [],
        configSignals: this._detectMissingConfigs(projectIndex),
        runLogsExcerpt: options.runLogs || null,
      });
      results.gapAnalyzer = gapResult;
      onProgress({ step: 2, total: 3, agent: 'gap_analyzer', status: 'completed', result: gapResult });

      // Step 3: Task Planner
      onProgress({ step: 3, total: 3, agent: 'task_planner', status: 'running' });
      const planResult = await this.agents[AgentType.TASK_PLANNER].executeWithContext({
        backlog: gapResult?.structured?.backlog || gapResult?.analysis,
        constraints: goal.constraints,
        strategy: goal.risk_tolerance || 'balanced',
      });
      results.taskPlanner = planResult;
      onProgress({ step: 3, total: 3, agent: 'task_planner', status: 'completed', result: planResult });

      return {
        success: true,
        results,
        plan: planResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        results,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run implementation workflow for a single task
   * Implementer → Test/QA
   */
  async runImplementationWorkflow(task, fileExcerpts, options = {}) {
    const { onProgress = () => {}, skipTests = false } = options;
    const results = {};

    try {
      // Step 1: Implementer
      onProgress({ step: 1, total: skipTests ? 1 : 2, agent: 'implementer', status: 'running' });
      const implementResult = await this.agents[AgentType.IMPLEMENTER].executeWithContext({
        task,
        fileExcerpts,
        constraints: options.constraints,
        codingStandards: options.codingStandards,
      });
      results.implementer = implementResult;
      onProgress({ step: 1, total: skipTests ? 1 : 2, agent: 'implementer', status: 'completed', result: implementResult });

      // Step 2: Test/QA (optional)
      if (!skipTests) {
        onProgress({ step: 2, total: 2, agent: 'test_qa', status: 'running' });
        const testResult = await this.agents[AgentType.TEST_QA].executeWithContext({
          stackSummary: options.stackSummary || 'Unknown',
          testsSummary: options.existingTests || 'None',
          changedAreas: implementResult?.fileChanges?.map(f => f.path) || [],
          goal: task.objective || task.title,
        });
        results.testQa = testResult;
        onProgress({ step: 2, total: 2, agent: 'test_qa', status: 'completed', result: testResult });
      }

      return {
        success: true,
        results,
        changeset: implementResult?.fileChanges || [],
        diffs: implementResult?.diffs || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        results,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run deployment preparation workflow
   */
  async runDeploymentWorkflow(projectIndex, targetPlatform, options = {}) {
    const { onProgress = () => {} } = options;

    onProgress({ step: 1, total: 1, agent: 'devops', status: 'running' });
    const result = await this.agents[AgentType.DEVOPS].executeWithContext({
      targetPlatform,
      configSignals: this._detectConfigPresence(projectIndex),
      entrypoints: projectIndex.entry_points?.map(e => e.path || e) || [],
      envKeysDetected: this._extractEnvKeys(projectIndex),
    });
    onProgress({ step: 1, total: 1, agent: 'devops', status: 'completed', result });

    return {
      success: true,
      result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze run logs and propose fixes
   */
  async analyzeRunLogs(command, exitCode, logExcerpt, indexSummary) {
    return await this.agents[AgentType.RUN_LOG_INTERPRETER].executeWithContext({
      command,
      exitCode,
      logExcerpt,
      indexSummary,
    });
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  _formatStackSummary(index) {
    if (!index) return 'Unknown stack';
    const parts = [];
    if (index.languages) {
      const langs = Object.keys(index.languages);
      if (langs.length > 0) parts.push(`Languages: ${langs.join(', ')}`);
    }
    if (index.frameworks?.length > 0) {
      parts.push(`Frameworks: ${index.frameworks.map(f => f.name || f).join(', ')}`);
    }
    if (index.package_managers?.length > 0) {
      parts.push(`Package managers: ${index.package_managers.map(p => p.type || p).join(', ')}`);
    }
    return parts.join('\n') || 'Unknown stack';
  }

  _formatDependencies(deps) {
    if (!deps) return 'No dependency info';
    const parts = [];
    if (deps.external?.length > 0) {
      parts.push(`External: ${deps.external.slice(0, 10).join(', ')}${deps.external.length > 10 ? '...' : ''}`);
    }
    if (deps.missing?.length > 0) {
      parts.push(`Missing: ${deps.missing.join(', ')}`);
    }
    return parts.join('\n') || 'No dependency info';
  }

  _formatIndexSummary(index) {
    if (!index) return 'No index available';
    return `Files: ${index.file_tree?.length || 0}, TODOs: ${index.todo_fixme_count || 0}, Test coverage: ${index.test_coverage_estimate || 0}%`;
  }

  _detectMissingConfigs(index) {
    const signals = [];
    const configFiles = (index.config_files || []).map(c => c.path || c);
    if (!configFiles.some(f => f.includes('docker'))) signals.push('No Docker config');
    if (!configFiles.some(f => f.includes('.env'))) signals.push('No .env template');
    if (!configFiles.some(f => f.includes('ci') || f.includes('workflow'))) signals.push('No CI/CD config');
    return signals;
  }

  _detectConfigPresence(index) {
    const configs = (index.config_files || []).map(c => c.path || c);
    return configs.length > 0 ? configs : ['No config files detected'];
  }

  _extractEnvKeys(index) {
    // Extract from config_files if available
    const envConfig = (index.config_files || []).find(c => (c.path || c).includes('.env'));
    if (envConfig?.parsed_data) {
      return Object.keys(envConfig.parsed_data);
    }
    return [];
  }
}

// ============================================================================
// PRESET PIPELINES (Updated with new agents)
// ============================================================================

export const PRESET_PIPELINES = {
  // New spec-aligned pipelines
  analyze: {
    name: 'Analyze & Plan',
    description: 'Understand project, identify gaps, create execution plan',
    agents: [AgentType.ARCHITECT, AgentType.GAP_ANALYZER, AgentType.TASK_PLANNER],
    icon: '🏗️',
    workflow: 'analysis',
  },
  implement: {
    name: 'Implement & Test',
    description: 'Generate code changes with tests',
    agents: [AgentType.IMPLEMENTER, AgentType.TEST_QA],
    icon: '⚙️',
    workflow: 'implementation',
  },
  deploy: {
    name: 'Prepare Deployment',
    description: 'Generate deployment configs and instructions',
    agents: [AgentType.DEVOPS],
    icon: '🚀',
    workflow: 'deployment',
  },
  // Legacy pipelines (backwards compatible)
  fullAudit: {
    name: 'Full Audit',
    description: 'Security audit, code review, and documentation',
    agents: [AgentType.CODE_AUDITOR, AgentType.DOCUMENTATION_WRITER],
    icon: '🔍',
  },
  autoFix: {
    name: 'Auto-Fix',
    description: 'Fix syntax errors and implement missing features',
    agents: [AgentType.SYNTAX_FIXER, AgentType.FEATURE_COMPLETER],
    icon: '🔧',
  },
  uiRefresh: {
    name: 'UI Refresh',
    description: 'Update UI components and add modern styling',
    agents: [AgentType.UI_DESIGNER, AgentType.DOCUMENTATION_WRITER],
    icon: '🎨',
  },
  deployReady: {
    name: 'Deploy Ready',
    description: 'Prepare for deployment with tests and configs',
    agents: [AgentType.TEST_ENGINEER, AgentType.DEPLOYMENT_ARCHITECT],
    icon: '🚀',
  },
  complete: {
    name: 'Complete Pipeline',
    description: 'Run all agents for comprehensive analysis',
    agents: Object.values(AgentType),
    icon: '⚡',
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const orchestrator = new MultiAgentOrchestrator();
export {
  Agent,
  AGENT_DEFINITIONS,
  GLOBAL_SYSTEM_PROMPT,
  USER_PROMPTS,
  RESPONSE_SCHEMAS,
  buildUserPrompt,
  getAgentDefinition,
};
export default orchestrator;
