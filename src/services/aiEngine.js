/**
 * Brain Lane — Centralized AI Engine
 * ===================================
 * A modular AI pipeline supporting multiple models with:
 * - Multi-provider support (OpenAI GPT-4.1, Anthropic Claude, Local LoRAs)
 * - Structured prompt templates
 * - Error catching & exponential backoff retry logic
 * - Request queuing and rate limiting
 * - Model routing based on task type
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  LOCAL: 'local',
};

const AI_MODELS = {
  // OpenAI Models
  GPT_4_1: { provider: AI_PROVIDERS.OPENAI, id: 'gpt-4.1', maxTokens: 128000 },
  GPT_4O: { provider: AI_PROVIDERS.OPENAI, id: 'gpt-4o', maxTokens: 128000 },
  GPT_4O_MINI: { provider: AI_PROVIDERS.OPENAI, id: 'gpt-4o-mini', maxTokens: 128000 },
  
  // Anthropic Models
  CLAUDE_3_7_SONNET: { provider: AI_PROVIDERS.ANTHROPIC, id: 'claude-3-7-sonnet-20250219', maxTokens: 200000 },
  CLAUDE_3_5_SONNET: { provider: AI_PROVIDERS.ANTHROPIC, id: 'claude-3-5-sonnet-20241022', maxTokens: 200000 },
  CLAUDE_3_HAIKU: { provider: AI_PROVIDERS.ANTHROPIC, id: 'claude-3-haiku-20240307', maxTokens: 200000 },
  
  // Local/Custom Models (future)
  LOCAL_LORA: { provider: AI_PROVIDERS.LOCAL, id: 'local-lora', maxTokens: 8000 },
};

// Default model selection per task type
const MODEL_ROUTING = {
  analysis: AI_MODELS.GPT_4O,
  taskGeneration: AI_MODELS.GPT_4O,
  codeReview: AI_MODELS.CLAUDE_3_5_SONNET,
  refactoring: AI_MODELS.GPT_4O,
  documentation: AI_MODELS.GPT_4O_MINI,
  chat: AI_MODELS.GPT_4O_MINI,
  default: AI_MODELS.GPT_4O,
};

// Load API keys from environment
const getConfig = () => ({
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || null,
    baseUrl: 'https://api.openai.com/v1',
    proxyUrl: '/api/openai',
  },
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || null,
    baseUrl: 'https://api.anthropic.com/v1',
    proxyUrl: '/api/anthropic',
  },
  local: {
    baseUrl: import.meta.env.VITE_LOCAL_LLM_URL || 'http://localhost:11434',
  },
  demoMode: !import.meta.env.VITE_OPENAI_API_KEY && !import.meta.env.VITE_ANTHROPIC_API_KEY,
});

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES = {
  // System prompts for different task types
  system: {
    analysis: `You are a senior software architect with 15+ years of experience. 
Analyze code thoroughly and provide actionable insights.
Always respond with valid JSON matching the requested schema exactly.
Be specific about files, line numbers, and issues found.
Do not use placeholder or example data - analyze the actual code provided.`,

    taskGeneration: `You are a technical project manager and senior engineer.
Generate concrete, actionable tasks based on the analysis provided.
Each task should be specific, measurable, and have clear acceptance criteria.
Prioritize tasks by impact and effort.
Always respond with valid JSON.`,

    codeReview: `You are a meticulous code reviewer focused on:
- Code quality and maintainability
- Security vulnerabilities
- Performance optimizations
- Best practices and patterns
Provide specific, constructive feedback with code examples when helpful.`,

    refactoring: `You are an expert in code refactoring and design patterns.
Suggest refactoring strategies that improve code quality without changing behavior.
Consider SOLID principles, DRY, and clean code practices.
Provide before/after code examples.`,

    documentation: `You are a technical writer who creates clear, concise documentation.
Write documentation that is helpful for both new and experienced developers.
Include code examples and usage patterns.`,
  },

  // User prompt builders
  build: {
    analysis: (files, projectContext) => `
Analyze the following codebase and provide a comprehensive review.

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

FILES TO ANALYZE:
${files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}

Provide analysis covering:
1. Architecture and patterns
2. Security vulnerabilities
3. Code smells and issues
4. Test coverage gaps
5. Performance concerns
6. Actionable improvement tasks
`,

    taskGeneration: (analysis) => `
Based on the following project analysis, generate a comprehensive task plan.

ANALYSIS:
${JSON.stringify(analysis, null, 2)}

REQUIREMENTS:
- Generate AT LEAST 15 specific, actionable tasks
- Include a mix of: features, bugfixes, refactoring, tests, documentation, security, infra
- Prioritize by impact (critical > high > medium > low)
- Estimate effort (small: <2hrs, medium: 2-8hrs, large: >8hrs)
- List affected files for each task
`,

    codeReview: (code, context) => `
Review the following code changes:

CONTEXT:
${context || 'General code review'}

CODE:
${code}

Provide feedback on:
1. Correctness and logic
2. Security concerns
3. Performance implications
4. Code style and readability
5. Suggested improvements
`,

    refactoring: (code, goals) => `
Refactor the following code with these goals:
${goals.join('\n- ')}

CURRENT CODE:
${code}

Provide:
1. Refactored code
2. Explanation of changes
3. Benefits of the refactoring
4. Any trade-offs or considerations
`,
  },
};

// ============================================================================
// RESPONSE SCHEMAS (for structured output)
// ============================================================================

export const RESPONSE_SCHEMAS = {
  analysis: {
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
          components: { type: 'array' },
          external_dependencies: { type: 'array', items: { type: 'string' } },
          data_flow: { type: 'string' },
        },
      },
      security_vulnerabilities: { type: 'array' },
      code_smells: { type: 'array' },
      test_suggestions: { type: 'array' },
      issues: { type: 'array' },
      tasks: { type: 'array' },
    },
  },

  tasks: {
    type: 'object',
    properties: {
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
            acceptance_criteria: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'description', 'priority', 'estimated_effort'],
        },
      },
    },
  },

  codeReview: {
    type: 'object',
    properties: {
      overall_assessment: { type: 'string' },
      score: { type: 'number', minimum: 0, maximum: 100 },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
            category: { type: 'string' },
            message: { type: 'string' },
            line: { type: 'number' },
            suggestion: { type: 'string' },
          },
        },
      },
      suggestions: { type: 'array', items: { type: 'string' } },
    },
  },
};

// ============================================================================
// RETRY & ERROR HANDLING
// ============================================================================

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  timeoutMs: 120000, // 2 minutes for long analyses
};

const TRANSIENT_ERRORS = [
  'Failed to fetch',
  'NetworkError',
  'ERR_NETWORK_CHANGED',
  'ECONNRESET',
  'ETIMEDOUT',
  'AbortError',
  'rate_limit',
  'overloaded',
  '529', // Anthropic overloaded
];

const isTransientError = (error) => {
  const message = error?.message || String(error);
  return TRANSIENT_ERRORS.some(t => message.toLowerCase().includes(t.toLowerCase()));
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const exponentialBackoff = (attempt, baseDelay = RETRY_CONFIG.baseDelayMs) => {
  const delay = Math.min(baseDelay * Math.pow(2, attempt), RETRY_CONFIG.maxDelayMs);
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
};

/**
 * Resilient fetch with timeout and exponential backoff
 */
