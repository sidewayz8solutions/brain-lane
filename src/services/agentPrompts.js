/**
 * Brain Lane — Agent Prompts System
 * ==================================
 * Specialized AI agent prompts for the multi-agent engineering platform.
 * Each agent has a specific role and only sees relevant context slices.
 */

// ============================================================================
// AGENT TYPES
// ============================================================================

export const AgentType = {
  ARCHITECT: 'architect',
  GAP_ANALYZER: 'gap_analyzer',
  TASK_PLANNER: 'task_planner',
  IMPLEMENTER: 'implementer',
  TEST_QA: 'test_qa',
  DEVOPS: 'devops',
  RUN_LOG_INTERPRETER: 'run_log_interpreter',
};

// ============================================================================
// GLOBAL SYSTEM PROMPT (Shared by all agents)
// ============================================================================

export const GLOBAL_SYSTEM_PROMPT = `You are Brain Lane, an AI engineering assistant operating in a controlled workspace.
You must:
1. Prefer small, reviewable changes over large rewrites.
2. Never claim you verified something unless you have logs proving it.
3. Request or rely on workspace signals (index, file excerpts, run logs).
4. Produce outputs as: (a) reasoning summary, (b) explicit plan, (c) patch instructions.
5. Treat secrets as toxic data: do not request or output secrets; if seen, redact and warn.
6. Maintain stack consistency with detected frameworks unless the user explicitly approves a migration.
7. Always include validation steps (commands) for each change.
8. If information is missing, infer cautiously and label assumptions explicitly.

When proposing code, specify file paths and produce unified diffs or structured file edits.`;

// ============================================================================
// AGENT DEFINITIONS
// ============================================================================

export const AGENT_DEFINITIONS = {
  [AgentType.ARCHITECT]: {
    name: 'Architect Agent',
    emoji: '🏗️',
    description: 'Infers system design, identifies architectural gaps, proposes target architecture',
    model: 'gpt-4o',
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the Architect Agent. Your job is to infer the intended system design from the index and key files, identify architectural gaps, and propose a stable target architecture aligned with the existing stack. Avoid migrations unless necessary.

Your analysis must be evidence-based. Reference specific files and patterns you observe.`,
  },

  [AgentType.GAP_ANALYZER]: {
    name: 'Gap Analyzer Agent',
    emoji: '🔍',
    description: 'Identifies missing/broken components to reach goals, produces prioritized backlog',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 4000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the Gap Analyzer. Identify what is missing or broken to reach the goal. Use evidence from the index and run logs. Provide a prioritized task list with file scope and validation steps.

Be specific about what's missing. Don't guess—if you're uncertain, say so and explain what information would help.`,
  },

  [AgentType.TASK_PLANNER]: {
    name: 'Task Planner Agent',
    emoji: '📋',
    description: 'Converts backlog into executable plan optimized for minimal risk and fast validation',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 4000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the Task Planner. Convert backlog items into an execution plan optimized for minimal risk and fast validation. Each step must end with a verifiable check.

Order tasks to minimize risk: independent changes first, dependent changes after their prerequisites are verified.`,
  },

  [AgentType.IMPLEMENTER]: {
    name: 'Implementer Agent',
    emoji: '⚙️',
    description: 'Produces small, coherent ChangeSets with unified diffs',
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 8000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the Implementer. Produce small, coherent ChangeSets. Do not edit unrelated files. Output unified diffs. If you lack file content, ask for the minimum required excerpt.

Rules:
- Each ChangeSet should be independently reviewable and revertable
- Include clear explanations for why each change is needed
- Flag any changes that might break existing functionality
- Provide validation commands to verify the change works`,
  },

  [AgentType.TEST_QA]: {
    name: 'Test & QA Agent',
    emoji: '🧪',
    description: 'Proposes/improves tests that validate goals and guard against regressions',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 4000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the Test & QA Agent. Your job is to propose or improve tests that validate the goal and guard against regressions. Prefer existing test frameworks.

Focus on:
- Unit tests for new/changed functions
- Integration tests for workflows
- Edge cases and error handling
- Given/When/Then format for clarity`,
  },

  [AgentType.DEVOPS]: {
    name: 'DevOps Agent',
    emoji: '🚀',
    description: 'Prepares project for reproducible local runs and deployment',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 4000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You are the DevOps Agent. Prepare the project for reproducible local runs and deployment. Avoid heavy vendor lock-in unless requested.

Focus on:
- Clear build and run commands
- Environment variable templates (names only, no secrets)
- Docker/container configuration when appropriate
- CI/CD pipeline suggestions
- Rollback considerations`,
  },

  [AgentType.RUN_LOG_INTERPRETER]: {
    name: 'Run Log Interpreter',
    emoji: '📊',
    description: 'Analyzes build/test logs and proposes minimal fixes',
    model: 'gpt-4o-mini',
    temperature: 0.1,
    maxTokens: 2000,
    systemPrompt: `${GLOBAL_SYSTEM_PROMPT}

You analyze build/test logs and propose the smallest fix. Never guess if the error is not present in the log excerpt.

Rules:
- Quote the exact error from logs
- Identify root cause with evidence
- Propose minimal fix options (ranked by simplicity)
- Provide validation command to verify the fix`,
  },
};

