/**
 * Brain Lane — Goal & Planning Service
 * =====================================
 * Manages goal capture, scoping, and planning for AI-assisted project completion.
 *
 * Features:
 * - Goal creation and validation
 * - Scope definition with constraints
 * - Plan generation with prioritized tasks
 * - Effort and risk estimation
 * - Plan versioning and comparison
 */

import { supabase } from './supabaseClient';
import { orchestrator, AgentType } from './multiAgentOrchestrator';

// ============================================================================
// GOAL STATUS ENUM
// ============================================================================

export const GoalStatus = {
  DRAFT: 'draft',
  SCOPED: 'scoped',
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ============================================================================
// PLAN STATUS ENUM
// ============================================================================

export const PlanStatus = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// ============================================================================
// TASK PRIORITY & RISK LEVELS
// ============================================================================

export const TaskPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const RiskLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// ============================================================================
// GOAL PLANNING SERVICE CLASS
// ============================================================================

class GoalPlanningService {
  constructor() {
    this.currentGoal = null;
    this.currentPlan = null;
  }

  // ==========================================================================
  // GOAL MANAGEMENT
  // ==========================================================================

  /**
   * Create a new goal for a workspace
   */
  async createGoal(workspaceId, goalData) {
    const goal = {
      workspace_id: workspaceId,
      title: goalData.title,
      description: goalData.description || '',
      constraints: goalData.constraints || [],
      risk_tolerance: goalData.risk_tolerance || 'balanced',
      status: GoalStatus.DRAFT,
      created_at: new Date().toISOString(),
    };

    // If Supabase is available, persist
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .insert(goal)
          .select()
          .single();

        if (error) throw error;
        this.currentGoal = data;
        return data;
      } catch (err) {
        console.warn('Failed to persist goal to Supabase:', err.message);
      }
    }

    // Fallback to in-memory
    goal.id = crypto.randomUUID();
    this.currentGoal = goal;
    return goal;
  }

  /**
   * Update goal status
   */
  async updateGoalStatus(goalId, status) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', goalId)
          .select()
          .single();

        if (error) throw error;
        if (this.currentGoal?.id === goalId) {
          this.currentGoal = data;
        }
        return data;
      } catch (err) {
        console.warn('Failed to update goal status:', err.message);
      }
    }

    if (this.currentGoal?.id === goalId) {
      this.currentGoal.status = status;
      this.currentGoal.updated_at = new Date().toISOString();
    }
    return this.currentGoal;
  }

  /**
   * Get goal by ID
   */
  async getGoal(goalId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goalId)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Failed to fetch goal:', err.message);
      }
    }
    return this.currentGoal?.id === goalId ? this.currentGoal : null;
  }

  // ==========================================================================
  // PLAN GENERATION
  // ==========================================================================

  /**
   * Generate a plan for a goal using AI agents
   */
  async generatePlan(goalId, projectIndex, options = {}) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const { onProgress = () => {} } = options;

    onProgress({ phase: 'analysis', message: 'Running analysis workflow...' });

    // Run the analysis workflow (Architect → Gap Analyzer → Task Planner)
    const analysisResult = await orchestrator.runAnalysisWorkflow(
      projectIndex,
      goal,
      {
        onProgress: (p) => onProgress({ phase: 'analysis', ...p }),
      }
    );

    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }

    onProgress({ phase: 'planning', message: 'Creating plan from analysis...' });

    // Extract tasks from the planner result
    const plannerResult = analysisResult.results.taskPlanner;
    const tasks = this._extractTasksFromPlannerResult(plannerResult);

    // Create the plan object
    const plan = {
      goal_id: goalId,
      version: 1,
      status: PlanStatus.DRAFT,
      tasks,
      total_effort_hours: this._calculateTotalEffort(tasks),
      risk_summary: this._summarizeRisks(tasks),
      analysis_summary: {
        architect: analysisResult.results.architect?.analysis?.substring(0, 500),
        gaps: analysisResult.results.gapAnalyzer?.analysis?.substring(0, 500),
      },
      created_at: new Date().toISOString(),
    };

    // Persist to Supabase if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .insert(plan)
          .select()
          .single();

        if (error) throw error;
        this.currentPlan = data;

        // Update goal status
        await this.updateGoalStatus(goalId, GoalStatus.PLANNED);

        return data;
      } catch (err) {
        console.warn('Failed to persist plan:', err.message);
      }
    }

    // Fallback to in-memory
    plan.id = crypto.randomUUID();
    this.currentPlan = plan;
    await this.updateGoalStatus(goalId, GoalStatus.PLANNED);

    return plan;
  }

  /**
   * Extract structured tasks from planner agent result
   */
  _extractTasksFromPlannerResult(plannerResult) {
    // If we got structured output, use it directly
    if (plannerResult?.structured?.tasks) {
      return plannerResult.structured.tasks.map((task, index) => ({
        id: crypto.randomUUID(),
        order: index + 1,
        title: task.title || task.name,
        objective: task.objective || task.description,
        priority: this._normalizePriority(task.priority),
        effort_hours: task.effort_hours || task.effort || 2,
        risk: this._normalizeRisk(task.risk),
        dependencies: task.dependencies || [],
        status: 'pending',
      }));
    }

    // Parse from raw text if no structured output
    const tasks = [];
    const raw = plannerResult?.raw || plannerResult?.analysis || '';

    // Try to find numbered tasks
    const taskMatches = raw.matchAll(/(?:^|\n)\s*(\d+)\.\s*\*?\*?([^*\n]+)\*?\*?(?:\n|$)/g);
    let order = 1;

    for (const match of taskMatches) {
      tasks.push({
        id: crypto.randomUUID(),
        order: order++,
        title: match[2].trim(),
        objective: '',
        priority: TaskPriority.MEDIUM,
        effort_hours: 2,
        risk: RiskLevel.MEDIUM,
        dependencies: [],
        status: 'pending',
      });
    }

    // If no tasks found, create a single task from the analysis
    if (tasks.length === 0 && raw.length > 0) {
      tasks.push({
        id: crypto.randomUUID(),
        order: 1,
        title: 'Complete project goal',
        objective: raw.substring(0, 500),
        priority: TaskPriority.HIGH,
        effort_hours: 8,
        risk: RiskLevel.MEDIUM,
        dependencies: [],
        status: 'pending',
      });
    }

    return tasks;
  }

  _normalizePriority(priority) {
    const p = String(priority).toLowerCase();
    if (p.includes('critical') || p.includes('urgent')) return TaskPriority.CRITICAL;
    if (p.includes('high')) return TaskPriority.HIGH;
    if (p.includes('low')) return TaskPriority.LOW;
    return TaskPriority.MEDIUM;
  }

  _normalizeRisk(risk) {
    const r = String(risk).toLowerCase();
    if (r.includes('high')) return RiskLevel.HIGH;
    if (r.includes('low')) return RiskLevel.LOW;
    return RiskLevel.MEDIUM;
  }

  _calculateTotalEffort(tasks) {
    return tasks.reduce((sum, t) => sum + (t.effort_hours || 0), 0);
  }

  _summarizeRisks(tasks) {
    const highRisk = tasks.filter(t => t.risk === RiskLevel.HIGH).length;
    const mediumRisk = tasks.filter(t => t.risk === RiskLevel.MEDIUM).length;
    const lowRisk = tasks.filter(t => t.risk === RiskLevel.LOW).length;

    return {
      high: highRisk,
      medium: mediumRisk,
      low: lowRisk,
      overall: highRisk > 2 ? 'high' : mediumRisk > tasks.length / 2 ? 'medium' : 'low',
    };
  }

  // ==========================================================================
  // PLAN MANAGEMENT
  // ==========================================================================

  /**
   * Get plan by ID
   */
  async getPlan(planId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('id', planId)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Failed to fetch plan:', err.message);
      }
    }
    return this.currentPlan?.id === planId ? this.currentPlan : null;
  }

  /**
   * List plans for a goal
   */
  async listPlans(goalId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .eq('goal_id', goalId)
          .order('version', { ascending: false });

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Failed to list plans:', err.message);
      }
    }
    return this.currentPlan?.goal_id === goalId ? [this.currentPlan] : [];
  }

  /**
   * Approve a plan for execution
   */
  async approvePlan(planId) {
    return this._updatePlanStatus(planId, PlanStatus.APPROVED);
  }

  /**
   * Start executing a plan
   */
  async startPlanExecution(planId) {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);
    if (plan.status !== PlanStatus.APPROVED) {
      throw new Error('Plan must be approved before execution');
    }

    await this._updatePlanStatus(planId, PlanStatus.EXECUTING);
    await this.updateGoalStatus(plan.goal_id, GoalStatus.IN_PROGRESS);

    return this.getPlan(planId);
  }

  /**
   * Update plan status
   */
  async _updatePlanStatus(planId, status) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', planId)
          .select()
          .single();

        if (error) throw error;
        if (this.currentPlan?.id === planId) {
          this.currentPlan = data;
        }
        return data;
      } catch (err) {
        console.warn('Failed to update plan status:', err.message);
      }
    }

    if (this.currentPlan?.id === planId) {
      this.currentPlan.status = status;
      this.currentPlan.updated_at = new Date().toISOString();
    }
    return this.currentPlan;
  }

  /**
   * Update a task within a plan
   */
  async updatePlanTask(planId, taskId, updates) {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error(`Task not found: ${taskId}`);

    plan.tasks[taskIndex] = { ...plan.tasks[taskIndex], ...updates };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .update({ tasks: plan.tasks, updated_at: new Date().toISOString() })
          .eq('id', planId)
          .select()
          .single();

        if (error) throw error;
        this.currentPlan = data;
        return data;
      } catch (err) {
        console.warn('Failed to update plan task:', err.message);
      }
    }

    this.currentPlan = plan;
    return plan;
  }

  /**
   * Get the next pending task from a plan
   */
  getNextTask(plan) {
    if (!plan?.tasks) return null;

    // Find first pending task whose dependencies are all completed
    return plan.tasks.find(task => {
      if (task.status !== 'pending') return false;

      // Check if all dependencies are completed
      const deps = task.dependencies || [];
      return deps.every(depId => {
        const depTask = plan.tasks.find(t => t.id === depId);
        return depTask?.status === 'completed';
      });
    });
  }

  /**
   * Check if all tasks in a plan are completed
   */
  isPlanComplete(plan) {
    if (!plan?.tasks) return false;
    return plan.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const goalPlanningService = new GoalPlanningService();
export default goalPlanningService;
