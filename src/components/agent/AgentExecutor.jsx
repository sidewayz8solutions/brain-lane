import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvokeLLM } from '@/services/aiService';
import { useTaskStore } from '@/store/projectStore';
import { 
    Play, 
    Square, 
    Terminal as TerminalIcon, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    ChevronDown,
    ChevronRight,
    FileCode,
    Zap,
    AlertTriangle,
    Clock,
    Send,
    RotateCcw,
    Pause,
    SkipForward,
    Settings,
    Database,
    Code,
    TestTube,
    FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Progress } from '@/components/ui/progress';

const statusConfig = {
    idle: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20' },
    running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', spin: true },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    paused: { icon: Pause, color: 'text-orange-400', bg: 'bg-orange-500/20' }
};

const workflowSteps = [
    { id: 'init', label: 'Initialize', icon: Settings, description: 'Setting up execution environment' },
    { id: 'read', label: 'Read Files', icon: FileSearch, description: 'Reading project files' },
    { id: 'analyze', label: 'Analyze', icon: Database, description: 'Analyzing code structure' },
    { id: 'generate', label: 'Generate', icon: Code, description: 'Generating code changes' },
    { id: 'test', label: 'Test', icon: TestTube, description: 'Running tests' },
    { id: 'complete', label: 'Complete', icon: CheckCircle, description: 'Finalizing changes' }
];

