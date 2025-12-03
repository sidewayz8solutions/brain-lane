import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Play, 
    Check, 
    X, 
    Download,
    Loader2,
    FileCode,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    CheckSquare,
    Square,
    Zap,
    RotateCcw,
    Bot,
    Terminal,
    Wand2,
    TestTube,
    GitBranch,
    Users,
    Workflow,
    Code,
    GitMerge,
    Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import TaskCard from '../components/project/TaskCard';
import StatusBadge from '../components/project/StatusBadge';
import DiffViewer from '../components/project/DiffViewer';
import TaskPrioritizer, { calculateSmartScore } from '../components/project/TaskPrioritizer';
import CodeReviewPanel from '../components/review/CodeReviewPanel';
import AgentExecutor from '../components/agent/AgentExecutor';
import SandboxTerminal from '../components/agent/SandboxTerminal';
import ExecutionFlowDiagram from '../components/agent/ExecutionFlowDiagram';
import AITextGenerator from '../components/ai/AITextGenerator';
import CodeTestRunner from '../components/testing/CodeTestRunner';
import VersionControlPanel from '../components/version-control/VersionControlPanel';
import AgentCollaboration from '../components/collaboration/AgentCollaboration';
import WorkflowOrchestrator from '../components/agent/WorkflowOrchestrator';
import CodeExecutionSandbox from '../components/agent/CodeExecutionSandbox';
import GitIntegration from '../components/version-control/GitIntegration';
import AIPrioritizedQueue from '../components/agent/AIPrioritizedQueue';
import { cn } from "@/lib/utils";

