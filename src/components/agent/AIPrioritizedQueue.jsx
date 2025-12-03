import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/services/aiService';
import {
    Sparkles,
    GripVertical,
    Zap,
    Bug,
    RefreshCw,
    TestTube,
    FileText,
    Shield,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Loader2,
    BarChart3,
    ArrowUpDown,
    Lock,
    Unlock,
    Target,
    TrendingUp,
    Brain,
    CheckCircle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';

const categoryConfig = {
    feature: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    bugfix: { icon: Bug, color: 'text-red-400', bg: 'bg-red-500/20' },
    refactor: { icon: RefreshCw, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    test: { icon: TestTube, color: 'text-green-400', bg: 'bg-green-500/20' },
    documentation: { icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    security: { icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/20' }
};

const priorityColors = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-orange-500/50 bg-orange-500/10',
    medium: 'border-yellow-500/50 bg-yellow-500/10',
    low: 'border-slate-600/50 bg-slate-800/50'
};

function TaskQueueItem({ task, index, aiScore, reasoning, isLocked, onLock, onMoveUp, onMoveDown, isFirst, isLast }) {
    const [showReasoning, setShowReasoning] = useState(false);
    const category = categoryConfig[task.category] || categoryConfig.feature;
    const Icon = category.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
                "relative p-3 rounded-lg border transition-all",
                priorityColors[task.priority] || priorityColors.medium,
                isLocked && "ring-2 ring-cyan-500/30"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle & Position */}
                <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-cyan-500 text-white" : "bg-slate-700 text-slate-400"
                    )}>
                        {index + 1}
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn("p-1.5 rounded", category.bg)}>
                            <Icon className={cn("w-3 h-3", category.color)} />
                        </div>
                        <span className="font-medium text-sm text-white truncate">{task.title}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-4 border-slate-600">
                            {task.priority}
                        </Badge>
                        {task.estimated_effort && (
                            <Badge variant="outline" className="text-[10px] h-4 border-slate-600">
                                {task.estimated_effort}
                            </Badge>
                        )}
                        {task.files_affected?.length > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4 border-slate-600">
                                {task.files_affected.length} files
                            </Badge>
                        )}
                    </div>

                    {/* AI Reasoning Toggle */}
                    {reasoning && (
                        <button
                            onClick={() => setShowReasoning(!showReasoning)}
                            className="flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                            <Brain className="w-3 h-3" />
                            AI Reasoning
                            {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    )}
                    
                    <AnimatePresence>
                        {showReasoning && reasoning && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-xs text-slate-400 mt-2 p-2 bg-slate-800/50 rounded">
                                    {reasoning}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* AI Score & Actions */}
                <div className="flex flex-col items-end gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-cyan-400" />
                                    <span className="text-sm font-bold text-cyan-400">{aiScore}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700">
                                <p className="text-xs">AI Priority Score</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onLock?.(task.id)}
                        >
                            {isLocked ? (
                                <Lock className="w-3 h-3 text-cyan-400" />
                            ) : (
                                <Unlock className="w-3 h-3 text-slate-500" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onMoveUp?.(task.id)}
                            disabled={isFirst || isLocked}
                        >
                            <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onMoveDown?.(task.id)}
                            disabled={isLast || isLocked}
                        >
                            <ChevronDown className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function PriorityFactors({ factors }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {factors.map((factor, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">{factor.name}</span>
                        <span className="text-xs font-medium text-white">{factor.weight}%</span>
                    </div>
                    <Progress value={factor.weight} className="h-1" />
                </div>
            ))}
        </div>
    );
}