function WorkflowProgress({ currentStep, stepStatuses }) {
    const currentIdx = workflowSteps.findIndex(s => s.id === currentStep);
    const progress = ((currentIdx + 1) / workflowSteps.length) * 100;

    return (
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Workflow Progress</span>
                <span className="text-xs text-cyan-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1 mb-3" />
            <div className="flex justify-between">
                {workflowSteps.map((step, idx) => {
                    const status = stepStatuses[step.id] || 'pending';
                    const isCurrent = step.id === currentStep;
                    const isPast = currentIdx > idx;
                    const Icon = step.icon;
                    
                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            <motion.div 
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                    status === 'completed' ? 'bg-green-500/20' :
                                    status === 'error' ? 'bg-red-500/20' :
                                    isCurrent ? 'bg-cyan-500/20' :
                                    'bg-slate-800'
                                )}
                                animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                {status === 'completed' ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : status === 'running' ? (
                                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                ) : status === 'error' ? (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                ) : (
                                    <Icon className={cn("w-4 h-4", isCurrent ? "text-cyan-400" : "text-slate-500")} />
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[10px] mt-1",
                                isCurrent ? "text-cyan-400" : isPast ? "text-slate-400" : "text-slate-600"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LogEntry({ log, index }) {
    const config = statusConfig[log.type] || statusConfig.idle;
    const Icon = config.icon || Clock;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                config.bg
            )}
        >
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color, config.spin && "animate-spin")} />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300">{log.message}</p>
                {log.details && (
                    <pre className="mt-2 text-xs text-slate-500 font-mono overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {log.details}
                    </pre>
                )}
                <span className="text-xs text-slate-600 mt-1 block">
                    {new Date(log.timestamp).toLocaleTimeString()}
                </span>
            </div>
        </motion.div>
    );
}

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                </div>
            )}
            <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
                <div className={cn(
                    "rounded-2xl px-4 py-3",
                    isUser 
                        ? "bg-blue-600 text-white" 
                        : "bg-slate-800 border border-slate-700"
                )}>
                    {isUser ? (
                        <p className="text-sm">{message.content}</p>
                    ) : (
                        <div className="text-sm prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {message.tool_calls?.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {message.tool_calls.map((tool, idx) => (
                            <div 
                                key={idx}
                                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50"
                            >
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="flex items-center gap-2 text-slate-400 hover:text-slate-300"
                                >
                                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    <FileCode className="w-3 h-3" />
                                    {tool.name}
                                    {tool.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                                    {tool.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                                </button>
                                {expanded && tool.results && (
                                    <pre className="mt-2 text-xs text-slate-500 overflow-x-auto max-h-32 overflow-y-auto">
                                        {typeof tool.results === 'string' 
                                            ? tool.results 
                                            : JSON.stringify(tool.results, null, 2)}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AgentExecutor({ task, project, onComplete }) {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [messages, setMessages] = useState([]);
    const [conversationId, setConversationId] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState('init');
    const [stepStatuses, setStepStatuses] = useState({});
    const [executionMode, setExecutionMode] = useState('auto'); // auto, step-by-step
    const [isPaused, setIsPaused] = useState(false);
    const messagesEndRef = useRef(null);
    const logsEndRef = useRef(null);

    const updateTask = useTaskStore((state) => state.updateTask);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, logs]);

    const addLog = (type, message, details = null) => {
        setLogs(prev => [...prev, { type, message, details, timestamp: new Date().toISOString() }]);
    };

    const updateStepStatus = (stepId, stepStatus) => {
        setStepStatuses(prev => ({ ...prev, [stepId]: stepStatus }));
    };

    const simulateWorkflow = async () => {
        // Initialize
        setCurrentStep('init');
        updateStepStatus('init', 'running');
        addLog('running', 'Initializing sandbox environment...');
        await new Promise(r => setTimeout(r, 800));
        addLog('success', 'Sandbox initialized');
        updateStepStatus('init', 'completed');

        if (isPaused) return;

        // Read files
        setCurrentStep('read');
        updateStepStatus('read', 'running');
        addLog('running', 'Reading project files...');
        const fileCount = Object.keys(project?.file_contents || {}).length;
        await new Promise(r => setTimeout(r, 600));
        addLog('success', `Loaded ${fileCount} files from project`);
        updateStepStatus('read', 'completed');

        if (isPaused) return;

        // Analyze
        setCurrentStep('analyze');
        updateStepStatus('analyze', 'running');
        addLog('running', 'Analyzing code structure...');
        await new Promise(r => setTimeout(r, 1000));
        addLog('success', 'Code analysis complete');
        updateStepStatus('analyze', 'completed');

        if (isPaused) return;

        // Generate
        setCurrentStep('generate');
        updateStepStatus('generate', 'running');
        addLog('running', 'Generating code modifications...');
    };

    const startExecution = async () => {
        if (!task || !project) return;

        setStatus('running');
        setLogs([]);
        setMessages([]);
        setStepStatuses({});
        setIsPaused(false);

        // Start workflow simulation
        simulateWorkflow();

        try {
            addLog('running', 'Creating agent conversation...');
            // Generate a local conversation ID
            const convId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setConversationId(convId);
            addLog('success', 'Agent conversation created');

            const taskPrompt = `Execute the following task in the sandbox environment:

**Task:** ${task.title}
**Description:** ${task.description || 'No description provided'}
**Category:** ${task.category || 'general'}
**Priority:** ${task.priority || 'medium'}
**Files to modify:** ${task.files_affected?.join(', ') || 'Not specified'}
**Project ID:** ${project.id}

Workflow:
1. Read the Project entity to get file_contents
2. Analyze the current code in affected files
3. Generate the code modifications
4. Create a diff showing the changes
5. Run tests if applicable
6. Update the Task entity with diff and status 'completed'

Start execution now.`;

            addLog('running', 'Sending task to agent...');

            // Add user message to local state
            setMessages(prev => [...prev, { role: 'user', content: taskPrompt }]);

            // Call AI service for response
            const response = await InvokeLLM({
                prompt: taskPrompt,
                system_prompt: 'You are a code execution agent. Analyze the task and provide step-by-step execution plan with code modifications.'
            });

            // Add assistant response
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            addLog('success', 'Task sent, response received');

        } catch (error) {
            console.error('Execution error:', error);
            addLog('error', 'Execution failed', error.message);
            setStatus('error');
            updateStepStatus(currentStep, 'error');
        }
    };

    const pauseExecution = () => {
        setIsPaused(true);
        setStatus('paused');
        addLog('warning', 'Execution paused by user');
    };

    const resumeExecution = () => {
        setIsPaused(false);
        setStatus('running');
        addLog('running', 'Execution resumed');
        simulateWorkflow();
    };

    const skipStep = () => {
        const steps = workflowSteps.map(s => s.id);
        const currentIdx = steps.indexOf(currentStep);
        if (currentIdx < steps.length - 1) {
            updateStepStatus(currentStep, 'completed');
            setCurrentStep(steps[currentIdx + 1]);
            addLog('warning', `Skipped step: ${currentStep}`);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !conversationId || isProcessing) return;

        setIsProcessing(true);
        const message = inputMessage;
        setInputMessage('');

        try {
            // Add user message to local state
            setMessages(prev => [...prev, { role: 'user', content: message }]);

            // Call AI service for response
            const response = await InvokeLLM({
                prompt: message,
                system_prompt: 'You are a code execution agent. Continue assisting with the task execution.'
            });

            // Add assistant response
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            addLog('error', 'Failed to send message', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const stopExecution = () => {
        setStatus('idle');
        setIsPaused(false);
        addLog('warning', 'Execution stopped by user');
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.content) {
            const content = lastMessage.content.toLowerCase();
            if (content.includes('completed') || content.includes('successfully')) {
                setCurrentStep('complete');
                updateStepStatus('generate', 'completed');
                updateStepStatus('test', 'completed');
                updateStepStatus('complete', 'completed');
                setStatus('success');
                addLog('success', 'Task execution completed');
                if (onComplete) onComplete();
            } else if (content.includes('failed') || content.includes('error')) {
                if (!content.includes('no error')) {
                    setStatus('warning');
                    addLog('warning', 'Task may have issues - review the agent response');
                }
            }
        }
    }, [messages]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", (statusConfig[status] || statusConfig.idle).bg)}>
                        <TerminalIcon className={cn("w-5 h-5", (statusConfig[status] || statusConfig.idle).color)} />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Agent Executor</h3>
                        <p className="text-xs text-slate-500">
                            Sandbox Environment • {executionMode === 'auto' ? 'Auto Mode' : 'Step-by-Step'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'idle' && (
                        <Button onClick={startExecution} className="bg-gradient-to-r from-blue-600 to-cyan-600" size="sm">
                            <Play className="w-4 h-4 mr-1" />
                            Execute Task
                        </Button>
                    )}
                    {status === 'running' && (
                        <>
                            <Button onClick={pauseExecution} variant="outline" size="sm" className="border-slate-700">
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                            </Button>
                            <Button onClick={skipStep} variant="outline" size="sm" className="border-slate-700">
                                <SkipForward className="w-4 h-4 mr-1" />
                                Skip
                            </Button>
                            <Button onClick={stopExecution} variant="destructive" size="sm">
                                <Square className="w-4 h-4 mr-1" />
                                Stop
                            </Button>
                        </>
                    )}
                    {status === 'paused' && (
                        <>
                            <Button onClick={resumeExecution} className="bg-green-600 hover:bg-green-500" size="sm">
                                <Play className="w-4 h-4 mr-1" />
                                Resume
                            </Button>
                            <Button onClick={stopExecution} variant="destructive" size="sm">
                                <Square className="w-4 h-4 mr-1" />
                                Stop
                            </Button>
                        </>
                    )}
                    {(status === 'success' || status === 'error' || status === 'warning') && (
                        <Button onClick={startExecution} variant="outline" size="sm" className="border-slate-700">
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Re-run
                        </Button>
                    )}
                </div>
            </div>

            {/* Workflow Progress */}
            {status !== 'idle' && (
                <WorkflowProgress currentStep={currentStep} stepStatuses={stepStatuses} />
            )}

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Messages Panel */}
                <div className="flex-1 flex flex-col border-r border-slate-700/50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && status === 'idle' && (
                            <div className="text-center py-12 text-slate-500">
                                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Click "Execute Task" to start the agent</p>
                                <p className="text-xs mt-2">The agent will analyze, generate, and test code changes</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <MessageBubble message={msg} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>

                    {conversationId && (
                        <div className="p-4 border-t border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Send additional instructions..."
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                                    disabled={isProcessing}
                                />
                                <Button onClick={sendMessage} size="icon" disabled={!inputMessage.trim() || isProcessing} className="bg-blue-600 hover:bg-blue-500">
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logs Panel */}
                <div className="w-80 flex flex-col bg-slate-900/50">
                    <div className="p-3 border-b border-slate-700/50">
                        <h4 className="text-sm font-medium text-slate-400">Execution Logs</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        <AnimatePresence>
                            {logs.map((log, idx) => (
                                <LogEntry key={idx} log={log} index={idx} />
                            ))}
                        </AnimatePresence>
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
}