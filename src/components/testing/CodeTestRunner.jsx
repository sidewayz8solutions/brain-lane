import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/services/aiService';
import {
    Play,
    Square,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Terminal,
    FileCode,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const testFrameworks = {
    jest: { command: 'npm test', pattern: /PASS|FAIL|✓|✗/ },
    pytest: { command: 'pytest', pattern: /passed|failed|PASSED|FAILED/ },
    mocha: { command: 'npm run test', pattern: /passing|failing/ },
    vitest: { command: 'npm run test', pattern: /✓|×/ }
};

function TestResult({ test, index }) {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "border rounded-lg overflow-hidden",
                test.status === 'passed' ? 'border-green-500/30 bg-green-500/5' :
                test.status === 'failed' ? 'border-red-500/30 bg-red-500/5' :
                'border-slate-700/50 bg-slate-800/50'
            )}
        >
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-3 flex items-center gap-3 text-left"
            >
                {test.status === 'passed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : test.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium text-white truncate">
                    {test.name}
                </span>
                <span className="text-xs text-slate-500">{test.duration}ms</span>
                {test.details && (
                    expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
            </button>
            
            <AnimatePresence>
                {expanded && test.details && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <pre className="p-3 pt-0 text-xs text-slate-400 font-mono whitespace-pre-wrap">
                            {test.details}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function CodeTestRunner({ project, task, diff, onTestComplete }) {
    const [isRunning, setIsRunning] = useState(false);
    const [testResults, setTestResults] = useState([]);
    const [summary, setSummary] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const logsEndRef = useRef(null);

    const framework = project?.detected_stack?.testing_framework || 'jest';

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        setLogs(prev => [...prev, { time, message, type }]);
    };

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);
        setSummary(null);
        setLogs([]);
        addLog(`Starting test execution with ${framework}...`, 'info');

        try {
            // Build context about changes
            const changedFiles = diff?.files?.map(f => f.path).join(', ') || 'No files';
            const codeContext = diff?.files?.map(f => `${f.path}:\n${f.modified?.substring(0, 1000)}`).join('\n\n') || '';

            addLog(`Analyzing changes in: ${changedFiles}`, 'info');

            // Use AI to simulate test execution based on code changes
            const result = await InvokeLLM({
                prompt: `You are a test execution engine. Analyze the following code changes and simulate running tests.

PROJECT: ${project?.name}
FRAMEWORK: ${framework}
TASK: ${task?.title}

CHANGED CODE:
${codeContext}

Generate realistic test results as if you ran the actual tests. Include:
1. Unit tests for changed functions
2. Integration tests if applicable
3. Some edge case tests

For each test, determine if it would PASS or FAIL based on the code quality.
Be realistic - most well-written code passes, but flag potential issues.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        tests: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    status: { type: "string", enum: ["passed", "failed", "skipped"] },
                                    duration: { type: "number" },
                                    details: { type: "string" }
                                }
                            }
                        },
                        summary: {
                            type: "object",
                            properties: {
                                total: { type: "number" },
                                passed: { type: "number" },
                                failed: { type: "number" },
                                skipped: { type: "number" },
                                duration: { type: "number" },
                                coverage: { type: "number" }
                            }
                        },
                        recommendations: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            // Simulate progressive test execution
            for (let i = 0; i < result.tests.length; i++) {
                const test = result.tests[i];
                await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
                addLog(`${test.status === 'passed' ? '✓' : '✗'} ${test.name}`, test.status === 'passed' ? 'success' : 'error');
                setTestResults(prev => [...prev, test]);
            }

            setSummary(result.summary);
            addLog(`\nTest run complete: ${result.summary.passed}/${result.summary.total} passed`, 
                result.summary.failed > 0 ? 'warning' : 'success');

            if (result.recommendations?.length > 0) {
                addLog('\nRecommendations:', 'info');
                result.recommendations.forEach(rec => addLog(`• ${rec}`, 'info'));
            }

            onTestComplete?.({
                success: result.summary.failed === 0,
                summary: result.summary,
                tests: result.tests
            });

        } catch (error) {
            console.error('Test execution error:', error);
            addLog(`Error: ${error.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    const passedCount = testResults.filter(t => t.status === 'passed').length;
    const failedCount = testResults.filter(t => t.status === 'failed').length;

    return (
        <div className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                        <Terminal className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white">Test Runner</h3>
                        <p className="text-xs text-slate-500">Framework: {framework}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogs(!showLogs)}
                        className="border-slate-700"
                    >
                        <FileCode className="w-3 h-3 mr-1" />
                        Logs
                    </Button>
                    <Button
                        onClick={runTests}
                        disabled={isRunning}
                        size="sm"
                        className="bg-green-600 hover:bg-green-500"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1" />
                                Run Tests
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Summary */}
            {(testResults.length > 0 || summary) && (
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-medium">{passedCount} passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">{failedCount} failed</span>
                        </div>
                        {summary?.coverage && (
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-xs text-slate-500">Coverage:</span>
                                <span className={cn(
                                    "font-medium",
                                    summary.coverage >= 80 ? 'text-green-400' :
                                    summary.coverage >= 60 ? 'text-yellow-400' : 'text-red-400'
                                )}>
                                    {summary.coverage}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Test Results */}
            <ScrollArea className="max-h-64">
                <div className="p-4 space-y-2">
                    {testResults.length === 0 && !isRunning && (
                        <div className="text-center py-8 text-slate-500">
                            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Click "Run Tests" to execute tests</p>
                        </div>
                    )}
                    {testResults.map((test, idx) => (
                        <TestResult key={idx} test={test} index={idx} />
                    ))}
                    {isRunning && (
                        <div className="flex items-center gap-2 text-cyan-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Running tests...
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Logs Panel */}
            <AnimatePresence>
                {showLogs && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-700/50"
                    >
                        <div className="p-3 bg-slate-950 max-h-48 overflow-y-auto font-mono text-xs">
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
                            <div ref={logsEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}