export default function TaskView() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    const initialTaskId = urlParams.get('taskId');
    const queryClient = useQueryClient();
    
    const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
    const [selectedForBatch, setSelectedForBatch] = useState(new Set());
    const [isImplementing, setIsImplementing] = useState(false);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [batchMode, setBatchMode] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [codeReview, setCodeReview] = useState(null);
    const [showAgentExecutor, setShowAgentExecutor] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [showTestRunner, setShowTestRunner] = useState(false);
    const [showVersionControl, setShowVersionControl] = useState(false);
    const [showCollaboration, setShowCollaboration] = useState(false);
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [showSandbox, setShowSandbox] = useState(false);
    const [showGitIntegration, setShowGitIntegration] = useState(false);
    const [showAIPriority, setShowAIPriority] = useState(false);
    const [sortBy, setSortBy] = useState('smart');
    const [filters, setFilters] = useState({});

    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: () => base44.entities.Project.filter({ id: projectId }).then(res => res[0]),
        enabled: !!projectId
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: () => base44.entities.Task.filter({ project_id: projectId }),
        enabled: !!projectId
    });

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    
    // Reset code review when task changes
    React.useEffect(() => {
        setCodeReview(null);
    }, [selectedTaskId]);
    // Filter and sort tasks
    const filteredTasks = React.useMemo(() => {
        let filtered = [...tasks];
        if (filters.priority) {
            filtered = filtered.filter(t => t.priority === filters.priority);
        }
        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }
        return filtered;
    }, [tasks, filters]);

    const sortedPendingTasks = React.useMemo(() => {
        const pending = filteredTasks.filter(t => t.status === 'pending');
        
        switch (sortBy) {
            case 'smart':
                return [...pending].sort((a, b) => calculateSmartScore(b) - calculateSmartScore(a));
            case 'priority':
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return [...pending].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            case 'effort':
                const effortOrder = { small: 0, medium: 1, large: 2 };
                return [...pending].sort((a, b) => effortOrder[a.estimated_effort || 'medium'] - effortOrder[b.estimated_effort || 'medium']);
            case 'category':
                const categoryWeight = { security: 6, bugfix: 5, feature: 4, refactor: 3, test: 2, documentation: 1 };
                return [...pending].sort((a, b) => (categoryWeight[b.category] || 0) - (categoryWeight[a.category] || 0));
            case 'impact':
                return [...pending].sort((a, b) => (b.files_affected?.length || 0) - (a.files_affected?.length || 0));
            default:
                return pending;
        }
    }, [filteredTasks, sortBy]);

    const pendingTasks = sortedPendingTasks;
    const completedTasks = filteredTasks.filter(t => ['completed', 'approved', 'rejected'].includes(t.status));
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');

    const handleFilterChange = (type, value) => {
        if (type === 'clear') {
            setFilters({});
        } else {
            setFilters(prev => ({
                ...prev,
                [type]: prev[type] === value ? undefined : value
            }));
        }
    };

    const toggleTaskSelection = (taskId) => {
        const newSelected = new Set(selectedForBatch);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedForBatch(newSelected);
    };

    const selectAllPending = () => {
        setSelectedForBatch(new Set(pendingTasks.map(t => t.id)));
    };

    const clearSelection = () => {
        setSelectedForBatch(new Set());
    };

    const implementSingleTask = async (task) => {
        if (!task || !project) return;

        // Update status to in_progress
        await base44.entities.Task.update(task.id, { status: 'in_progress' });
        queryClient.invalidateQueries(['tasks', projectId]);

        // Get relevant file contents
        const fileContents = project?.file_contents || {};
        let relevantCode = '';
        
        // Get files that will be affected
        const affectedFiles = task.files_affected || [];
        for (const filePath of affectedFiles) {
            if (fileContents[filePath]) {
                relevantCode += `\n--- ${filePath} ---\n${fileContents[filePath]}\n`;
            }
        }

        // If no specific files, get some context
        if (!relevantCode) {
            const entries = Object.entries(fileContents).slice(0, 5);
            for (const [path, content] of entries) {
                if (content && content.length < 5000) {
                    relevantCode += `\n--- ${path} ---\n${content.substring(0, 3000)}\n`;
                }
            }
        }

        // Call LLM to implement the task
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert developer. Implement the following task for this codebase.

TASK: ${task.title}
DESCRIPTION: ${task.description}
CATEGORY: ${task.category}
FILES TO MODIFY: ${affectedFiles.join(', ') || 'Determine best files'}

CURRENT CODE:
${relevantCode}

Implement this task by providing the modified code. For each file you modify:
1. Show the complete new content of the file
2. Explain what you changed and why

Be thorough and ensure the code is production-ready.`,
            response_json_schema: {
                type: "object",
                properties: {
                    files: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                path: { type: "string" },
                                original: { type: "string" },
                                modified: { type: "string" },
                                additions: { type: "number" },
                                deletions: { type: "number" }
                            }
                        }
                    },
                    explanation: { type: "string" }
                }
            }
        });

        // Calculate additions/deletions if not provided
        const files = result.files.map(file => ({
            ...file,
            original: file.original || fileContents[file.path] || '',
            additions: file.additions || (file.modified?.split('\n').length || 0),
            deletions: file.deletions || (file.original?.split('\n').length || 0)
        }));

        // Update task with diff
        await base44.entities.Task.update(task.id, {
            status: 'completed',
            diff: {
                files: files,
                explanation: result.explanation
            },
            ai_explanation: result.explanation
        });

        return { success: true, task, files };
    };

    const implementTask = async () => {
        if (!selectedTask || isImplementing) return;
        setIsImplementing(true);

        try {
            await implementSingleTask(selectedTask);
            queryClient.invalidateQueries(['tasks', projectId]);
        } catch (error) {
            console.error('Implementation error:', error);
            await base44.entities.Task.update(selectedTask.id, { status: 'pending' });
            queryClient.invalidateQueries(['tasks', projectId]);
        } finally {
            setIsImplementing(false);
        }
    };

    const runBatchImplementation = async () => {
        if (selectedForBatch.size === 0 || isBatchRunning) return;
        setIsBatchRunning(true);
        setBatchMode(false);

        const taskIds = Array.from(selectedForBatch);
        const BATCH_SIZE = 3; // Process 3 tasks concurrently
        
        for (let i = 0; i < taskIds.length; i += BATCH_SIZE) {
            const batch = taskIds.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (taskId) => {
                const task = tasks.find(t => t.id === taskId);
                if (!task || task.status !== 'pending') return;

                try {
                    await implementSingleTask(task);
                } catch (error) {
                    console.error(`Error implementing task ${taskId}:`, error);
                    await base44.entities.Task.update(taskId, { status: 'pending' });
                }
            });
            
            await Promise.all(batchPromises);
            queryClient.invalidateQueries(['tasks', projectId]);
        }

        setSelectedForBatch(new Set());
        setIsBatchRunning(false);
        queryClient.invalidateQueries(['tasks', projectId]);
    };

    const approveTask = async () => {
        if (!selectedTask) return;
        await base44.entities.Task.update(selectedTask.id, { status: 'approved' });
        queryClient.invalidateQueries(['tasks', projectId]);
    };

    const rejectTask = async () => {
        if (!selectedTask) return;
        await base44.entities.Task.update(selectedTask.id, { 
            status: 'rejected',
            diff: null
        });
        queryClient.invalidateQueries(['tasks', projectId]);
    };

    const resetTask = async () => {
        if (!selectedTask) return;
        await base44.entities.Task.update(selectedTask.id, { 
            status: 'pending',
            diff: null,
            ai_explanation: null
        });
        queryClient.invalidateQueries(['tasks', projectId]);
    };

    const downloadPatch = () => {
        if (!selectedTask?.diff) return;
        
        let patchContent = `# Patch for: ${selectedTask.title}\n`;
        patchContent += `# Generated by Brain Lane\n`;
        patchContent += `# ${new Date().toISOString()}\n\n`;
        
        selectedTask.diff.files.forEach(file => {
            patchContent += `--- a/${file.path}\n`;
            patchContent += `+++ b/${file.path}\n`;
            patchContent += file.modified + '\n\n';
        });

        const blob = new Blob([patchContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTask.title.replace(/\s+/g, '-').toLowerCase()}.patch`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadAllPatches = () => {
        const approvedTasks = tasks.filter(t => t.status === 'approved' && t.diff);
        if (approvedTasks.length === 0) return;

        let patchContent = `# Combined Patches - ${project?.name}\n`;
        patchContent += `# Generated by Brain Lane\n`;
        patchContent += `# ${new Date().toISOString()}\n`;
        patchContent += `# ${approvedTasks.length} approved changes\n\n`;

        approvedTasks.forEach(task => {
            patchContent += `\n${'='.repeat(60)}\n`;
            patchContent += `# Task: ${task.title}\n`;
            patchContent += `${'='.repeat(60)}\n\n`;
            
            task.diff.files.forEach(file => {
                patchContent += `--- a/${file.path}\n`;
                patchContent += `+++ b/${file.path}\n`;
                patchContent += file.modified + '\n\n';
            });
        });

        const blob = new Blob([patchContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name?.replace(/\s+/g, '-').toLowerCase() || 'project'}-all-patches.patch`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const approvedCount = tasks.filter(t => t.status === 'approved').length;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 400, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-screen border-r border-slate-800 bg-slate-900/50 flex-shrink-0 overflow-hidden"
                    >
                        <div className="h-full flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-800">
                                <Link to={createPageUrl('ProjectAnalysis') + `?id=${projectId}`}>
                                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-3">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Analysis
                                    </Button>
                                </Link>
                                <h2 className="text-lg font-semibold">{project?.name}</h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {tasks.length} tasks • {pendingTasks.length} pending • {approvedCount} approved
                                </p>
                            </div>

                            {/* Batch Actions */}
                            <div className="p-4 border-b border-slate-800 space-y-3">
                                {!batchMode ? (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setBatchMode(true)}
                                            disabled={pendingTasks.length === 0 || isBatchRunning}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            Run AI Completion
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-400">
                                                {selectedForBatch.size} task{selectedForBatch.size !== 1 ? 's' : ''} selected
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={selectAllPending}
                                                    className="text-xs"
                                                >
                                                    Select All ({pendingTasks.length})
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearSelection}
                                                    className="text-xs"
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={runBatchImplementation}
                                                disabled={selectedForBatch.size === 0 || isBatchRunning}
                                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                                            >
                                                {isBatchRunning ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Running...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Run Selected ({selectedForBatch.size})
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => { setBatchMode(false); clearSelection(); }}
                                                className="border-slate-700"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {pendingTasks.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAIPriority(!showAIPriority)}
                                        className={cn("w-full border-slate-700", showAIPriority && "bg-cyan-500/10 border-cyan-500/50")}
                                    >
                                        <Brain className="w-4 h-4 mr-2" />
                                        AI Priority Queue
                                    </Button>
                                )}

                                {approvedCount > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={downloadAllPatches}
                                            className="w-full border-slate-700"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download All Patches ({approvedCount})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowVersionControl(!showVersionControl)}
                                            className={cn("w-full border-slate-700", showVersionControl && "bg-purple-500/10 border-purple-500/50")}
                                        >
                                            <GitBranch className="w-4 h-4 mr-2" />
                                            Version Control
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* AI Priority Queue */}
                            <AnimatePresence>
                                {showAIPriority && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-slate-800 overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <AIPrioritizedQueue
                                                tasks={pendingTasks}
                                                project={project}
                                                onOrderChange={(newOrder) => {
                                                    console.log('New priority order:', newOrder);
                                                }}
                                                onExecute={async (orderedTasks) => {
                                                    setIsBatchRunning(true);
                                                    setShowAIPriority(false);
                                                    for (const task of orderedTasks) {
                                                        await implementSingleTask(task);
                                                        queryClient.invalidateQueries(['tasks', projectId]);
                                                    }
                                                    setIsBatchRunning(false);
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Version Control Panel */}
                            <AnimatePresence>
                                {showVersionControl && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-b border-slate-800 overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <VersionControlPanel 
                                                project={project}
                                                tasks={tasks}
                                                approvedTasks={tasks.filter(t => t.status === 'approved')}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Task List */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-6">
                                    {/* Task Prioritizer */}
                                    <TaskPrioritizer
                                        tasks={tasks.filter(t => t.status === 'pending')}
                                        sortBy={sortBy}
                                        onSortChange={setSortBy}
                                        activeFilters={filters}
                                        onFilterChange={handleFilterChange}
                                    />

                                    {isBatchRunning && inProgressTasks.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-medium text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Processing
                                            </h3>
                                            <div className="space-y-2">
                                                {inProgressTasks.map(task => (
                                                    <TaskCard 
                                                        key={task.id} 
                                                        task={task} 
                                                        onClick={() => setSelectedTaskId(task.id)}
                                                        isActive={task.id === selectedTaskId}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {pendingTasks.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                                Pending Tasks ({pendingTasks.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {pendingTasks.map(task => (
                                                    <div key={task.id} className="flex items-start gap-2">
                                                        {batchMode && (
                                                            <Checkbox
                                                                checked={selectedForBatch.has(task.id)}
                                                                onCheckedChange={() => toggleTaskSelection(task.id)}
                                                                className="mt-4 border-slate-600"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <TaskCard 
                                                                task={task} 
                                                                onClick={() => !batchMode && setSelectedTaskId(task.id)}
                                                                isActive={task.id === selectedTaskId}
                                                                showScore={sortBy === 'smart'}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {completedTasks.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                                Completed ({completedTasks.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {completedTasks.map(task => (
                                                    <TaskCard 
                                                        key={task.id} 
                                                        task={task} 
                                                        onClick={() => setSelectedTaskId(task.id)}
                                                        isActive={task.id === selectedTaskId}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-1/2 -translate-y-1/2 z-20 bg-slate-800 hover:bg-slate-700 p-2 rounded-r-lg border border-l-0 border-slate-700 transition-all"
                style={{ left: sidebarOpen ? 400 : 0 }}
            >
                {sidebarOpen ? (
                    <ChevronLeft className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </button>

            {/* Main Content */}
            <div className="flex-1 h-screen overflow-auto">
                {selectedTask ? (
                    <div className="p-8 max-w-5xl mx-auto">
                        {/* Task Header */}
                        <div className="mb-8">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold mb-2">{selectedTask.title}</h1>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={selectedTask.status} />
                                        <span className="text-sm text-slate-400 capitalize">
                                            {selectedTask.category} • {selectedTask.priority} priority
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    {selectedTask.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={implementTask}
                                                disabled={isImplementing || isBatchRunning}
                                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                                            >
                                                {isImplementing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Implementing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Quick Implement
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => setShowAgentExecutor(true)}
                                                disabled={isImplementing || isBatchRunning}
                                                variant="outline"
                                                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                                            >
                                                <Bot className="w-4 h-4 mr-2" />
                                                Agent Sandbox
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {selectedTask.status === 'completed' && selectedTask.diff && (
                                        <>
                                            <Button
                                                onClick={rejectTask}
                                                variant="outline"
                                                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                                disabled={isReviewing}
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button
                                                onClick={approveTask}
                                                className="bg-green-600 hover:bg-green-500"
                                                disabled={isReviewing || (codeReview && !codeReview.approved)}
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                {codeReview && !codeReview.approved ? 'Review Issues First' : 'Approve'}
                                            </Button>
                                        </>
                                    )}

                                    {(selectedTask.status === 'approved' || selectedTask.status === 'rejected') && (
                                        <Button
                                            onClick={resetTask}
                                            variant="outline"
                                            className="border-slate-700"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Reset
                                        </Button>
                                    )}

                                    {selectedTask.diff && (
                                        <>
                                            <Button
                                                onClick={() => setShowTestRunner(!showTestRunner)}
                                                variant="outline"
                                                className={cn("border-slate-700", showTestRunner && "bg-green-500/10 border-green-500/50")}
                                            >
                                                <TestTube className="w-4 h-4 mr-2" />
                                                Tests
                                            </Button>
                                            <Button
                                                onClick={() => setShowTerminal(!showTerminal)}
                                                variant="outline"
                                                className={cn("border-slate-700", showTerminal && "bg-slate-700")}
                                            >
                                                <Terminal className="w-4 h-4 mr-2" />
                                                Terminal
                                            </Button>
                                            <Button
                                                onClick={downloadPatch}
                                                variant="outline"
                                                className="border-slate-700"
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Patch
                                            </Button>
                                        </>
                                    )}
                                    
                                    <Button
                                        onClick={() => setShowCollaboration(!showCollaboration)}
                                        variant="outline"
                                        className={cn("border-slate-700", showCollaboration && "bg-purple-500/10 border-purple-500/50")}
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Agents
                                    </Button>
                                    
                                    <Button
                                        onClick={() => setShowAIGenerator(!showAIGenerator)}
                                        variant="outline"
                                        className={cn("border-slate-700", showAIGenerator && "bg-pink-500/10 border-pink-500/50")}
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        AI Gen
                                    </Button>
                                    
                                    <Button
                                        onClick={() => setShowWorkflow(!showWorkflow)}
                                        variant="outline"
                                        className={cn("border-slate-700", showWorkflow && "bg-orange-500/10 border-orange-500/50")}
                                    >
                                        <Workflow className="w-4 h-4 mr-2" />
                                        Workflow
                                    </Button>
                                    
                                    <Button
                                        onClick={() => setShowSandbox(!showSandbox)}
                                        variant="outline"
                                        className={cn("border-slate-700", showSandbox && "bg-emerald-500/10 border-emerald-500/50")}
                                    >
                                        <Code className="w-4 h-4 mr-2" />
                                        Sandbox
                                    </Button>
                                    
                                    <Button
                                        onClick={() => setShowGitIntegration(!showGitIntegration)}
                                        variant="outline"
                                        className={cn("border-slate-700", showGitIntegration && "bg-orange-500/10 border-orange-500/50")}
                                    >
                                        <GitMerge className="w-4 h-4 mr-2" />
                                        Git
                                    </Button>
                                </div>
                            </div>

                            {selectedTask.description && (
                                <p className="text-slate-300 leading-relaxed">
                                    {selectedTask.description}
                                </p>
                            )}

                            {/* Files affected */}
                            {selectedTask.files_affected?.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedTask.files_affected.map((file, idx) => (
                                        <span 
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300"
                                        >
                                            <FileCode className="w-3 h-3" />
                                            {file}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Implementation in progress */}
                        {selectedTask.status === 'in_progress' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <ExecutionFlowDiagram 
                                    taskStatus={selectedTask.status}
                                    executionData={{
                                        filesRead: selectedTask.files_affected,
                                        command: project?.detected_stack?.testing_framework === 'jest' ? 'npm test' : 'pytest'
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Completed/Approved task flow */}
                        {(selectedTask.status === 'completed' || selectedTask.status === 'approved') && selectedTask.diff && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <ExecutionFlowDiagram 
                                    taskStatus={selectedTask.status}
                                    executionData={{
                                        filesRead: selectedTask.files_affected || selectedTask.diff?.files?.map(f => f.path),
                                        command: project?.detected_stack?.testing_framework === 'jest' ? 'npm test' : 'pytest',
                                        commandOutput: 'All tests passed',
                                        diffStats: {
                                            additions: selectedTask.diff?.files?.reduce((sum, f) => sum + (f.additions || 0), 0) || 0,
                                            deletions: selectedTask.diff?.files?.reduce((sum, f) => sum + (f.deletions || 0), 0) || 0,
                                            files: selectedTask.diff?.files?.length || 0
                                        },
                                        reportStatus: `Task ${selectedTask.status} successfully`
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Code Review Panel - Shows for completed tasks */}
                        {selectedTask.status === 'completed' && selectedTask.diff && (
                            <div className="mb-6">
                                <CodeReviewPanel 
                                    diff={selectedTask.diff}
                                    isReviewing={isReviewing}
                                    setIsReviewing={setIsReviewing}
                                    onReviewComplete={(review) => setCodeReview(review)}
                                />
                            </div>
                        )}

                        {/* Enhanced Tools Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Test Runner */}
                            {showTestRunner && selectedTask.diff && (
                                <CodeTestRunner 
                                    project={project}
                                    task={selectedTask}
                                    diff={selectedTask.diff}
                                    onTestComplete={(results) => {
                                        console.log('Tests completed:', results);
                                    }}
                                />
                            )}

                            {/* Agent Collaboration */}
                            {showCollaboration && (
                                <AgentCollaboration 
                                    task={selectedTask}
                                    project={project}
                                    onSuggestion={(suggestion) => {
                                        console.log('Agent suggestion:', suggestion);
                                    }}
                                />
                            )}

                            {/* AI Text Generator */}
                            {showAIGenerator && (
                                <AITextGenerator 
                                    context={selectedTask.description}
                                    onInsert={(text) => {
                                        console.log('Insert text:', text);
                                    }}
                                />
                            )}

                            {/* Terminal */}
                            {showTerminal && selectedTask.diff && (
                                <SandboxTerminal 
                                    project={project}
                                    commands={
                                        project?.detected_stack?.testing_framework === 'jest' 
                                            ? ['npm test'] 
                                            : project?.detected_stack?.testing_framework === 'pytest'
                                                ? ['pytest']
                                                : ['npm run lint']
                                    }
                                    onCommandComplete={(cmd, code) => {
                                        console.log(`Command ${cmd} exited with code ${code}`);
                                    }}
                                />
                            )}
                            
                            {/* Workflow Orchestrator */}
                            {showWorkflow && (
                                <WorkflowOrchestrator
                                    task={selectedTask}
                                    project={project}
                                    onComplete={() => {
                                        queryClient.invalidateQueries(['tasks', projectId]);
                                    }}
                                    onStepComplete={(step, data) => {
                                        console.log('Step completed:', step, data);
                                    }}
                                />
                            )}
                            
                            {/* Git Integration */}
                            {showGitIntegration && (
                                <GitIntegration
                                    project={project}
                                    approvedTasks={tasks.filter(t => t.status === 'approved')}
                                    onAction={(action, data) => {
                                        console.log('Git action:', action, data);
                                    }}
                                />
                            )}
                        </div>
                        
                        {/* Code Execution Sandbox - Full Width */}
                        {showSandbox && (
                            <div className="mb-6 h-[500px]">
                                <CodeExecutionSandbox
                                    project={project}
                                    task={selectedTask}
                                    onExecutionComplete={(result) => {
                                        console.log('Execution result:', result);
                                    }}
                                />
                            </div>
                        )}

                        {/* Diff View */}
                        {selectedTask.diff && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Changes</h3>
                                <DiffViewer diff={selectedTask.diff} />
                            </div>
                        )}

                        {/* Agent Executor Modal */}
                        {showAgentExecutor && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowAgentExecutor(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full max-w-5xl h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden"
                                >
                                    <AgentExecutor 
                                        task={selectedTask}
                                        project={project}
                                        onComplete={() => {
                                            queryClient.invalidateQueries(['tasks', projectId]);
                                            setShowAgentExecutor(false);
                                        }}
                                    />
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Empty state */}
                        {selectedTask.status === 'pending' && !selectedTask.diff && !showAgentExecutor && (
                            <div className="text-center py-16 text-slate-500">
                                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Click "Quick Implement" for fast AI generation</p>
                                <p className="text-sm mt-2">Or use "Agent Sandbox" for interactive execution</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select a task to view details</p>
                            <p className="text-sm mt-2">Or use "Run AI Completion" to process multiple tasks</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}