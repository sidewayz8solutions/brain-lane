/**
 * Brain Lane — Cloud GPU Worker Service
 * =======================================
 * Manages offloading heavy AI workloads to GPU compute providers.
 * 
 * Supported Providers:
 * - RunPod — Serverless GPU instances
 * - Replicate — Hosted model inference
 * - Modal — Python-first serverless
 * - Ollama — Local LLM server
 * - LM Studio — Local model hosting
 */

// ============================================================================
// GPU PROVIDER CONFIGURATION
// ============================================================================

export const GPUProvider = {
  RUNPOD: 'runpod',
  REPLICATE: 'replicate',
  MODAL: 'modal',
  OLLAMA: 'ollama',
  LM_STUDIO: 'lm_studio',
};

export const GPUTaskType = {
  CODE_ANALYSIS: 'code_analysis',
  MULTI_FILE_REFACTOR: 'multi_file_refactor',
  PROJECT_COMPLETION: 'project_completion',
  EMBEDDINGS: 'embeddings',
  CODE_GENERATION: 'code_generation',
};

const PROVIDER_CONFIG = {
  [GPUProvider.RUNPOD]: {
    name: 'RunPod',
    baseUrl: 'https://api.runpod.ai/v2',
    models: {
      'codellama-70b': { gpuType: 'A100', vram: 80 },
      'deepseek-coder-33b': { gpuType: 'A40', vram: 48 },
      'starcoder2-15b': { gpuType: 'RTX4090', vram: 24 },
    },
    costPerSecond: 0.00055, // ~$2/hr for A100
  },
  [GPUProvider.REPLICATE]: {
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      'meta/codellama-70b-instruct': { cold_start: 30 },
      'phind/phind-codellama-34b-v2': { cold_start: 20 },
      'bigcode/starcoder2-15b': { cold_start: 15 },
    },
    costPerPrediction: 0.0023, // varies by model
  },
  [GPUProvider.MODAL]: {
    name: 'Modal',
    baseUrl: null, // Uses Modal SDK
    models: {
      'codellama': { gpu: 'A100' },
      'deepseek-coder': { gpu: 'A10G' },
    },
  },
  [GPUProvider.OLLAMA]: {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434',
    models: {
      'codellama:7b': { context: 16384 },
      'codellama:13b': { context: 16384 },
      'deepseek-coder:6.7b': { context: 16384 },
      'starcoder2:7b': { context: 8192 },
      'qwen2.5-coder:7b': { context: 32768 },
    },
  },
  [GPUProvider.LM_STUDIO]: {
    name: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    models: {}, // Dynamic based on loaded model
  },
};

// ============================================================================
// GPU WORKER CLASS
// ============================================================================

class GPUWorkerService {
  constructor() {
    this.activeProvider = null;
    this.apiKeys = {};
    this.stats = {
      totalRequests: 0,
      totalComputeSeconds: 0,
      totalCost: 0,
    };
    this._loadConfig();
  }

  /**
   * Initialize with API keys
   */
  configure(config) {
    this.apiKeys = {
      runpod: config.runpodApiKey || import.meta.env.VITE_RUNPOD_API_KEY,
      replicate: config.replicateApiKey || import.meta.env.VITE_REPLICATE_API_KEY,
      modal: config.modalToken || import.meta.env.VITE_MODAL_TOKEN,
    };
    this._saveConfig();
  }

  /**
   * Check if a provider is available
   */
  async checkProvider(provider) {
    const config = PROVIDER_CONFIG[provider];
    if (!config) return { available: false, error: 'Unknown provider' };

    try {
      switch (provider) {
        case GPUProvider.OLLAMA:
          return await this._checkOllama();
        case GPUProvider.LM_STUDIO:
          return await this._checkLMStudio();
        case GPUProvider.RUNPOD:
          return await this._checkRunPod();
        case GPUProvider.REPLICATE:
          return await this._checkReplicate();
        default:
          return { available: false, error: 'Provider not implemented' };
      }
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Get available providers with their status
   */
  async getAvailableProviders() {
    const results = {};
    for (const provider of Object.values(GPUProvider)) {
      results[provider] = await this.checkProvider(provider);
    }
    return results;
  }

  /**
   * Run inference on a GPU provider
   */
  async runInference({
    provider,
    model,
    prompt,
    systemPrompt = '',
    maxTokens = 4096,
    temperature = 0.3,
    taskType = GPUTaskType.CODE_GENERATION,
  }) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      let result;
      switch (provider) {
        case GPUProvider.OLLAMA:
          result = await this._runOllama({ model, prompt, systemPrompt, maxTokens, temperature });
          break;
        case GPUProvider.LM_STUDIO:
          result = await this._runLMStudio({ model, prompt, systemPrompt, maxTokens, temperature });
          break;
        case GPUProvider.RUNPOD:
          result = await this._runRunPod({ model, prompt, systemPrompt, maxTokens, temperature });
          break;
        case GPUProvider.REPLICATE:
          result = await this._runReplicate({ model, prompt, systemPrompt, maxTokens, temperature });
          break;
        default:
          throw new Error(`Provider ${provider} not implemented`);
      }

      const elapsed = (Date.now() - startTime) / 1000;
      this.stats.totalComputeSeconds += elapsed;

      return {
        success: true,
        output: result.output,
        provider,
        model,
        computeTime: elapsed,
        tokensUsed: result.tokensUsed || null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider,
        model,
      };
    }
  }