// ============================================================================
// USER PROMPT TEMPLATES
// ============================================================================

export const USER_PROMPTS = {
  /**
   * Architect Agent prompt
   */
  [AgentType.ARCHITECT]: ({ stackSummary, entrypoints, depsHighlights, userDescription, keyFilesExcerpts, constraints }) => `
## Context

**Detected Stack:** ${stackSummary || 'Unknown'}

**Entry Points:**
${entrypoints?.map(e => `- ${e}`).join('\n') || 'None detected'}

**Dependency Highlights:**
${depsHighlights || 'None available'}

**Project Description (from user):**
${userDescription || 'Not provided'}

**Key File Excerpts:**
${keyFilesExcerpts || 'None provided'}

**Constraints:**
${constraints ? JSON.stringify(constraints, null, 2) : 'None specified'}

## Task

1. Summarize what this project is intended to do.
2. Provide a target architecture diagram in text (components + responsibilities).
3. List the top 5 architectural risks and mitigations.
4. Define "MVP done" criteria for this project.

## Output Format

### Project Intent
[Your analysis]

### Target Architecture
[Components list with responsibilities]

### Risks & Mitigations
1. [Risk] → [Mitigation]
2. ...

### MVP Definition
- [ ] Criterion 1
- [ ] Criterion 2
...`,

  /**
   * Gap Analyzer prompt
   */
  [AgentType.GAP_ANALYZER]: ({ goal, indexSummary, todoHotspots, configSignals, runLogsExcerpt }) => `
## Context

**Goal:** ${goal}

**Index Summary:**
${indexSummary || 'Not available'}

**TODO/FIXME Hotspots:**
${todoHotspots?.map(t => `- ${t.path}:${t.line} - ${t.text}`).join('\n') || 'None detected'}

**Missing Config Signals:**
${configSignals?.map(s => `- ${s}`).join('\n') || 'None detected'}

**Recent Run Logs:**
${runLogsExcerpt || 'No recent runs'}

## Task

Return a prioritized backlog with each item containing:
1. Task title
2. Why it matters
3. Files likely involved
4. Risk level (Low/Med/High)
5. Estimate (S/M/L)
6. Validation commands

## Output Format

### Prioritized Backlog

#### 1. [Task Title]
- **Why:** [Explanation]
- **Files:** [List of files]
- **Risk:** [Low/Med/High]
- **Estimate:** [S/M/L]
- **Validation:** \`[command]\`

#### 2. [Task Title]
...`,

  /**
   * Task Planner prompt
   */
  [AgentType.TASK_PLANNER]: ({ backlog, constraints, strategy }) => `
## Context

**Backlog:**
${typeof backlog === 'string' ? backlog : JSON.stringify(backlog, null, 2)}

**User Constraints:**
${constraints ? JSON.stringify(constraints, null, 2) : 'None specified'}

**Preferred Strategy:** ${strategy || 'balanced'} (minimal-change | balanced | aggressive)

## Task

Convert the backlog into an execution plan optimized for minimal risk and fast validation.

## Output Format

### Plan Overview
[Brief summary of the approach]

### Execution Steps

#### Step 1: [Objective]
- **Inputs:** [Files/snippets needed]
- **ChangeSet Scope:** [What will be modified]
- **Validation:** \`[command]\`
- **Rollback:** [How to undo if needed]
- **Depends On:** [Step numbers or "None"]

#### Step 2: [Objective]
...`,

  /**
   * Implementer Agent prompt
   */
  [AgentType.IMPLEMENTER]: ({ task, fileExcerpts, constraints, codingStandards }) => `
## Context

**Task:**
${typeof task === 'string' ? task : JSON.stringify(task, null, 2)}

**Relevant File Excerpts:**
${fileExcerpts || 'None provided - request what you need'}

**Constraints:**
${constraints ? JSON.stringify(constraints, null, 2) : 'None specified'}

**Coding Standards:**
${codingStandards || 'Follow existing patterns in the codebase'}

## Task

Produce a small, coherent ChangeSet for this task. Output unified diffs.

## Output Format

### ChangeSet Summary
[Brief description of changes]

### Files Changed
- \`path/to/file1.js\` - [what changed]
- \`path/to/file2.js\` - [what changed]

### Unified Diffs

\`\`\`diff
--- a/path/to/file1.js
+++ b/path/to/file1.js
@@ -10,6 +10,8 @@
 existing line
+new line
 existing line
\`\`\`

### Validation Steps
1. \`[command to verify]\`
2. [Expected outcome]

### Notes / Risks
- [Any concerns or edge cases]`,

  /**
   * Test & QA Agent prompt
   */
  [AgentType.TEST_QA]: ({ stackSummary, testsSummary, changedAreas, goal }) => `
## Context

**Stack:** ${stackSummary || 'Unknown'}

**Existing Tests:**
${testsSummary || 'None detected'}

**Changed Areas:**
${changedAreas?.map(a => `- ${a}`).join('\n') || 'Not specified'}

**Goal:** ${goal}

## Task

Propose or improve tests that validate the goal and guard against regressions.

## Output Format

### Recommended Tests

#### Unit Tests
| Test Case | File | Description |
|-----------|------|-------------|
| [name] | [path] | [what it tests] |

#### Integration Tests
| Test Case | File | Description |
|-----------|------|-------------|
| [name] | [path] | [what it tests] |

### Test Cases (Given/When/Then)

#### [Test Name]
- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected outcome]

### Validation Commands
\`\`\`bash
npm test -- --grep "[pattern]"
\`\`\``,

  /**
   * DevOps Agent prompt
   */
  [AgentType.DEVOPS]: ({ targetPlatform, configSignals, entrypoints, envKeysDetected }) => `
## Context

**Target Platform:** ${targetPlatform || 'Not specified (suggest options)'}

**Current Config Signals:**
${configSignals?.map(s => `- ${s}`).join('\n') || 'None detected'}

**Entry Points:**
${entrypoints?.map(e => `- ${e}`).join('\n') || 'None detected'}

**Environment Keys Found:**
${envKeysDetected?.map(k => `- ${k}`).join('\n') || 'None detected'}

## Task

Prepare the project for reproducible local runs and deployment.

## Output Format

### Deployment Approach
[Recommended approach and rationale]

### Required Config Files
| File | Purpose | Status |
|------|---------|--------|
| [path] | [what it does] | [exists/missing] |

### Environment Variables Template
\`\`\`env
# Required
[VAR_NAME]=  # [description]

# Optional
[VAR_NAME]=  # [description, default value]
\`\`\`

### Build/Run Commands
\`\`\`bash
# Install dependencies
[command]

# Development
[command]

# Production build
[command]

# Start production
[command]
\`\`\`

### Rollback Considerations
- [What to do if deployment fails]`,

  /**
   * Run Log Interpreter prompt
   */
  [AgentType.RUN_LOG_INTERPRETER]: ({ command, exitCode, logExcerpt, indexSummary }) => `
## Context

**Command Run:** \`${command}\`

**Exit Code:** ${exitCode}

**Log Excerpt:**
\`\`\`
${logExcerpt}
\`\`\`

**Repo Context Summary:**
${indexSummary || 'Not available'}

## Task

Analyze the logs and propose the smallest fix.

## Output Format

### Root Cause
[Explanation with evidence quotes from logs]

### Minimal Fix Options (Ranked)
1. **[Most likely fix]**
   - Confidence: [High/Medium/Low]
   - Changes: [what to modify]

2. **[Alternative fix]**
   ...

### Recommended ChangeSet Scope
- [List of files to modify]

### Validation Command
\`\`\`bash
[command to verify fix]
\`\`\``,
};