export default function AIPrioritizedQueue({ tasks, project, onOrderChange, onExecute }) {
    const [prioritizedTasks, setPrioritizedTasks] = useState([]);
    const [aiScores, setAiScores] = useState({});
    const [aiReasoning, setAiReasoning] = useState({});
    const [lockedTasks, setLockedTasks] = useState(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showFactors, setShowFactors] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    const priorityFactors = [
        { name: 'Business Impact', weight: 25 },
        { name: 'Technical Debt', weight: 20 },
        { name: 'Dependencies', weight: 20 },
        { name: 'Complexity', weight: 15 },
        { name: 'Risk Level', weight: 10 },
        { name: 'Effort vs Value', weight: 10 }
    ];

    const runAIAnalysis = async () => {
        if (!tasks || tasks.length === 0) return;
        
        setIsAnalyzing(true);
        setAnalysisComplete(false);

        try {
            const taskSummaries = tasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                category: t.category,
                priority: t.priority,
                effort: t.estimated_effort,
                files: t.files_affected?.length || 0
            }));

            const result = await InvokeLLM({
                prompt: `You are a senior software architect. Analyze these tasks and prioritize them for optimal execution order.

PROJECT: ${project?.name || 'Unknown'}
STACK: ${JSON.stringify(project?.detected_stack || {})}

TASKS:
${JSON.stringify(taskSummaries, null, 2)}

Consider these factors:
1. Business Impact (25%): How much value does this deliver?
2. Technical Debt (20%): Does this reduce debt or create more?
3. Dependencies (20%): Are other tasks blocked by this?
4. Complexity (15%): How complex is the implementation?
5. Risk Level (10%): What could go wrong?
6. Effort vs Value (10%): Is the effort worth the outcome?

For each task, provide:
- A priority score from 0-100
- Brief reasoning (1-2 sentences)
- Suggested execution order

Return optimal order based on maximizing value while minimizing risk.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        prioritized_tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    id: { type: "string" },
                                    score: { type: "number" },
                                    reasoning: { type: "string" },
                                    dependencies: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                }
                            }
                        },
                        overall_strategy: { type: "string" }
                    }
                }
            });

            // Build scores and reasoning maps
            const scores = {};
            const reasoning = {};
            const orderedIds = [];

            result.prioritized_tasks.forEach(item => {
                scores[item.id] = item.score;
                reasoning[item.id] = item.reasoning;
                orderedIds.push(item.id);
            });

            setAiScores(scores);
            setAiReasoning(reasoning);

            // Reorder tasks based on AI suggestion, respecting locked tasks
            const newOrder = [];
            const lockedTasksArray = [];
            const unlockedTasksArray = [];

            tasks.forEach(task => {
                if (lockedTasks.has(task.id)) {
                    lockedTasksArray.push(task);
                } else {
                    unlockedTasksArray.push(task);
                }
            });

            // Sort unlocked tasks by AI score
            unlockedTasksArray.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

            // Merge back, keeping locked tasks in their original positions
            let unlockedIdx = 0;
            tasks.forEach((task, idx) => {
                if (lockedTasks.has(task.id)) {
                    newOrder.push(task);
                } else {
                    newOrder.push(unlockedTasksArray[unlockedIdx]);
                    unlockedIdx++;
                }
            });

            setPrioritizedTasks(newOrder);
            setAnalysisComplete(true);
            onOrderChange?.(newOrder);

        } catch (error) {
            console.error('AI Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (tasks && tasks.length > 0 && prioritizedTasks.length === 0) {
            setPrioritizedTasks(tasks);
        }
    }, [tasks]);

    const toggleLock = (taskId) => {
        setLockedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const moveTask = (taskId, direction) => {
        const idx = prioritizedTasks.findIndex(t => t.id === taskId);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= prioritizedTasks.length) return;

        const newOrder = [...prioritizedTasks];
        [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
        setPrioritizedTasks(newOrder);
        onOrderChange?.(newOrder);
    };

    const totalScore = Object.values(aiScores).reduce((sum, s) => sum + s, 0);
    const avgScore = Object.keys(aiScores).length > 0 ? Math.round(totalScore / Object.keys(aiScores).length) : 0;

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                            <Brain className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">AI Task Prioritization</h3>
                            <p className="text-xs text-slate-500">{prioritizedTasks.length} tasks in queue</p>
                        </div>
                    </div>
                    <Button
                        onClick={runAIAnalysis}
                        disabled={isAnalyzing || !tasks || tasks.length === 0}
                        size="sm"
                        className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                {analysisComplete ? 'Re-analyze' : 'Analyze'}
                            </>
                        )}
                    </Button>
                </div>

                {/* Stats */}
                {analysisComplete && (
                    <div className="flex items-center gap-4 p-2 rounded-lg bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-slate-400">Avg Score:</span>
                            <span className="text-sm font-bold text-cyan-400">{avgScore}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-400">Locked:</span>
                            <span className="text-sm font-bold text-white">{lockedTasks.size}</span>
                        </div>
                        <button
                            onClick={() => setShowFactors(!showFactors)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white ml-auto"
                        >
                            <BarChart3 className="w-3 h-3" />
                            Factors
                            {showFactors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>
                )}

                {/* Priority Factors */}
                <AnimatePresence>
                    {showFactors && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                        >
                            <PriorityFactors factors={priorityFactors} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Task Queue */}
            <ScrollArea className="max-h-96">
                <div className="p-4 space-y-2">
                    {prioritizedTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No tasks to prioritize</p>
                            <p className="text-xs mt-1">Add pending tasks to get AI recommendations</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {prioritizedTasks.map((task, idx) => (
                                <TaskQueueItem
                                    key={task.id}
                                    task={task}
                                    index={idx}
                                    aiScore={aiScores[task.id] || '-'}
                                    reasoning={aiReasoning[task.id]}
                                    isLocked={lockedTasks.has(task.id)}
                                    onLock={toggleLock}
                                    onMoveUp={() => moveTask(task.id, 'up')}
                                    onMoveDown={() => moveTask(task.id, 'down')}
                                    isFirst={idx === 0}
                                    isLast={idx === prioritizedTasks.length - 1}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </ScrollArea>

            {/* Execute Button */}
            {prioritizedTasks.length > 0 && (
                <div className="p-4 border-t border-slate-700/50">
                    <Button
                        onClick={() => onExecute?.(prioritizedTasks)}
                        className="w-full bg-green-600 hover:bg-green-500"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        Execute in Priority Order ({prioritizedTasks.length} tasks)
                    </Button>
                </div>
            )}
        </div>
    );
}