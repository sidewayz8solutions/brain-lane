-- ============================================================================
-- Brain Lane v2 — Comprehensive Data Model
-- ============================================================================
-- Run this AFTER setup-auth-schema.sql
-- This adds: workspaces, ingestions, project_index, goals, plans, changesets,
-- runs, artifacts, and audit_log tables
-- ============================================================================

-- ============================================================================
-- WORKSPACES TABLE (Isolated project environments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  -- Workspace info
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'indexing', 'analyzing', 'ready', 'error', 'archived')),
  
  -- Isolation & security
  sandbox_path TEXT, -- Path to isolated workspace filesystem
  secret_keys_detected TEXT[] DEFAULT '{}', -- Redacted keys found
  
  -- Metrics
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own workspaces" ON public.workspaces FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- INGESTIONS TABLE (Upload/import events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ingestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Source info
  source_type TEXT NOT NULL CHECK (source_type IN ('zip_upload', 'git_import', 'url_import')),
  source_url TEXT, -- For git/URL imports
  source_filename TEXT, -- For ZIP uploads
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'extracting', 'scanning', 'indexing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  
  -- Metrics
  total_files INTEGER DEFAULT 0,
  processed_files INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  skipped_files INTEGER DEFAULT 0,
  
  -- Security scan results
  virus_scan_status TEXT DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'suspicious', 'skipped')),
  blocked_files TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.ingestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ingestions" ON public.ingestions FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PROJECT_INDEX TABLE (Indexed metadata from codebase)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ingestion_id UUID REFERENCES public.ingestions(id) ON DELETE SET NULL,
  
  -- File tree (stored as JSONB for flexibility)
  file_tree JSONB DEFAULT '[]'::jsonb, -- [{path, size, ext, hash, type}]
  
  -- Language & framework detection
  languages JSONB DEFAULT '{}'::jsonb, -- {language: {files: count, lines: count}}
  frameworks JSONB DEFAULT '[]'::jsonb, -- [{name, version, confidence}]
  package_managers JSONB DEFAULT '[]'::jsonb, -- [{type, lockfile, dependencies_count}]
  
  -- Dependency graph
  dependencies JSONB DEFAULT '{}'::jsonb, -- {external: [], internal: [], missing: [], unused: []}
  
  -- Entry points & configs
  entry_points JSONB DEFAULT '[]'::jsonb, -- [{path, type, command}]
  config_files JSONB DEFAULT '[]'::jsonb, -- [{path, type, parsed_data}]
  
  -- Code signals
  todo_fixme_count INTEGER DEFAULT 0,
  todo_fixme_locations JSONB DEFAULT '[]'::jsonb, -- [{path, line, text, type}]
  stub_functions JSONB DEFAULT '[]'::jsonb, -- [{path, name, line}]
  
  -- Test coverage signals
  test_files JSONB DEFAULT '[]'::jsonb, -- [{path, framework, test_count}]
  test_coverage_estimate NUMERIC(5,2) DEFAULT 0,
  
  -- Module summaries (for LLM context)
  module_summaries JSONB DEFAULT '[]'::jsonb, -- [{path, summary, exports, imports}]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspace index" ON public.project_index FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can manage workspace index" ON public.project_index FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()));

-- ============================================================================
-- GOALS TABLE (User-defined objectives)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Goal definition
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'run_locally', 'fix_errors', 'complete_feature', 'add_auth', 'add_payments',
    'deploy', 'refactor', 'add_tests', 'security_audit', 'performance', 'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  custom_criteria TEXT, -- For custom goals
  
  -- Constraints
  constraints JSONB DEFAULT '{}'::jsonb, -- {stack_locked, budget, time_limit, minimal_changes}
  risk_tolerance TEXT DEFAULT 'balanced' CHECK (risk_tolerance IN ('minimal', 'balanced', 'aggressive')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  success_criteria JSONB DEFAULT '[]'::jsonb, -- [{criterion, met: boolean}]
  
  -- Priority
  priority INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PLANS TABLE (AI-generated execution plans)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Plan metadata
  title TEXT NOT NULL,
  summary TEXT,
  strategy TEXT DEFAULT 'balanced' CHECK (strategy IN ('minimal', 'balanced', 'aggressive')),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'failed', 'cancelled')),

  -- Plan content (ordered tasks)
  tasks JSONB DEFAULT '[]'::jsonb, -- [{id, title, objective, files, risk, estimate, validation, depends_on, status}]

  -- Metrics
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  estimated_effort TEXT, -- 'small', 'medium', 'large', or hours
  actual_effort_minutes INTEGER,

  -- AI generation metadata
  agent_used TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- CHANGESETS TABLE (Reviewable code modifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.changesets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Changeset info
  title TEXT NOT NULL,
  description TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preview', 'approved', 'applied', 'reverted', 'rejected')),

  -- Changes (array of file modifications)
  changes JSONB DEFAULT '[]'::jsonb, -- [{path, action, old_content, new_content, diff, risk}]

  -- Validation
  validation_commands JSONB DEFAULT '[]'::jsonb, -- [{command, expected_outcome}]
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'passed', 'failed', 'skipped')),

  -- Risk assessment
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_flags JSONB DEFAULT '[]'::jsonb, -- [{flag, description}]

  -- Rollback info
  can_rollback BOOLEAN DEFAULT TRUE,
  rollback_changeset_id UUID REFERENCES public.changesets(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  reverted_at TIMESTAMPTZ
);

