import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import {
    Play,
    Pause,
    SkipForward,
    RotateCcw,
    Settings,
    Zap,
    GitBranch,
    Code,
    TestTube,
    FileSearch,
    Database,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    ChevronRight,
    ChevronDown,
    AlertTriangle,
    Workflow,
    Plus,
    Save,
    Trash2,
    Edit3,
    Copy,
    Shield,
    Rocket,
    ArrowRight,
    GitMerge,
    History,
    Undo2,
    Split,
    Package,
    Cloud,
    Globe,
    Server,
    Terminal,
    FileCode,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';

// All available workflow steps with their configurations
const allStepConfigs = {
    init: { label: 'Initialize', icon: Settings, duration: 800, description: 'Setting up execution environment', category: 'setup' },
    analyze: { label: 'Analyze', icon: FileSearch, duration: 1500, description: 'Analyzing code structure and dependencies', category: 'analysis' },
    security: { label: 'Security Scan', icon: Shield, duration: 2000, description: 'Running security vulnerability scan', category: 'analysis' },
    generate: { label: 'Generate Code', icon: Code, duration: 3000, description: 'Generating code modifications', category: 'implementation' },
    review: { label: 'AI Review', icon: Zap, duration: 2000, description: 'AI reviewing generated changes', category: 'review' },
    test: { label: 'Run Tests', icon: TestTube, duration: 2500, description: 'Running automated tests', category: 'testing' },
    lint: { label: 'Lint & Format', icon: FileCode, duration: 1000, description: 'Running linter and formatter', category: 'testing' },
    docs: { label: 'Documentation', icon: Database, duration: 1000, description: 'Updating documentation', category: 'docs' },
    commit: { label: 'Commit', icon: GitBranch, duration: 500, description: 'Committing changes', category: 'vcs' },
    merge: { label: 'Merge', icon: GitMerge, duration: 800, description: 'Merging to target branch', category: 'vcs' },
    build: { label: 'Build', icon: Package, duration: 3000, description: 'Building production bundle', category: 'deployment' },
    stage: { label: 'Stage Deploy', icon: Server, duration: 2000, description: 'Deploying to staging environment', category: 'deployment' },
    production: { label: 'Production', icon: Rocket, duration: 2500, description: 'Deploying to production', category: 'deployment' },
    notify: { label: 'Notify', icon: Globe, duration: 500, description: 'Sending notifications', category: 'misc' }
};

// Default workflow templates
const defaultTemplates = {
    quick_fix: {
        name: 'Quick Fix',
        description: 'Fast path for small bug fixes',
        steps: [
            { id: 'init', conditions: [] },
            { id: 'generate', conditions: [] },
            { id: 'lint', conditions: [] },
            { id: 'test', conditions: [{ type: 'previous_success', stepId: 'lint' }] },
            { id: 'commit', conditions: [{ type: 'previous_success', stepId: 'test' }] }
        ],
        rollbackStrategy: 'step'
    },
    standard: {
        name: 'Standard Implementation',
        description: 'Balanced workflow for most tasks',
        steps: [
            { id: 'init', conditions: [] },
            { id: 'analyze', conditions: [] },
            { id: 'generate', conditions: [] },
            { id: 'review', conditions: [] },
            { id: 'test', conditions: [{ type: 'ai_approval', threshold: 70 }] },
            { id: 'commit', conditions: [{ type: 'previous_success', stepId: 'test' }] }
        ],
        rollbackStrategy: 'checkpoint'
    },
    thorough: {
        name: 'Thorough Review',
        description: 'Comprehensive workflow with security checks',
        steps: [
            { id: 'init', conditions: [] },
            { id: 'analyze', conditions: [] },
            { id: 'security', conditions: [] },
            { id: 'generate', conditions: [{ type: 'security_pass' }] },
            { id: 'review', conditions: [] },
            { id: 'test', conditions: [{ type: 'ai_approval', threshold: 80 }] },
            { id: 'docs', conditions: [{ type: 'previous_success', stepId: 'test' }] },
            { id: 'commit', conditions: [] },
            { id: 'merge', conditions: [{ type: 'branch', operator: 'not_equals', value: 'main' }] }
        ],
        rollbackStrategy: 'full'
    },
    full_deployment: {
        name: 'Full Deployment',
        description: 'End-to-end from code to production',
        steps: [
            { id: 'init', conditions: [] },
            { id: 'analyze', conditions: [] },
            { id: 'security', conditions: [] },
            { id: 'generate', conditions: [{ type: 'security_pass' }] },
            { id: 'review', conditions: [] },
            { id: 'test', conditions: [{ type: 'ai_approval', threshold: 85 }] },
            { id: 'lint', conditions: [] },
            { id: 'docs', conditions: [] },
            { id: 'commit', conditions: [{ type: 'all_tests_pass' }] },
            { id: 'merge', conditions: [] },
            { id: 'build', conditions: [{ type: 'previous_success', stepId: 'merge' }] },
            { id: 'stage', conditions: [{ type: 'previous_success', stepId: 'build' }] },
            { id: 'production', conditions: [{ type: 'manual_approval' }, { type: 'staging_healthy', duration: 300 }] },
            { id: 'notify', conditions: [] }
        ],
        rollbackStrategy: 'full'
    }
};

const statusColors = {
    pending: 'bg-slate-700 border-slate-600',
    running: 'bg-blue-500/20 border-blue-500/50',
    completed: 'bg-green-500/20 border-green-500/50',
    failed: 'bg-red-500/20 border-red-500/50',
    skipped: 'bg-yellow-500/20 border-yellow-500/50',
    rolled_back: 'bg-orange-500/20 border-orange-500/50',
    waiting: 'bg-purple-500/20 border-purple-500/50'
};

const categoryColors = {
    setup: 'text-slate-400',
    analysis: 'text-blue-400',
    implementation: 'text-cyan-400',
    review: 'text-purple-400',
    testing: 'text-green-400',
    docs: 'text-yellow-400',
    vcs: 'text-orange-400',
    deployment: 'text-red-400',
    misc: 'text-slate-400'
};

function ConditionBadge({ condition }) {
    const conditionLabels = {
        previous_success: 'After Success',
        ai_approval: `AI Score ≥${condition.threshold}`,
        security_pass: 'Security Pass',
        all_tests_pass: 'All Tests Pass',
        manual_approval: 'Manual Approval',
        staging_healthy: `Staging OK (${condition.duration}s)`,
        branch: `Branch ${condition.operator} ${condition.value}`
    };

    return (
        <Badge variant="outline" className="text-[9px] h-4 border-slate-600 bg-slate-800/50">
            {conditionLabels[condition.type] || condition.type}
        </Badge>
    );
}

function StepNode({ step, stepConfig, status, isActive, stepData, onRetry, conditions, isBranching }) {
    const [expanded, setExpanded] = useState(false);
    const config = allStepConfigs[step];
    const Icon = config?.icon || Settings;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative"
        >
            {/* Branching indicator */}
            {isBranching && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                    <Split className="w-4 h-4 text-purple-400" />
                </div>
            )}

            <div className={cn(
                "relative p-3 rounded-lg border transition-all",
                statusColors[status] || statusColors.pending,
                isActive && "ring-2 ring-cyan-500/50"
            )}>
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        status === 'completed' ? 'bg-green-500/20' :
                        status === 'failed' ? 'bg-red-500/20' :
                        status === 'rolled_back' ? 'bg-orange-500/20' :
                        status === 'running' ? 'bg-blue-500/20' :
                        status === 'waiting' ? 'bg-purple-500/20' :
                        'bg-slate-800'
                    )}>
                        {status === 'running' ? (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : status === 'failed' ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                        ) : status === 'rolled_back' ? (
                            <Undo2 className="w-5 h-5 text-orange-400" />
                        ) : status === 'waiting' ? (
                            <Clock className="w-5 h-5 text-purple-400" />
                        ) : (
                            <Icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : categoryColors[config?.category] || "text-slate-500")} />
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-medium text-sm",
                                status === 'completed' ? 'text-green-400' :
                                status === 'failed' ? 'text-red-400' :
                                status === 'rolled_back' ? 'text-orange-400' :
                                isActive ? 'text-white' : 'text-slate-400'
                            )}>
                                {config?.label}
                            </span>
                            {stepData?.duration && (
                                <Badge variant="outline" className="text-[10px] h-4 border-slate-600">
                                    {stepData.duration}ms
                                </Badge>
                            )}
                            {status === 'waiting' && (
                                <Badge className="text-[10px] h-4 bg-purple-500/20 text-purple-400">
                                    Awaiting condition
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{config?.description}</p>
                        
                        {/* Conditions */}
                        {conditions && conditions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {conditions.map((cond, idx) => (
                                    <ConditionBadge key={idx} condition={cond} />
                                ))}
                            </div>
                        )}

                        {/* Step output */}
                        {stepData?.output && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                            >
                                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                Output
                            </button>
                        )}
                        <AnimatePresence>
                            {expanded && stepData?.output && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-800/50 rounded font-mono whitespace-pre-wrap">
                                        {stepData.output}
                                    </pre>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {status === 'failed' && onRetry && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onRetry(step)}>
                            <RotateCcw className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function WorkflowConnector({ isActive, hasBranch }) {
    return (
        <div className="flex items-center justify-center py-1 pl-5">
            <motion.div 
                className={cn(
                    "w-0.5 h-6 rounded-full transition-colors",
                    isActive ? "bg-cyan-500" : "bg-slate-700"
                )}
                animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
            />
        </div>
    );
}

function TemplateEditor({ template, onSave, onClose }) {
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [steps, setSteps] = useState(template?.steps || []);
    const [rollbackStrategy, setRollbackStrategy] = useState(template?.rollbackStrategy || 'step');

    const addStep = (stepId) => {
        setSteps([...steps, { id: stepId, conditions: [] }]);
    };

    const removeStep = (index) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const moveStep = (index, direction) => {
        const newSteps = [...steps];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newSteps.length) {
            [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
            setSteps(newSteps);
        }
    };

    const addCondition = (stepIndex, conditionType) => {
        const newSteps = [...steps];
        const condition = { type: conditionType };
        if (conditionType === 'ai_approval') condition.threshold = 70;
        if (conditionType === 'staging_healthy') condition.duration = 300;
        if (conditionType === 'previous_success') condition.stepId = steps[stepIndex - 1]?.id;
        newSteps[stepIndex].conditions = [...(newSteps[stepIndex].conditions || []), condition];
        setSteps(newSteps);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Template Name</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Custom Workflow"
                        className="bg-slate-800 border-slate-700"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Rollback Strategy</label>
                    <Select value={rollbackStrategy} onValueChange={setRollbackStrategy}>
                        <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                            <SelectItem value="none">No Rollback</SelectItem>
                            <SelectItem value="step">Rollback Failed Step</SelectItem>
                            <SelectItem value="checkpoint">Rollback to Checkpoint</SelectItem>
                            <SelectItem value="full">Full Rollback</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this workflow does..."
                    className="bg-slate-800 border-slate-700 h-16"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-500">Workflow Steps</label>
                    <Select onValueChange={addStep}>
                        <SelectTrigger className="w-40 h-7 text-xs bg-slate-800 border-slate-700">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Step
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                            {Object.entries(allStepConfigs).map(([key, config]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                    {config.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <ScrollArea className="h-48 border border-slate-700 rounded-lg p-2">
                    <div className="space-y-2">
                        {steps.map((step, idx) => {
                            const config = allStepConfigs[step.id];
                            const Icon = config?.icon || Settings;
                            return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                                    <Icon className={cn("w-4 h-4", categoryColors[config?.category])} />
                                    <span className="text-sm text-white flex-1">{config?.label}</span>
                                    <Select onValueChange={(v) => addCondition(idx, v)}>
                                        <SelectTrigger className="w-24 h-6 text-[10px] bg-slate-700 border-slate-600">
                                            + Condition
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-700">
                                            <SelectItem value="previous_success">After Success</SelectItem>
                                            <SelectItem value="ai_approval">AI Approval</SelectItem>
                                            <SelectItem value="security_pass">Security Pass</SelectItem>
                                            <SelectItem value="all_tests_pass">All Tests Pass</SelectItem>
                                            <SelectItem value="manual_approval">Manual Approval</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(idx, 'up')} disabled={idx === 0}>
                                        <ChevronRight className="w-3 h-3 -rotate-90" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(idx, 'down')} disabled={idx === steps.length - 1}>
                                        <ChevronRight className="w-3 h-3 rotate-90" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeStep(idx)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} className="border-slate-700">Cancel</Button>
                <Button onClick={() => onSave({ name, description, steps, rollbackStrategy })} className="bg-cyan-600 hover:bg-cyan-500">
                    <Save className="w-3 h-3 mr-1" />
                    Save Template
                </Button>
            </div>
        </div>
    );
}

function RollbackPanel({ stepHistory, onRollback, rollbackStrategy }) {
    const checkpoints = stepHistory.filter(s => s.status === 'completed');
    
    return (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
                <Undo2 className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">Rollback Options</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Strategy: {rollbackStrategy}</p>
            <div className="space-y-1">
                {checkpoints.map((step, idx) => (
                    <button
                        key={idx}
                        onClick={() => onRollback(step.id)}
                        className="w-full flex items-center gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-800 text-xs text-left"
                    >
                        <History className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300">Rollback to: {allStepConfigs[step.id]?.label}</span>
                        <span className="text-slate-500 ml-auto">{step.timestamp}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function DeploymentStatus({ stage, health, url }) {
    return (
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {stage === 'production' ? (
                        <Rocket className="w-4 h-4 text-green-400" />
                    ) : (
                        <Server className="w-4 h-4 text-yellow-400" />
                    )}
                    <span className="text-sm font-medium text-white capitalize">{stage}</span>
                </div>
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    health === 'healthy' ? 'bg-green-400' : health === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                )} />
            </div>
            {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {url}
                </a>
            )}
        </div>
    );
}

export default function WorkflowOrchestrator({ task, project, onComplete, onStepComplete }) {
    const [templates, setTemplates] = useState(defaultTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    const [customTemplates, setCustomTemplates] = useState({});
    const [status, setStatus] = useState('idle');
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [stepStatuses, setStepStatuses] = useState({});
    const [stepData, setStepData] = useState({});
    const [stepHistory, setStepHistory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showRollback, setShowRollback] = useState(false);
    const [manualApprovalNeeded, setManualApprovalNeeded] = useState(null);
    const [aiAnalysisResults, setAiAnalysisResults] = useState({});
    const [deploymentInfo, setDeploymentInfo] = useState({});

    const allTemplates = { ...templates, ...customTemplates };
    const workflow = allTemplates[selectedTemplate];
    const steps = workflow?.steps || [];
    const completedSteps = Object.values(stepStatuses).filter(s => s === 'completed').length;
    const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev.slice(-50), { time, message, type }]);
    };

    const updateStepStatus = (stepId, newStatus, data = {}) => {
        setStepStatuses(prev => ({ ...prev, [stepId]: newStatus }));
        setStepData(prev => ({ ...prev, [stepId]: { ...prev[stepId], ...data } }));
        if (newStatus === 'completed') {
            setStepHistory(prev => [...prev, { id: stepId, status: newStatus, timestamp: new Date().toLocaleTimeString() }]);
        }
    };

    const evaluateConditions = async (conditions, stepIndex) => {
        if (!conditions || conditions.length === 0) return true;

        for (const condition of conditions) {
            switch (condition.type) {
                case 'previous_success':
                    const prevStepId = condition.stepId || steps[stepIndex - 1]?.id;
                    if (stepStatuses[prevStepId] !== 'completed') return false;
                    break;
                case 'ai_approval':
                    const score = aiAnalysisResults.reviewScore || 0;
                    if (score < (condition.threshold || 70)) {
                        addLog(`AI approval score ${score} below threshold ${condition.threshold}`, 'warning');
                        return false;
                    }
                    break;
                case 'security_pass':
                    if (aiAnalysisResults.securityIssues > 0) {
                        addLog(`Security scan found ${aiAnalysisResults.securityIssues} issues`, 'warning');
                        return false;
                    }
                    break;
                case 'all_tests_pass':
                    if (!aiAnalysisResults.allTestsPassed) {
                        addLog('Not all tests passed', 'warning');
                        return false;
                    }
                    break;
                case 'manual_approval':
                    setManualApprovalNeeded(stepIndex);
                    updateStepStatus(steps[stepIndex].id, 'waiting');
                    return 'waiting';
                case 'staging_healthy':
                    if (deploymentInfo.staging?.health !== 'healthy') {
                        addLog('Staging environment not healthy', 'warning');
                        return false;
                    }
                    break;
            }
        }
        return true;
    };

    const executeStep = async (stepConfig, index) => {
        const stepId = stepConfig.id;
        const config = allStepConfigs[stepId];
        
        // Check conditions first
        const conditionResult = await evaluateConditions(stepConfig.conditions, index);
        if (conditionResult === 'waiting') return 'waiting';
        if (conditionResult === false) {
            addLog(`Conditions not met for ${config.label}, skipping`, 'warning');
            updateStepStatus(stepId, 'skipped');
            return 'skipped';
        }

        updateStepStatus(stepId, 'running');
        addLog(`Starting: ${config.label}`, 'info');
        const startTime = Date.now();

        try {
            await new Promise(resolve => setTimeout(resolve, config.duration + Math.random() * 500));

            // Generate step-specific output and update analysis results
            let output = '';
            switch (stepId) {
                case 'init':
                    output = 'Environment initialized successfully\nNode.js v18.17.0\nnpm v9.6.7';
                    break;
                case 'analyze':
                    output = `Analyzed ${Object.keys(project?.file_contents || {}).length} files\nComplexity: Medium\nDependencies: 24`;
                    setAiAnalysisResults(prev => ({ ...prev, analyzed: true }));
                    break;
                case 'security':
                    const issues = Math.random() > 0.8 ? 1 : 0;
                    output = issues > 0 ? `Found ${issues} security issue(s)` : 'No security vulnerabilities found';
                    setAiAnalysisResults(prev => ({ ...prev, securityIssues: issues }));
                    break;
                case 'generate':
                    output = `Generated changes for ${task?.files_affected?.length || 3} files\n+142 lines, -38 lines`;
                    break;
                case 'review':
                    const score = 75 + Math.floor(Math.random() * 20);
                    output = `AI Review Score: ${score}/100\nCode quality: Good\nMaintainability: High`;
                    setAiAnalysisResults(prev => ({ ...prev, reviewScore: score }));
                    break;
                case 'test':
                    const passed = Math.random() > 0.1;
                    output = passed ? 'All tests passed (24/24)\nCoverage: 87.5%' : 'Tests failed: 2 failures';
                    setAiAnalysisResults(prev => ({ ...prev, allTestsPassed: passed }));
                    if (!passed) throw new Error('Tests failed');
                    break;
                case 'lint':
                    output = 'Linting passed\n0 errors, 2 warnings';
                    break;
                case 'docs':
                    output = 'Documentation updated\nREADME.md, CHANGELOG.md';
                    break;
                case 'commit':
                    output = `Committed: ${task?.title || 'Changes'}\nHash: ${Math.random().toString(36).substr(2, 7)}`;
                    break;
                case 'merge':
                    output = 'Merged to main branch\nNo conflicts';
                    break;
                case 'build':
                    output = 'Build successful\nBundle size: 245KB (gzip: 78KB)\nBuild time: 12.3s';
                    break;
                case 'stage':
                    output = 'Deployed to staging\nURL: https://staging.example.com';
                    setDeploymentInfo(prev => ({ ...prev, staging: { health: 'healthy', url: 'https://staging.example.com' } }));
                    break;
                case 'production':
                    output = 'Deployed to production\nURL: https://example.com';
                    setDeploymentInfo(prev => ({ ...prev, production: { health: 'healthy', url: 'https://example.com' } }));
                    break;
                case 'notify':
                    output = 'Notifications sent\nSlack: #deployments\nEmail: team@example.com';
                    break;
            }

            const duration = Date.now() - startTime;
            updateStepStatus(stepId, 'completed', { duration, output });
            addLog(`Completed: ${config.label} (${duration}ms)`, 'success');
            onStepComplete?.(stepId, { status: 'completed', duration, output });
            return 'completed';

        } catch (error) {
            updateStepStatus(stepId, 'failed', { error: error.message });
            addLog(`Failed: ${config.label} - ${error.message}`, 'error');
            return 'failed';
        }
    };

    const performRollback = async (toStepId) => {
        addLog(`Initiating rollback to ${allStepConfigs[toStepId]?.label}...`, 'warning');
        setShowRollback(false);

        const rollbackIndex = steps.findIndex(s => s.id === toStepId);
        for (let i = steps.length - 1; i > rollbackIndex; i--) {
            const step = steps[i];
            if (stepStatuses[step.id] === 'completed') {
                updateStepStatus(step.id, 'rolled_back');
                addLog(`Rolled back: ${allStepConfigs[step.id]?.label}`, 'warning');
                await new Promise(r => setTimeout(r, 300));
            }
        }
        addLog('Rollback complete', 'success');
    };

    const startWorkflow = async () => {
        setStatus('running');
        setStepStatuses({});
        setStepData({});
        setStepHistory([]);
        setLogs([]);
        setAiAnalysisResults({});
        setDeploymentInfo({});
        addLog(`Starting workflow: ${workflow.name}`, 'info');

        for (let i = 0; i < steps.length; i++) {
            if (status === 'paused') {
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (status !== 'paused') {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                });
            }

            setCurrentStepIndex(i);
            const result = await executeStep(steps[i], i);
            
            if (result === 'waiting') {
                return; // Wait for manual approval
            }
            
            if (result === 'failed') {
                setStatus('failed');
                if (workflow.rollbackStrategy !== 'none') {
                    setShowRollback(true);
                }
                return;
            }
        }

        setStatus('completed');
        setCurrentStepIndex(-1);
        addLog('Workflow completed successfully! 🎉', 'success');
        onComplete?.();
    };

    const approveManualStep = () => {
        if (manualApprovalNeeded !== null) {
            const stepIndex = manualApprovalNeeded;
            setManualApprovalNeeded(null);
            // Continue from where we left off
            continueFromStep(stepIndex);
        }
    };

    const continueFromStep = async (fromIndex) => {
        setStatus('running');
        for (let i = fromIndex; i < steps.length; i++) {
            setCurrentStepIndex(i);
            const result = await executeStep(steps[i], i);
            if (result === 'waiting') return;
            if (result === 'failed') {
                setStatus('failed');
                if (workflow.rollbackStrategy !== 'none') setShowRollback(true);
                return;
            }
        }
        setStatus('completed');
        setCurrentStepIndex(-1);
        addLog('Workflow completed successfully! 🎉', 'success');
        onComplete?.();
    };

    const saveCustomTemplate = (templateData) => {
        const key = templateData.name.toLowerCase().replace(/\s+/g, '_');
        setCustomTemplates(prev => ({ ...prev, [key]: templateData }));
        setShowTemplateEditor(false);
        setEditingTemplate(null);
        addLog(`Template "${templateData.name}" saved`, 'success');
    };

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Workflow className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-medium text-white">Workflow Orchestrator</h3>
                        {status === 'running' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-slate-700">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Custom
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create Custom Workflow</DialogTitle>
                                </DialogHeader>
                                <TemplateEditor
                                    template={editingTemplate}
                                    onSave={saveCustomTemplate}
                                    onClose={() => setShowTemplateEditor(false)}
                                />
                            </DialogContent>
                        </Dialog>
                        {status === 'idle' && (
                            <Button onClick={startWorkflow} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
                                <Play className="w-3 h-3 mr-1" />
                                Start
                            </Button>
                        )}
                        {status === 'running' && (
                            <>
                                <Button onClick={() => setStatus('paused')} variant="outline" size="sm" className="border-slate-700">
                                    <Pause className="w-3 h-3 mr-1" />
                                    Pause
                                </Button>
                                <Button onClick={() => {
                                    if (currentStepIndex < steps.length - 1) {
                                        updateStepStatus(steps[currentStepIndex].id, 'skipped');
                                        setCurrentStepIndex(prev => prev + 1);
                                    }
                                }} variant="outline" size="sm" className="border-slate-700">
                                    <SkipForward className="w-3 h-3 mr-1" />
                                    Skip
                                </Button>
                            </>
                        )}
                        {status === 'paused' && (
                            <Button onClick={() => setStatus('running')} size="sm" className="bg-green-600 hover:bg-green-500">
                                <Play className="w-3 h-3 mr-1" />
                                Resume
                            </Button>
                        )}
                        {(status === 'completed' || status === 'failed') && (
                            <Button onClick={() => {
                                setStatus('idle');
                                setCurrentStepIndex(-1);
                                setStepStatuses({});
                                setStepData({});
                            }} variant="outline" size="sm" className="border-slate-700">
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Template Selector */}
                <div className="flex gap-2 flex-wrap mb-3">
                    {Object.entries(allTemplates).map(([key, template]) => (
                        <TooltipProvider key={key}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => status === 'idle' && setSelectedTemplate(key)}
                                        disabled={status !== 'idle'}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs transition-colors",
                                            selectedTemplate === key
                                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600",
                                            status !== 'idle' && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {template.name}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-900 border-slate-700">
                                    <p className="text-xs max-w-48">{template.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>

                {/* Progress */}
                {status !== 'idle' && (
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress • {workflow.rollbackStrategy} rollback</span>
                            <span className="text-cyan-400">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                    </div>
                )}
            </div>

            {/* Manual Approval Dialog */}
            {manualApprovalNeeded !== null && (
                <div className="p-4 bg-purple-500/10 border-b border-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-400">Manual approval required for: {allStepConfigs[steps[manualApprovalNeeded]?.id]?.label}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => {
                                updateStepStatus(steps[manualApprovalNeeded].id, 'skipped');
                                setManualApprovalNeeded(null);
                                continueFromStep(manualApprovalNeeded + 1);
                            }} variant="outline" size="sm" className="border-slate-700">
                                Skip
                            </Button>
                            <Button onClick={approveManualStep} size="sm" className="bg-purple-600 hover:bg-purple-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approve
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deployment Status */}
            {(deploymentInfo.staging || deploymentInfo.production) && (
                <div className="p-4 border-b border-slate-700/50 grid grid-cols-2 gap-3">
                    {deploymentInfo.staging && (
                        <DeploymentStatus stage="staging" health={deploymentInfo.staging.health} url={deploymentInfo.staging.url} />
                    )}
                    {deploymentInfo.production && (
                        <DeploymentStatus stage="production" health={deploymentInfo.production.health} url={deploymentInfo.production.url} />
                    )}
                </div>
            )}

            {/* Steps */}
            <div className="p-4">
                <ScrollArea className="max-h-72">
                    <div className="space-y-1">
                        {steps.map((step, index) => (
                            <React.Fragment key={`${step.id}-${index}`}>
                                <StepNode
                                    step={step.id}
                                    stepConfig={step}
                                    status={stepStatuses[step.id] || 'pending'}
                                    isActive={currentStepIndex === index}
                                    stepData={stepData[step.id]}
                                    conditions={step.conditions}
                                    isBranching={step.conditions?.length > 0}
                                    onRetry={() => continueFromStep(index)}
                                />
                                {index < steps.length - 1 && (
                                    <WorkflowConnector isActive={currentStepIndex === index} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Rollback Panel */}
            {showRollback && (
                <div className="p-4 border-t border-slate-700/50">
                    <RollbackPanel
                        stepHistory={stepHistory}
                        onRollback={performRollback}
                        rollbackStrategy={workflow.rollbackStrategy}
                    />
                </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
                <div className="border-t border-slate-700/50 p-3 bg-slate-950/50">
                    <p className="text-xs text-slate-500 mb-2">Execution Logs</p>
                    <ScrollArea className="max-h-24">
                        <div className="space-y-1 font-mono text-xs">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-600">[{log.time}]</span>
                                    <span className={cn(
                                        log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                        log.type === 'warning' ? 'text-yellow-400' :
                                        'text-slate-400'
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}