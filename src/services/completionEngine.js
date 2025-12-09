/**
 * Brain Lane — AI Project Completion Engine
 * ==========================================
 * A multi-stage AI pipeline that analyzes, diagnoses, and completes projects.
 * 
 * Pipeline Stages:
 * 1. Understanding Stage — "What is this app supposed to do?"
 * 2. Missing Feature Detection — Compare to expected functionality
 * 3. Fix + Complete Stage — Generate missing files, routes, UI, functions
 * 4. Packaging Stage — Output ready-to-build folder
 */

import { aiEngine, PROMPT_TEMPLATES, AI_MODELS } from './aiEngine';
import { projectScanner } from './projectScanner';
import { jobQueue, JobType, JobPriority } from './jobQueue';

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export const PipelineStage = {
  UNDERSTANDING: 'understanding',
  FEATURE_DETECTION: 'feature_detection',
  FIX_AND_COMPLETE: 'fix_and_complete',
  PACKAGING: 'packaging',
};

export const PipelineStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// ============================================================================
// PROMPT TEMPLATES FOR COMPLETION ENGINE
// ============================================================================

const COMPLETION_PROMPTS = {
  understanding: {
    system: `You are an expert software analyst. Your job is to understand what an application is supposed to do by analyzing its codebase.

Examine the code structure, README, package.json, and source files to determine:
1. The primary purpose of the application
2. Target users and use cases
3. Core features (implemented and implied)
4. Architecture and tech stack
5. External integrations needed

Be specific and thorough. If you're uncertain, note your confidence level.`,

    user: (files, packageJson, readme) => `
Analyze this application and tell me what it's supposed to do.

${readme ? `README.md:\n${readme}\n\n` : ''}
${packageJson ? `package.json:\n${packageJson}\n\n` : ''}

Key source files:
${files.map(f => `--- ${f.path} ---\n${f.content.substring(0, 2000)}`).join('\n\n')}

Provide a comprehensive understanding of this application.
`,
  },

  featureDetection: {
    system: `You are a senior product engineer. Given an understanding of what an app should do, analyze what's actually implemented vs what's missing.

For each feature, assess:
1. Implementation status (complete, partial, missing, broken)
2. Priority (critical, high, medium, low)
3. Effort to complete (small: <2hrs, medium: 2-8hrs, large: >8hrs)
4. Dependencies on other features

Be thorough - look for:
- Missing API routes
- Incomplete UI components
- Broken data flows
- Missing error handling
- Incomplete authentication
- Missing database operations`,

    user: (understanding, diagnosis) => `
Based on this understanding of the app:
${JSON.stringify(understanding, null, 2)}

And this technical diagnosis:
${JSON.stringify(diagnosis, null, 2)}

Identify all missing, incomplete, or broken features.
Return a JSON object with:
{
  "features": [
    {
      "name": "Feature name",
      "status": "complete|partial|missing|broken",
      "description": "What this feature should do",
      "currentState": "What's currently implemented",
      "missing": ["List of missing pieces"],
      "priority": "critical|high|medium|low",
      "effort": "small|medium|large",
      "dependencies": ["Other features this depends on"],
      "files": ["Affected files"]
    }
  ],
  "criticalPath": ["Ordered list of features to implement first"],
  "estimatedTotalEffort": "X hours/days",
  "readinessScore": 0-100
}
`,
  },

  generateFiles: {
    system: `You are an expert full-stack developer. Generate complete, production-ready code files.

Requirements:
- Write clean, well-documented code
- Follow the existing code style and patterns
- Include all necessary imports
- Add proper error handling
- Include comments explaining complex logic
- Ensure compatibility with the existing codebase

Output ONLY valid code that can be directly saved to a file.`,

    user: (feature, context, existingFiles) => `
Generate the code needed to implement this feature:
${JSON.stringify(feature, null, 2)}

Project context:
- Framework: ${context.framework}
- Language: ${context.language}
- Style: ${context.codeStyle}

Related existing files for reference:
${existingFiles.map(f => `--- ${f.path} ---\n${f.content.substring(0, 1500)}`).join('\n\n')}

Generate the complete code for each file needed. Format your response as:

FILE: path/to/file.js
\`\`\`javascript
// Complete file content here
\`\`\`

FILE: path/to/another-file.jsx
\`\`\`jsx
// Complete file content here
\`\`\`
`,
  },

  generateRoute: {
    system: `You are a backend API expert. Generate complete API route handlers.

Include:
- Input validation
- Error handling
- Database operations
- Response formatting
- Authentication checks where needed`,

    user: (routeSpec, context) => `
Generate an API route for:
${JSON.stringify(routeSpec, null, 2)}

Framework: ${context.framework}
Database: ${context.database}
Auth: ${context.auth}
`,
  },

  packaging: {
    system: `You are a DevOps expert. Generate deployment configuration files.`,

    user: (project) => `
Generate deployment files for this project:

Stack: ${project.stack.join(', ')}
Framework: ${project.framework}
Database: ${project.database}

Generate:
1. Dockerfile (if applicable)
2. docker-compose.yml (if applicable)
3. Vercel/Netlify config (if frontend)
4. Environment variable template (.env.example)
5. Build scripts

Format each file with FILE: marker.
`,
  },
};