const resilientFetch = async (url, options = {}, config = {}) => {
  const {
    retries = RETRY_CONFIG.maxRetries,
    baseDelayMs = RETRY_CONFIG.baseDelayMs,
    timeoutMs = RETRY_CONFIG.timeoutMs,
    onRetry = null,
  } = config;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('📡 Offline detected, waiting...');
      await sleep(baseDelayMs * (attempt + 1));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : exponentialBackoff(attempt);
        console.warn(`⏳ Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      const shouldRetry = attempt < retries && isTransientError(error);
      console.warn(`⚠️ Attempt ${attempt + 1}/${retries + 1} failed: ${error.message}`);

      if (shouldRetry) {
        const delay = exponentialBackoff(attempt, baseDelayMs);
        onRetry?.(attempt + 1, delay, error);
        console.log(`🔄 Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
};

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

/**
 * OpenAI API caller
 */
const callOpenAI = async (model, messages, options = {}) => {
  const config = getConfig();
  
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key not configured. Set VITE_OPENAI_API_KEY in your .env file.');
  }

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const url = isLocalhost 
    ? `${config.openai.baseUrl}/chat/completions`
    : config.openai.proxyUrl;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (isLocalhost) {
    headers['Authorization'] = `Bearer ${config.openai.apiKey}`;
  }

  const requestBody = {
    model: model.id,
    messages,
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.3,
    ...(options.responseFormat && { response_format: options.responseFormat }),
  };

  const response = await resilientFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  }, {
    timeoutMs: options.timeoutMs || RETRY_CONFIG.timeoutMs,
    onRetry: options.onRetry,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content,
    usage: data.usage,
    finishReason: data.choices[0]?.finish_reason,
  };
};