ALTER TABLE public.changesets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own changesets" ON public.changesets FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RUNS TABLE (Build/test/lint executions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  changeset_id UUID REFERENCES public.changesets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Run info
  run_type TEXT NOT NULL CHECK (run_type IN ('install', 'build', 'test', 'lint', 'format', 'custom')),
  command TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled', 'timeout')),
  exit_code INTEGER,

  -- Output
  stdout TEXT,
  stderr TEXT,
  log_summary TEXT, -- AI-generated summary of logs

  -- Metrics
  duration_ms INTEGER,

  -- Environment snapshot
  env_snapshot JSONB DEFAULT '{}'::jsonb, -- {node_version, npm_version, etc}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own runs" ON public.runs FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- ARTIFACTS TABLE (Generated files, docs, reports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  changeset_id UUID REFERENCES public.changesets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Artifact info
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'patched_zip', 'patch_bundle', 'readme', 'env_template',
    'setup_instructions', 'deploy_instructions', 'report', 'config'
  )),
  name TEXT NOT NULL,
  description TEXT,

  -- Storage
  storage_path TEXT, -- Path in Supabase Storage
  content TEXT, -- For small text artifacts, store inline
  content_type TEXT DEFAULT 'text/plain',
  size_bytes BIGINT DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own artifacts" ON public.artifacts FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT_LOG TABLE (Complete event trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL CHECK (event_type IN (
    'workspace_created', 'ingestion_started', 'ingestion_completed', 'indexing_completed',
    'goal_created', 'plan_generated', 'plan_approved', 'changeset_created',
    'changeset_applied', 'changeset_reverted', 'run_started', 'run_completed',
    'artifact_created', 'agent_invoked', 'error_occurred'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,

  -- AI context (for debugging and transparency)
  agent_type TEXT,
  prompt_hash TEXT, -- Hash of prompt for deduplication/audit
  prompt_excerpt TEXT, -- First N chars of prompt (redacted)
  response_excerpt TEXT, -- First N chars of response
  tokens_used INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit log" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit log" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON public.workspaces(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_project_id ON public.workspaces(project_id);

CREATE INDEX IF NOT EXISTS idx_ingestions_workspace_id ON public.ingestions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ingestions_status ON public.ingestions(status);

CREATE INDEX IF NOT EXISTS idx_project_index_workspace_id ON public.project_index(workspace_id);

CREATE INDEX IF NOT EXISTS idx_goals_workspace_id ON public.goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

CREATE INDEX IF NOT EXISTS idx_plans_workspace_id ON public.plans(workspace_id);
CREATE INDEX IF NOT EXISTS idx_plans_goal_id ON public.plans(goal_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);

CREATE INDEX IF NOT EXISTS idx_changesets_workspace_id ON public.changesets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_changesets_plan_id ON public.changesets(plan_id);
CREATE INDEX IF NOT EXISTS idx_changesets_status ON public.changesets(status);

CREATE INDEX IF NOT EXISTS idx_runs_workspace_id ON public.runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.runs(status);

CREATE INDEX IF NOT EXISTS idx_artifacts_workspace_id ON public.artifacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.artifacts(artifact_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_workspace_id ON public.audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_index_updated_at
  BEFORE UPDATE ON public.project_index
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION log_audit_event(
  p_workspace_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'::jsonb,
  p_agent_type TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_log (workspace_id, user_id, event_type, event_data, agent_type, tokens_used)
  VALUES (p_workspace_id, p_user_id, p_event_type, p_event_data, p_agent_type, p_tokens_used)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate workspace readiness score
CREATE OR REPLACE FUNCTION calculate_readiness_score(p_workspace_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_index RECORD;
BEGIN
  SELECT * INTO v_index FROM public.project_index WHERE workspace_id = p_workspace_id LIMIT 1;

  IF v_index IS NULL THEN
    RETURN 0;
  END IF;

  -- Base score for having an index
  v_score := 20;

  -- Add points for detected frameworks
  IF jsonb_array_length(v_index.frameworks) > 0 THEN
    v_score := v_score + 15;
  END IF;

  -- Add points for entry points
  IF jsonb_array_length(v_index.entry_points) > 0 THEN
    v_score := v_score + 15;
  END IF;

  -- Add points for config files
  IF jsonb_array_length(v_index.config_files) > 0 THEN
    v_score := v_score + 10;
  END IF;

  -- Add points for test coverage
  IF v_index.test_coverage_estimate > 0 THEN
    v_score := v_score + LEAST(20, v_index.test_coverage_estimate::INTEGER / 5);
  END IF;

  -- Deduct for TODOs/FIXMEs
  IF v_index.todo_fixme_count > 0 THEN
    v_score := v_score - LEAST(10, v_index.todo_fixme_count / 5);
  END IF;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