// ============================================================================
// COMPLETION ENGINE CLASS
// ============================================================================

class ProjectCompletionEngine {
  constructor() {
    this.status = PipelineStatus.IDLE;
    this.currentStage = null;
    this.results = {};
    this.listeners = new Map();
    this.generatedFiles = [];
  }

  /**
   * Run the full completion pipeline
   */
  async runPipeline(files, options = {}) {
    const {
      onProgress = () => {},
      onStageComplete = () => {},
      skipStages = [],
      stopAfterStage = null,
    } = options;

    this.status = PipelineStatus.RUNNING;
    this.results = {};
    this.generatedFiles = [];

    try {
      // Stage 1: Understanding
      if (!skipStages.includes(PipelineStage.UNDERSTANDING)) {
        this.currentStage = PipelineStage.UNDERSTANDING;
        onProgress(0, 'Understanding the project...');
        
        const understanding = await this._runUnderstandingStage(files);
        this.results.understanding = understanding;
        onStageComplete(PipelineStage.UNDERSTANDING, understanding);
        
        if (stopAfterStage === PipelineStage.UNDERSTANDING) {
          this.status = PipelineStatus.PAUSED;
          return this.results;
        }
      }

      // Stage 2: Feature Detection
      if (!skipStages.includes(PipelineStage.FEATURE_DETECTION)) {
        this.currentStage = PipelineStage.FEATURE_DETECTION;
        onProgress(25, 'Detecting missing features...');
        
        const features = await this._runFeatureDetectionStage(files);
        this.results.features = features;
        onStageComplete(PipelineStage.FEATURE_DETECTION, features);
        
        if (stopAfterStage === PipelineStage.FEATURE_DETECTION) {
          this.status = PipelineStatus.PAUSED;
          return this.results;
        }
      }

      // Stage 3: Fix and Complete
      if (!skipStages.includes(PipelineStage.FIX_AND_COMPLETE)) {
        this.currentStage = PipelineStage.FIX_AND_COMPLETE;
        onProgress(50, 'Generating missing code...');
        
        const completions = await this._runCompletionStage(files, this.results.features);
        this.results.completions = completions;
        onStageComplete(PipelineStage.FIX_AND_COMPLETE, completions);
        
        if (stopAfterStage === PipelineStage.FIX_AND_COMPLETE) {
          this.status = PipelineStatus.PAUSED;
          return this.results;
        }
      }

      // Stage 4: Packaging
      if (!skipStages.includes(PipelineStage.PACKAGING)) {
        this.currentStage = PipelineStage.PACKAGING;
        onProgress(85, 'Preparing deployment package...');
        
        const packaging = await this._runPackagingStage(files);
        this.results.packaging = packaging;
        onStageComplete(PipelineStage.PACKAGING, packaging);
      }

      onProgress(100, 'Pipeline complete!');
      this.status = PipelineStatus.COMPLETED;
      return this.results;

    } catch (error) {
      this.status = PipelineStatus.FAILED;
      this.results.error = error.message;
      throw error;
    }
  }