  /**
   * Smart routing - pick best provider for task
   */
  async smartRoute({ prompt, systemPrompt, taskType, preferLocal = true }) {
    const providers = await this.getAvailableProviders();

    // Prefer local providers first if requested
    if (preferLocal) {
      if (providers[GPUProvider.OLLAMA]?.available) {
        const model = this._pickBestModel(GPUProvider.OLLAMA, taskType);
        return this.runInference({
          provider: GPUProvider.OLLAMA,
          model,
          prompt,
          systemPrompt,
          taskType,
        });
      }
      if (providers[GPUProvider.LM_STUDIO]?.available) {
        return this.runInference({
          provider: GPUProvider.LM_STUDIO,
          model: 'default',
          prompt,
          systemPrompt,
          taskType,
        });
      }
    }

    // Fall back to cloud providers
    if (providers[GPUProvider.REPLICATE]?.available) {
      const model = this._pickBestModel(GPUProvider.REPLICATE, taskType);
      return this.runInference({
        provider: GPUProvider.REPLICATE,
        model,
        prompt,
        systemPrompt,
        taskType,
      });
    }

    if (providers[GPUProvider.RUNPOD]?.available) {
      const model = this._pickBestModel(GPUProvider.RUNPOD, taskType);
      return this.runInference({
        provider: GPUProvider.RUNPOD,
        model,
        prompt,
        systemPrompt,
        taskType,
      });
    }

    throw new Error('No GPU providers available');
  }

  // ---------------------------------------------------------------------------
  // PROVIDER IMPLEMENTATIONS
  // ---------------------------------------------------------------------------

  async _checkOllama() {
    const config = PROVIDER_CONFIG[GPUProvider.OLLAMA];
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) throw new Error('Ollama not responding');
    
    const data = await response.json();
    const installedModels = data.models?.map(m => m.name) || [];
    
    return {
      available: true,
      models: installedModels,
      provider: GPUProvider.OLLAMA,
    };
  }

  async _runOllama({ model, prompt, systemPrompt, maxTokens, temperature }) {
    const config = PROVIDER_CONFIG[GPUProvider.OLLAMA];
    
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      output: data.response,
      tokensUsed: data.eval_count,
    };
  }

  async _checkLMStudio() {
    const config = PROVIDER_CONFIG[GPUProvider.LM_STUDIO];
    const response = await fetch(`${config.baseUrl}/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) throw new Error('LM Studio not responding');
    
    const data = await response.json();
    return {
      available: true,
      models: data.data?.map(m => m.id) || [],
      provider: GPUProvider.LM_STUDIO,
    };
  }

  async _runLMStudio({ model, prompt, systemPrompt, maxTokens, temperature }) {
    const config = PROVIDER_CONFIG[GPUProvider.LM_STUDIO];
    
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'default',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      output: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
    };
  }

  async _checkRunPod() {
    if (!this.apiKeys.runpod) {
      return { available: false, error: 'RunPod API key not configured' };
    }
    
    // RunPod health check
    return {
      available: true,
      models: Object.keys(PROVIDER_CONFIG[GPUProvider.RUNPOD].models),
      provider: GPUProvider.RUNPOD,
    };
  }

  async _runRunPod({ model, prompt, systemPrompt, maxTokens, temperature }) {
    const config = PROVIDER_CONFIG[GPUProvider.RUNPOD];
    
    // This would use your deployed RunPod endpoint
    const response = await fetch(`${config.baseUrl}/your-endpoint-id/runsync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.runpod}`,
      },
      body: JSON.stringify({
        input: {
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          max_tokens: maxTokens,
          temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`RunPod error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      output: data.output?.text || data.output,
      tokensUsed: null,
    };
  }

  async _checkReplicate() {
    if (!this.apiKeys.replicate) {
      return { available: false, error: 'Replicate API key not configured' };
    }
    
    return {
      available: true,
      models: Object.keys(PROVIDER_CONFIG[GPUProvider.REPLICATE].models),
      provider: GPUProvider.REPLICATE,
    };
  }

  async _runReplicate({ model, prompt, systemPrompt, maxTokens, temperature }) {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKeys.replicate}`,
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          max_tokens: maxTokens,
          temperature,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate error: ${response.statusText}`);
    }

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(r => setTimeout(r, 1000));
      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${this.apiKeys.replicate}` },
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error(result.error || 'Replicate prediction failed');
    }

    return {
      output: Array.isArray(result.output) ? result.output.join('') : result.output,
      tokensUsed: null,
    };
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  _pickBestModel(provider, taskType) {
    const config = PROVIDER_CONFIG[provider];
    const models = Object.keys(config.models);
    
    // Simple heuristic: prefer larger models for complex tasks
    if (taskType === GPUTaskType.PROJECT_COMPLETION || taskType === GPUTaskType.MULTI_FILE_REFACTOR) {
      return models.find(m => m.includes('70b') || m.includes('33b') || m.includes('34b')) || models[0];
    }
    
    // Use smaller models for simpler tasks
    return models.find(m => m.includes('7b') || m.includes('6.7b') || m.includes('15b')) || models[0];
  }

  _loadConfig() {
    try {
      const stored = localStorage.getItem('brain-lane-gpu-config');
      if (stored) {
        const data = JSON.parse(stored);
        this.apiKeys = data.apiKeys || {};
      }
    } catch (e) {
      console.warn('Failed to load GPU config');
    }
  }

  _saveConfig() {
    try {
      localStorage.setItem('brain-lane-gpu-config', JSON.stringify({
        apiKeys: this.apiKeys,
      }));
    } catch (e) {
      console.warn('Failed to save GPU config');
    }
  }

  /**
   * Get usage stats
   */
  getStats() {
    return { ...this.stats };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const gpuWorker = new GPUWorkerService();
export default gpuWorker;
