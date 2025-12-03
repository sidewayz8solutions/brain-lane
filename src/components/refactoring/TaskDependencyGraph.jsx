import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { 
    CheckCircle2, 
    Circle, 
    Clock, 
    Loader2, 
    XCircle,
    ChevronRight,
    ArrowDown,
    Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusConfig = {
    pending: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    in_progress: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', spin: true },
    completed: { icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
    approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
};

const priorityColors = {
    critical: 'from-red-500 to-rose-500',
    high: 'from-orange-500 to-amber-500',
    medium: 'from-blue-500 to-cyan-500',
    low: 'from-slate-500 to-slate-400'
};

function TaskNode({ task, index, isActive, onClick, projectId }) {
    const status = statusConfig[task.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const priority = priorityColors[task.priority] || priorityColors.medium;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            className={cn(
                "relative cursor-pointer transition-all duration-200",
                "hover:scale-105"
            )}
        >
            <div className={cn(
                "p-3 rounded-xl border backdrop-blur-sm",
                status.bg, status.border,
                isActive && "ring-2 ring-cyan-500"
            )}>
                {/* Priority indicator */}
                <div className={cn(
                    "absolute -top-1 -left-1 w-3 h-3 rounded-full bg-gradient-to-br",
                    priority
                )} />
                
                {/* Task number */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-slate-500">#{index + 1}</span>
                    <StatusIcon className={cn("w-4 h-4", status.color, status.spin && "animate-spin")} />
                </div>
                
                {/* Title */}
                <h4 className="text-sm font-medium text-white line-clamp-2 leading-tight">
                    {task.title}
                </h4>
                
                {/* Effort badge */}
                <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        task.estimated_effort === 'small' && "bg-green-500/20 text-green-400",
                        task.estimated_effort === 'medium' && "bg-yellow-500/20 text-yellow-400",
                        task.estimated_effort === 'large' && "bg-red-500/20 text-red-400"
                    )}>
                        {task.estimated_effort || 'medium'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function PhaseGroup({ phase, tasks, projectId, selectedTaskId, onTaskSelect }) {
    return (
        <div className="relative">
            {/* Phase header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="font-medium text-white">Phase {phase}</h3>
                    <p className="text-xs text-slate-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                </div>
            </div>
            
            {/* Tasks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-4 border-l-2 border-slate-700/50">
                {tasks.map((task, idx) => (
                    <Link 
                        key={task.id}
                        to={createPageUrl('TaskView') + `?projectId=${projectId}&taskId=${task.id}`}
                    >
                        <TaskNode
                            task={task}
                            index={task.originalIndex}
                            isActive={selectedTaskId === task.id}
                            projectId={projectId}
                            onClick={() => onTaskSelect?.(task.id)}
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function TaskDependencyGraph({ tasks, projectId, selectedTaskId, onTaskSelect }) {
    // Organize tasks into phases based on dependencies
    const phases = useMemo(() => {
        if (!tasks || tasks.length === 0) return [];

        // Add original index to tasks
        const tasksWithIndex = tasks.map((t, i) => ({ ...t, originalIndex: i }));
        
        // Parse dependencies from steps
        const getDependencies = (task) => {
            if (!task.steps || task.steps.length === 0) return [];
            const depStep = task.steps.find(s => s.description?.includes('Depends on tasks:'));
            if (!depStep) return [];
            
            const match = depStep.description.match(/Depends on tasks: ([\d, ]+)/);
            if (!match) return [];
            
            return match[1].split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0);
        };

        // Build dependency map
        const taskDeps = tasksWithIndex.map(task => ({
            task,
            deps: getDependencies(task)
        }));

        // Assign phases using topological sort
        const phases = [];
        const assigned = new Set();
        
        while (assigned.size < tasksWithIndex.length) {
            const currentPhase = [];
            
            for (const { task, deps } of taskDeps) {
                if (assigned.has(task.originalIndex)) continue;
                
                // Check if all dependencies are assigned to previous phases
                const allDepsResolved = deps.every(d => assigned.has(d));
                if (allDepsResolved || deps.length === 0) {
                    currentPhase.push(task);
                }
            }
            
            // If no tasks can be added (circular deps), add remaining
            if (currentPhase.length === 0) {
                for (const { task } of taskDeps) {
                    if (!assigned.has(task.originalIndex)) {
                        currentPhase.push(task);
                        break;
                    }
                }
            }
            
            currentPhase.forEach(t => assigned.add(t.originalIndex));
            phases.push(currentPhase);
        }

        return phases;
    }, [tasks]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'approved' || t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        
        return { total, completed, inProgress, pending };
    }, [tasks]);

    if (!tasks || tasks.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                No tasks to visualize
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">Refactoring Progress</h3>
                    <span className="text-sm text-slate-400">
                        {stats.completed}/{stats.total} completed
                    </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-green-500"
                    />
                </div>
                
                {/* Status breakdown */}
                <div className="flex gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-slate-400">{stats.completed} Done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-slate-400">{stats.inProgress} In Progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-slate-400">{stats.pending} Pending</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-slate-500">Priority:</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-rose-500" />
                    <span className="text-slate-400">Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-500 to-amber-500" />
                    <span className="text-slate-400">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <span className="text-slate-400">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-slate-500 to-slate-400" />
                    <span className="text-slate-400">Low</span>
                </div>
            </div>

            {/* Phases */}
            <div className="space-y-8">
                {phases.map((phaseTasks, phaseIndex) => (
                    <React.Fragment key={phaseIndex}>
                        <PhaseGroup
                            phase={phaseIndex + 1}
                            tasks={phaseTasks}
                            projectId={projectId}
                            selectedTaskId={selectedTaskId}
                            onTaskSelect={onTaskSelect}
                        />
                        
                        {/* Arrow between phases */}
                        {phaseIndex < phases.length - 1 && (
                            <div className="flex justify-center">
                                <div className="flex flex-col items-center text-slate-600">
                                    <ArrowDown className="w-5 h-5" />
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}