  /**
   * Stage 1: Understanding
   */
  async _runUnderstandingStage(files) {
    // Extract key files
    const readme = files.find(f => f.path.toLowerCase().includes('readme'))?.content;
    const packageJson = files.find(f => f.path === 'package.json')?.content;
    
    // Get representative source files
    const sourceFiles = files
      .filter(f => /\.(js|jsx|ts|tsx|py|go|rs)$/.test(f.path))
      .filter(f => !f.path.includes('node_modules'))
      .slice(0, 10);

    const response = await aiEngine.invoke({
      prompt: COMPLETION_PROMPTS.understanding.user(sourceFiles, packageJson, readme),
      systemPrompt: COMPLETION_PROMPTS.understanding.system,
      taskType: 'analysis',
      responseSchema: {
        type: 'object',
        properties: {
          purpose: { type: 'string' },
          targetUsers: { type: 'array', items: { type: 'string' } },
          coreFeatures: { type: 'array' },
          techStack: { type: 'object' },
          integrations: { type: 'array' },
          architecture: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    });

    return response;
  }

  /**
   * Stage 2: Feature Detection
   */
  async _runFeatureDetectionStage(files) {
    // Run project diagnosis
    const diagnosis = await projectScanner.scan(files);
    
    const response = await aiEngine.invoke({
      prompt: COMPLETION_PROMPTS.featureDetection.user(this.results.understanding, diagnosis),
      systemPrompt: COMPLETION_PROMPTS.featureDetection.system,
      taskType: 'analysis',
      responseSchema: {
        type: 'object',
        properties: {
          features: { type: 'array' },
          criticalPath: { type: 'array', items: { type: 'string' } },
          estimatedTotalEffort: { type: 'string' },
          readinessScore: { type: 'number' },
        },
      },
      maxTokens: 8000,
    });

    return {
      ...response,
      diagnosis,
    };
  }

  /**
   * Stage 3: Fix and Complete
   */
  async _runCompletionStage(files, featureAnalysis) {
    const completions = {
      files: [],
      summary: [],
    };

    // Get features that need work
    const incompleteFeatures = featureAnalysis.features
      .filter(f => f.status !== 'complete')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      });

    // Determine project context
    const context = {
      framework: this.results.understanding?.techStack?.framework || 'React',
      language: this.results.understanding?.techStack?.language || 'JavaScript',
      codeStyle: 'modern ES6+',
    };

    // Generate code for top priority features (limit to avoid huge responses)
    const featuresToComplete = incompleteFeatures.slice(0, 5);

    for (const feature of featuresToComplete) {
      try {
        // Find related existing files
        const relatedFiles = files.filter(f => 
          feature.files?.some(ff => f.path.includes(ff)) ||
          f.path.includes(feature.name.toLowerCase().replace(/\s+/g, ''))
        ).slice(0, 3);

        const response = await aiEngine.invoke({
          prompt: COMPLETION_PROMPTS.generateFiles.user(feature, context, relatedFiles),
          systemPrompt: COMPLETION_PROMPTS.generateFiles.system,
          taskType: 'refactoring',
          maxTokens: 4000,
        });

        // Parse generated files from response
        const generatedFiles = this._parseGeneratedFiles(response);
        completions.files.push(...generatedFiles);
        completions.summary.push({
          feature: feature.name,
          filesGenerated: generatedFiles.length,
          status: 'success',
        });

      } catch (error) {
        completions.summary.push({
          feature: feature.name,
          filesGenerated: 0,
          status: 'error',
          error: error.message,
        });
      }
    }

    this.generatedFiles = completions.files;
    return completions;
  }

  /**
   * Stage 4: Packaging
   */
  async _runPackagingStage(files) {
    const project = {
      stack: Object.keys(this.results.understanding?.techStack || {}),
      framework: this.results.understanding?.techStack?.framework || 'unknown',
      database: this.results.understanding?.techStack?.database || 'none',
    };

    const response = await aiEngine.invoke({
      prompt: COMPLETION_PROMPTS.packaging.user(project),
      systemPrompt: COMPLETION_PROMPTS.packaging.system,
      taskType: 'documentation',
    });

    const deploymentFiles = this._parseGeneratedFiles(response);
    
    return {
      deploymentFiles,
      allGeneratedFiles: [
        ...this.generatedFiles,
        ...deploymentFiles,
      ],
      readyToBuild: true,
    };
  }

  /**
   * Parse FILE: markers from AI response
   */
  _parseGeneratedFiles(response) {
    const files = [];
    const filePattern = /FILE:\s*(.+?)\n```(?:\w+)?\n([\s\S]*?)```/g;
    
    let match;
    while ((match = filePattern.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim(),
        generated: true,
        timestamp: new Date().toISOString(),
      });
    }

    return files;
  }

  /**
   * Get current pipeline status
   */
  getStatus() {
    return {
      status: this.status,
      currentStage: this.currentStage,
      results: this.results,
      generatedFiles: this.generatedFiles,
    };
  }

  /**
   * Reset the engine
   */
  reset() {
    this.status = PipelineStatus.IDLE;
    this.currentStage = null;
    this.results = {};
    this.generatedFiles = [];
  }

  /**
   * Create a queued job for the completion pipeline
   */
  async queuePipeline(files, options = {}) {
    return jobQueue.add(JobType.AI_ANALYSIS, {
      files,
      options,
    }, {
      priority: options.priority || JobPriority.NORMAL,
      timeout: 600000, // 10 minutes for full pipeline
      projectId: options.projectId,
      userId: options.userId,
    });
  }
}

// ============================================================================
// REGISTER JOB PROCESSOR
// ============================================================================

// Register the pipeline processor with the job queue
jobQueue.process(JobType.AI_ANALYSIS, async (data, context) => {
  const engine = new ProjectCompletionEngine();
  
  return engine.runPipeline(data.files, {
    ...data.options,
    onProgress: (progress, message) => {
      context.updateProgress(progress, message);
    },
  });
});

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const completionEngine = new ProjectCompletionEngine();
export { ProjectCompletionEngine, COMPLETION_PROMPTS };
export default completionEngine;