/**
 * Anthropic API caller
 */
const callAnthropic = async (model, messages, options = {}) => {
  const config = getConfig();
  
  if (!config.anthropic.apiKey) {
    throw new Error('Anthropic API key not configured. Set VITE_ANTHROPIC_API_KEY in your .env file.');
  }

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const url = isLocalhost 
    ? `${config.anthropic.baseUrl}/messages`
    : config.anthropic.proxyUrl;

  // Extract system message and convert to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const userMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };

  if (isLocalhost) {
    headers['x-api-key'] = config.anthropic.apiKey;
  }

  const requestBody = {
    model: model.id,
    max_tokens: options.maxTokens || 4096,
    system: systemMessage,
    messages: userMessages,
  };

  const response = await resilientFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  }, {
    timeoutMs: options.timeoutMs || RETRY_CONFIG.timeoutMs,
    onRetry: options.onRetry,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API Error: ${error.error?.message || response.status}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text,
    usage: { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens },
    finishReason: data.stop_reason,
  };
};

/**
 * Local LLM caller (Ollama, LM Studio, etc.)
 */
const callLocal = async (model, messages, options = {}) => {
  const config = getConfig();
  
  const response = await resilientFetch(`${config.local.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.id,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM Error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.message?.content,
    usage: null,
    finishReason: 'stop',
  };
};

// Provider dispatcher
const PROVIDER_CALLERS = {
  [AI_PROVIDERS.OPENAI]: callOpenAI,
  [AI_PROVIDERS.ANTHROPIC]: callAnthropic,
  [AI_PROVIDERS.LOCAL]: callLocal,
};

// ============================================================================
// MAIN AI ENGINE CLASS
// ============================================================================

class AIEngine {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
    };
  }

  /**
   * Get the appropriate model for a task type
   */
  getModelForTask(taskType) {
    return MODEL_ROUTING[taskType] || MODEL_ROUTING.default;
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider) {
    const config = getConfig();
    switch (provider) {
      case AI_PROVIDERS.OPENAI:
        return !!config.openai.apiKey;
      case AI_PROVIDERS.ANTHROPIC:
        return !!config.anthropic.apiKey;
      case AI_PROVIDERS.LOCAL:
        return !!config.local.baseUrl;
      default:
        return false;
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Object.values(AI_PROVIDERS).filter(p => this.isProviderAvailable(p));
  }

  /**
   * Core invoke method with full options
   */
  async invoke({
    prompt,
    systemPrompt = null,
    model = null,
    taskType = 'default',
    responseSchema = null,
    temperature = 0.3,
    maxTokens = 4096,
    timeoutMs = RETRY_CONFIG.timeoutMs,
    onRetry = null,
  }) {
    const config = getConfig();
    this.stats.totalRequests++;

    // Select model
    const selectedModel = model || this.getModelForTask(taskType);
    
    // Check if demo mode
    if (config.demoMode) {
      console.log('⚠️ AI Engine running in DEMO mode');
      await sleep(1000 + Math.random() * 1500);
      return this._getMockResponse(prompt, taskType);
    }

    // Build messages
    const messages = [
      { 
        role: 'system', 
        content: systemPrompt || PROMPT_TEMPLATES.system[taskType] || PROMPT_TEMPLATES.system.analysis 
      },
      { role: 'user', content: prompt },
    ];

    // Call the appropriate provider
    const caller = PROVIDER_CALLERS[selectedModel.provider];
    if (!caller) {
      throw new Error(`Unknown provider: ${selectedModel.provider}`);
    }

    try {
      console.log(`🧠 AI Engine: Calling ${selectedModel.provider} / ${selectedModel.id}`);
      
      const result = await caller(selectedModel, messages, {
        temperature,
        maxTokens,
        timeoutMs,
        onRetry,
        responseFormat: responseSchema ? { type: 'json_object' } : undefined,
      });

      // Track usage
      if (result.usage) {
        this.stats.totalTokens += (result.usage.input_tokens || 0) + (result.usage.output_tokens || result.usage.completion_tokens || 0);
      }

      // Parse JSON if schema provided
      if (responseSchema) {
        try {
          const parsed = JSON.parse(result.content);
          this.stats.successfulRequests++;
          return parsed;
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          throw new Error('AI returned invalid JSON');
        }
      }

      this.stats.successfulRequests++;
      return result.content;
    } catch (error) {
      this.stats.failedRequests++;
      console.error('❌ AI Engine Error:', error);
      throw error;
    }
  }

  /**
   * Convenience methods for common tasks
   */
  async analyzeProject(files, projectContext) {
    return this.invoke({
      prompt: PROMPT_TEMPLATES.build.analysis(files, projectContext),
      taskType: 'analysis',
      responseSchema: RESPONSE_SCHEMAS.analysis,
      maxTokens: 8000,
      timeoutMs: 180000, // 3 minutes for large analyses
    });
  }

  async generateTasks(analysis) {
    return this.invoke({
      prompt: PROMPT_TEMPLATES.build.taskGeneration(analysis),
      taskType: 'taskGeneration',
      responseSchema: RESPONSE_SCHEMAS.tasks,
      maxTokens: 4000,
    });
  }

  async reviewCode(code, context) {
    return this.invoke({
      prompt: PROMPT_TEMPLATES.build.codeReview(code, context),
      taskType: 'codeReview',
      responseSchema: RESPONSE_SCHEMAS.codeReview,
    });
  }

  async refactorCode(code, goals) {
    return this.invoke({
      prompt: PROMPT_TEMPLATES.build.refactoring(code, goals),
      taskType: 'refactoring',
    });
  }

  async chat(message, context = '') {
    return this.invoke({
      prompt: context ? `${context}\n\nUser: ${message}` : message,
      taskType: 'chat',
      temperature: 0.7,
    });
  }

  /**
   * Get engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(1) + '%'
        : 'N/A',
      availableProviders: this.getAvailableProviders(),
      demoMode: getConfig().demoMode,
    };
  }

  /**
   * Mock responses for demo mode
   */
  _getMockResponse(prompt, taskType) {
    const lowerPrompt = prompt.toLowerCase();

    if (taskType === 'taskGeneration' || lowerPrompt.includes('task')) {
      return {
        tasks: [
          { title: 'Add Error Boundaries', description: 'Implement React Error Boundaries', category: 'feature', priority: 'high', estimated_effort: 'small', files_affected: ['src/App.jsx'] },
          { title: 'Implement Input Validation', description: 'Add validation for all user inputs', category: 'security', priority: 'high', estimated_effort: 'medium', files_affected: ['src/components/'] },
          { title: 'Add Unit Tests', description: 'Write tests for store actions', category: 'test', priority: 'medium', estimated_effort: 'medium', files_affected: ['src/store/'] },
          { title: 'Optimize Bundle Size', description: 'Analyze and reduce bundle size', category: 'infra', priority: 'medium', estimated_effort: 'medium', files_affected: ['vite.config.js'] },
          { title: 'Add TypeScript', description: 'Migrate to TypeScript for type safety', category: 'refactor', priority: 'low', estimated_effort: 'large', files_affected: ['src/'] },
        ],
      };
    }

    if (taskType === 'analysis' || lowerPrompt.includes('analyze')) {
      return {
        summary: 'Well-structured React project with modern patterns.',
        detected_stack: {
          framework: 'React',
          language: 'JavaScript',
          package_manager: 'npm',
          testing_framework: 'Vitest',
          database: 'Supabase',
          additional: ['Tailwind CSS', 'Vite', 'Zustand'],
        },
        architecture: {
          pattern: 'Component-based SPA',
          components: [],
          external_dependencies: ['React', 'Tailwind', 'Zustand'],
          data_flow: 'Unidirectional with centralized state',
        },
        security_vulnerabilities: [],
        code_smells: [],
        test_suggestions: [],
        issues: [],
        tasks: [],
      };
    }

    return {
      response: 'Analysis complete.',
      confidence: 0.85,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const aiEngine = new AIEngine();

// Named exports for direct access
export { AI_PROVIDERS, AI_MODELS, MODEL_ROUTING };

// Default export
export default aiEngine;
