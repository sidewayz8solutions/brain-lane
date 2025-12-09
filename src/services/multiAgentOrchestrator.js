/**
 * Brain Lane — Multi-Agent Orchestration System
 * ==============================================
 * Specialized AI agents that collaborate on complex tasks:
 * 
 * 🔍 Code Auditor — Security, performance, best practices
 * 🔧 Syntax Fixer — Auto-repair broken code
 * ✨ Feature Completer — Implement missing functionality
 * 🎨 UI Designer — Generate UI components and styling
 * 🚀 Deployment Architect — Infrastructure and DevOps
 * 📝 Documentation Writer — Generate docs and comments
 */

import { aiEngine } from './aiEngine';
import { jobQueue, JOB_TYPES } from './jobQueue';

// ============================================================================
// AGENT DEFINITIONS
// ============================================================================

export const AgentType = {
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

const AGENT_DEFINITIONS = {
  [AgentType.CODE_AUDITOR]: {
    name: 'Code Auditor',
    emoji: '🔍',
    description: 'Analyzes code for security vulnerabilities, performance issues, and best practice violations',
    capabilities: ['security_audit', 'performance_review', 'best_practices', 'dependency_check'],
    model: 'gpt-4o',
    systemPrompt: `You are an expert code auditor. Your job is to:
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
    systemPrompt: `You are a syntax repair specialist. Your job is to:
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
    systemPrompt: `You are a feature implementation expert. Your job is to:
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
    systemPrompt: `You are a UI/UX implementation expert. Your job is to:
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
    systemPrompt: `You are a DevOps and deployment expert. Your job is to:
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
    systemPrompt: `You are a technical documentation expert. Your job is to:
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
    systemPrompt: `You are a test engineering expert. Your job is to:
1. Write comprehensive unit tests
2. Create integration tests for APIs
3. Generate E2E test scenarios
4. Ensure edge cases are covered
5. Follow testing best practices (AAA pattern, mocking)

Generate thorough, maintainable test suites.`,
  },
};

// ============================================================================
// AGENT CLASS
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
        temperature: 0.3,
      });

      const elapsed = Date.now() - startTime;
      this.stats.tasksCompleted++;
      this.stats.totalTokens += response.tokensUsed || 0;
      this.stats.avgResponseTime = (this.stats.avgResponseTime * (this.stats.tasksCompleted - 1) + elapsed) / this.stats.tasksCompleted;

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
    return `Task: ${task.description}

Context:
${task.context || 'No additional context provided.'}

Files:
${task.files?.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n') || 'No files provided.'}

Requirements:
${task.requirements?.join('\n') || '- Complete the task as described'}

Please provide your analysis and/or code changes.`;
  }

  _parseResponse(text, task) {
    // Try to extract code blocks and analysis
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1].trim());
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
      analysis: text.replace(codeBlockRegex, '').trim(),
      codeBlocks,
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
}

// ============================================================================
// PRESET PIPELINES
// ============================================================================

export const PRESET_PIPELINES = {
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
export { Agent, AGENT_DEFINITIONS };
export default orchestrator;