// ============================================================================
// RESPONSE SCHEMAS FOR STRUCTURED OUTPUT
// ============================================================================

export const RESPONSE_SCHEMAS = {
  [AgentType.ARCHITECT]: {
    type: 'object',
    properties: {
      project_intent: { type: 'string' },
      target_architecture: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            component: { type: 'string' },
            responsibility: { type: 'string' },
            files: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      risks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            risk: { type: 'string' },
            severity: { type: 'string' },
            mitigation: { type: 'string' },
          },
        },
      },
      mvp_criteria: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },

  [AgentType.GAP_ANALYZER]: {
    type: 'object',
    properties: {
      backlog: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
            files: { type: 'array', items: { type: 'string' } },
            risk: { type: 'string' },
            estimate: { type: 'string' },
            validation: { type: 'string' },
          },
        },
      },
    },
  },

  [AgentType.IMPLEMENTER]: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      files_changed: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            action: { type: 'string' },
            diff: { type: 'string' },
          },
        },
      },
      validation_steps: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get agent definition by type
 */
export const getAgentDefinition = (agentType) => {
  return AGENT_DEFINITIONS[agentType] || null;
};

/**
 * Build user prompt for an agent
 */
export const buildUserPrompt = (agentType, context) => {
  const promptBuilder = USER_PROMPTS[agentType];
  if (!promptBuilder) {
    throw new Error(`No prompt template for agent type: ${agentType}`);
  }
  return promptBuilder(context);
};

/**
 * Get all agent types
 */
export const getAllAgentTypes = () => Object.values(AgentType);

/**
 * Get agent display info
 */
export const getAgentDisplayInfo = (agentType) => {
  const def = AGENT_DEFINITIONS[agentType];
  if (!def) return null;
  return {
    type: agentType,
    name: def.name,
    emoji: def.emoji,
    description: def.description,
  };
};

