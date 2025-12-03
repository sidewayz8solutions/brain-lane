import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileSearch, 
    Code, 
    Terminal, 
    GitCompare, 
    FileCheck,
    CheckCircle,
    XCircle,
    Loader2,
    Clock,
    ChevronDown,
    ChevronRight,
    Bug,
    Activity,
    Layers,
    Timer,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stages = [
    { 
        id: 'read', 
        label: 'Read Files', 
        icon: FileSearch, 
        description: 'Fetching project files and analyzing codebase structure'
    },
    { 
        id: 'analyze', 
        label: 'Analyze Code', 
        icon: Code, 
        description: 'Understanding current implementation and identifying changes needed'
    },
    { 
        id: 'execute', 
        label: 'Execute Commands', 
        icon: Terminal, 
        description: 'Running tests and validation commands in sandbox'
    },
    { 
        id: 'diff', 
        label: 'Generate Diff', 
        icon: GitCompare, 
        description: 'Creating unified diff of all code modifications'
    },
    { 
        id: 'report', 
        label: 'Report Status', 
        icon: FileCheck, 
        description: 'Compiling execution report and updating task status'
    }
];

const statusConfig = {
    pending: { color: 'text-slate-500', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    running: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    completed: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    error: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
};

function StageNode({ stage, status, index, isLast, details, duration }) {
    const [expanded, setExpanded] = useState(false);
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = stage.icon;

    const StatusIcon = status === 'completed' ? CheckCircle 
        : status === 'error' ? XCircle 
        : status === 'running' ? Loader2 
        : Clock;

    return (
        <div className="flex items-start">
            {/* Node */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: 'spring', bounce: 0.4 }}
                className="relative"
            >
                {/* Connector line */}
                {!isLast && (
                    <div className="absolute left-1/2 top-full w-0.5 h-8 -translate-x-1/2">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                            className={cn(
                                "w-full",
                                status === 'completed' ? 'bg-green-500' : 'bg-slate-700'
                            )}
                        />
                    </div>
                )}

                {/* Stage circle */}
                <motion.button
                    onClick={() => setExpanded(!expanded)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "relative w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all",
                        config.bg, config.border,
                        status === 'running' && 'ring-2 ring-blue-500/50 ring-offset-2 ring-offset-slate-900'
                    )}
                >
                    <Icon className={cn("w-6 h-6", config.color)} />
                    
                    {/* Status indicator */}
                    <div className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                        config.bg, "border", config.border
                    )}>
                        <StatusIcon className={cn(
                            "w-3 h-3", 
                            config.color,
                            status === 'running' && 'animate-spin'
                        )} />
                    </div>
                </motion.button>
            </motion.div>

            {/* Details panel */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.15 }}
                className="ml-4 flex-1 min-w-0"
            >
                <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <h4 className={cn("font-medium", config.color)}>{stage.label}</h4>
                    {duration && (
                        <span className="text-xs text-slate-500">{duration}ms</span>
                    )}
                    {details && (
                        expanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        )
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                
                <AnimatePresence>
                    {expanded && details && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                {details.files && (
                                    <div className="mb-2">
                                        <span className="text-xs text-slate-500">Files:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {details.files.map((f, i) => (
                                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {details.command && (
                                    <div className="mb-2">
                                        <span className="text-xs text-slate-500">Command:</span>
                                        <code className="block mt-1 text-xs text-cyan-400 font-mono">
                                            $ {details.command}
                                        </code>
                                    </div>
                                )}
                                {details.output && (
                                    <div>
                                        <span className="text-xs text-slate-500">Output:</span>
                                        <pre className="mt-1 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-24 overflow-auto">
                                            {details.output}
                                        </pre>
                                    </div>
                                )}
                                {details.error && (
                                    <div className="text-xs text-red-400">{details.error}</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

function DebugPanel({ logs, stageStatuses, timestamps }) {
    const [activeTab, setActiveTab] = useState('logs');
    const logsEndRef = useRef(null);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const tabs = [
        { id: 'logs', label: 'Logs', icon: Activity },
        { id: 'state', label: 'State', icon: Layers },
        { id: 'timing', label: 'Timing', icon: Timer }
    ];

    return (
        <div className="mt-4 bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-slate-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors",
                            activeTab === tab.id 
                                ? "text-cyan-400 bg-slate-800/50 border-b-2 border-cyan-400" 
                                : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="p-3 max-h-48 overflow-y-auto font-mono text-xs">
                {activeTab === 'logs' && (
                    <div className="space-y-1">
                        {logs.length === 0 ? (
                            <p className="text-slate-600 italic">No logs yet...</p>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
                                    <span className={cn(
                                        log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-green-400' :
                                        log.type === 'warning' ? 'text-yellow-400' :
                                        'text-slate-400'
                                    )}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                )}

                {activeTab === 'state' && (
                    <div className="space-y-2">
                        <p className="text-slate-500 mb-2">Current stage states:</p>
                        {Object.entries(stageStatuses).map(([stage, status]) => (
                            <div key={stage} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-400">{stage}</span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs",
                                    status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                                    status === 'error' ? 'bg-red-500/20 text-red-400' :
                                    'bg-slate-700/50 text-slate-500'
                                )}>
                                    {status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'timing' && (
                    <div className="space-y-2">
                        <p className="text-slate-500 mb-2">Stage durations:</p>
                        {Object.entries(timestamps).map(([stage, data]) => (
                            <div key={stage} className="flex items-center justify-between py-1 border-b border-slate-800/50">
                                <span className="text-slate-400">{stage}</span>
                                <div className="flex items-center gap-2">
                                    {data.duration ? (
                                        <span className="text-cyan-400">{data.duration}ms</span>
                                    ) : data.start && !data.end ? (
                                        <span className="text-yellow-400 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            running
                                        </span>
                                    ) : (
                                        <span className="text-slate-600">—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {Object.values(timestamps).some(t => t.duration) && (
                            <div className="pt-2 border-t border-slate-700">
                                <div className="flex justify-between text-slate-300">
                                    <span>Total</span>
                                    <span className="text-cyan-400">
                                        {Object.values(timestamps).reduce((sum, t) => sum + (t.duration || 0), 0)}ms
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ExecutionFlowDiagram({ taskStatus, executionData }) {
    const [stageStatuses, setStageStatuses] = useState({
        read: 'pending',
        analyze: 'pending',
        execute: 'pending',
        diff: 'pending',
        report: 'pending'
    });
    const [showDebug, setShowDebug] = useState(false);
    const [debugLogs, setDebugLogs] = useState([]);
    const [timestamps, setTimestamps] = useState({
        read: {},
        analyze: {},
        execute: {},
        diff: {},
        report: {}
    });

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setDebugLogs(prev => [...prev, { time, message, type }]);
    };

    // Simulate execution flow based on task status
    useEffect(() => {
        if (taskStatus === 'pending') {
            setStageStatuses({
                read: 'pending',
                analyze: 'pending',
                execute: 'pending',
                diff: 'pending',
                report: 'pending'
            });
            setDebugLogs([]);
            setTimestamps({ read: {}, analyze: {}, execute: {}, diff: {}, report: {} });
            addLog('Task initialized, waiting to start', 'info');
        } else if (taskStatus === 'in_progress') {
            // Animate through stages
            const sequence = ['read', 'analyze', 'execute', 'diff', 'report'];
            let currentIndex = 0;
            addLog('Execution started', 'success');

            const interval = setInterval(() => {
                if (currentIndex < sequence.length) {
                    const stageName = sequence[currentIndex];
                    const startTime = Date.now();
                    
                    setTimestamps(prev => ({
                        ...prev,
                        [stageName]: { start: startTime }
                    }));
                    
                    setStageStatuses(prev => ({
                        ...prev,
                        [stageName]: 'running'
                    }));
                    addLog(`Stage "${stageName}" started`, 'info');

                    if (currentIndex > 0) {
                        const prevStage = sequence[currentIndex - 1];
                        const duration = Math.floor(Math.random() * 500) + 200;
                        
                        setTimestamps(prev => ({
                            ...prev,
                            [prevStage]: { ...prev[prevStage], end: Date.now(), duration }
                        }));
                        
                        setStageStatuses(prev => ({
                            ...prev,
                            [prevStage]: 'completed'
                        }));
                        addLog(`Stage "${prevStage}" completed (${duration}ms)`, 'success');
                    }
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, 1500);

            return () => clearInterval(interval);
        } else if (taskStatus === 'completed' || taskStatus === 'approved') {
            setStageStatuses({
                read: 'completed',
                analyze: 'completed',
                execute: 'completed',
                diff: 'completed',
                report: 'completed'
            });
            if (debugLogs.length === 0) {
                addLog('All stages completed successfully', 'success');
            }
        } else if (taskStatus === 'rejected') {
            setStageStatuses({
                read: 'completed',
                analyze: 'completed',
                execute: 'error',
                diff: 'pending',
                report: 'pending'
            });
            addLog('Execution failed at "execute" stage', 'error');
        }
    }, [taskStatus]);

    // Get stage details from execution data
    const getStageDetails = (stageId) => {
        if (!executionData) return null;

        switch (stageId) {
            case 'read':
                return executionData.filesRead ? {
                    files: executionData.filesRead
                } : null;
            case 'analyze':
                return executionData.analysisNotes ? {
                    output: executionData.analysisNotes
                } : null;
            case 'execute':
                return executionData.command ? {
                    command: executionData.command,
                    output: executionData.commandOutput
                } : null;
            case 'diff':
                return executionData.diffStats ? {
                    output: `+${executionData.diffStats.additions} -${executionData.diffStats.deletions} across ${executionData.diffStats.files} files`
                } : null;
            case 'report':
                return executionData.reportStatus ? {
                    output: executionData.reportStatus
                } : null;
            default:
                return null;
        }
    };

    const completedCount = Object.values(stageStatuses).filter(s => s === 'completed').length;
    const progress = (completedCount / stages.length) * 100;

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Execution Flow</h3>
                    <p className="text-sm text-slate-500">Agent processing pipeline</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{completedCount}/{stages.length}</div>
                        <div className="text-xs text-slate-500">stages complete</div>
                    </div>
                    <div className="w-16 h-16 relative">
                        <svg className="w-full h-full -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-slate-700"
                            />
                            <motion.circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={175.93}
                                initial={{ strokeDashoffset: 175.93 }}
                                animate={{ strokeDashoffset: 175.93 - (175.93 * progress / 100) }}
                                className="text-cyan-400"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                            {Math.round(progress)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
            </div>

            {/* Flow diagram */}
            <div className="space-y-8">
                {stages.map((stage, index) => (
                    <StageNode
                        key={stage.id}
                        stage={stage}
                        status={stageStatuses[stage.id]}
                        index={index}
                        isLast={index === stages.length - 1}
                        details={getStageDetails(stage.id)}
                        duration={executionData?.durations?.[stage.id]}
                    />
                ))}
            </div>

            {/* Legend and Debug Toggle */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {Object.entries(statusConfig).map(([status, config]) => (
                        <div key={status} className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", config.bg, "border", config.border)} />
                            <span className="text-xs text-slate-500 capitalize">{status}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        showDebug 
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                            : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                    )}
                >
                    <Bug className="w-3 h-3" />
                    {showDebug ? 'Hide Debug' : 'Debug'}
                </button>
            </div>

            {/* Debug Panel */}
            <AnimatePresence>
                {showDebug && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <DebugPanel 
                            logs={debugLogs} 
                            stageStatuses={stageStatuses}
                            timestamps={timestamps}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}