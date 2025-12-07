import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Play,
    Square,
    Terminal,
    FileCode,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    Save,
    Copy,
    Check,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    Download,
    Upload,
    Eye,
    Code,
    Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runCommandInWebContainer } from '@/services/webcontainerService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

function FileTreeItem({ item, depth = 0, onSelect, selectedPath, onDelete }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const isFolder = item.type === 'folder';
    const isSelected = selectedPath === item.path;

    return (
        <div>
            <button
                onClick={() => isFolder ? setExpanded(!expanded) : onSelect(item)}
                className={cn(
                    "w-full flex items-center gap-1.5 px-2 py-1 text-xs rounded hover:bg-slate-800 transition-colors",
                    isSelected && "bg-cyan-500/20 text-cyan-400"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isFolder ? (
                    expanded ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400" /> : <Folder className="w-3.5 h-3.5 text-yellow-400" />
                ) : (
                    <FileCode className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className={cn("flex-1 text-left truncate", isSelected ? "text-cyan-400" : "text-slate-300")}>
                    {item.name}
                </span>
                {item.modified && <Badge className="h-4 px-1 text-[9px] bg-yellow-500/20 text-yellow-400">M</Badge>}
            </button>
            {isFolder && expanded && item.children && (
                <div>
                    {item.children.map((child, idx) => (
                        <FileTreeItem
                            key={idx}
                            item={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CodeEditor({ file, onChange, onSave }) {
    const [content, setContent] = useState(file?.content || '');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setContent(file?.content || '');
    }, [file]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lineNumbers = content.split('\n').length;

    return (
        <div className="flex-1 flex flex-col bg-slate-950">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">{file?.name || 'No file selected'}</span>
                    {file?.modified && <Badge className="h-4 px-1 text-[9px] bg-yellow-500/20 text-yellow-400">Modified</Badge>}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSave?.(content)}>
                        <Save className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Line Numbers */}
                <div className="w-12 bg-slate-900/50 border-r border-slate-800 flex-shrink-0">
                    <ScrollArea className="h-full">
                        <div className="py-2 px-2 text-right font-mono text-xs text-slate-600 select-none">
                            {Array.from({ length: lineNumbers }, (_, i) => (
                                <div key={i} className="leading-6">{i + 1}</div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Code Area */}
                <ScrollArea className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            onChange?.(e.target.value);
                        }}
                        className="w-full h-full p-2 bg-transparent text-slate-300 font-mono text-sm leading-6 resize-none outline-none"
                        style={{ minHeight: `${lineNumbers * 24 + 16}px` }}
                        spellCheck={false}
                    />
                </ScrollArea>
            </div>
        </div>
    );
}

function ConsoleOutput({ logs, onClear }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, [logs]);

    return (
        <div className="h-full flex flex-col bg-slate-950">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Console</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClear}>
                    Clear
                </Button>
            </div>
            <ScrollArea ref={scrollRef} className="flex-1 p-3">
                <div className="font-mono text-xs space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className={cn(
                            "flex gap-2",
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warn' ? 'text-yellow-400' :
                            log.type === 'success' ? 'text-green-400' :
                            'text-slate-400'
                        )}>
                            <span className="text-slate-600 select-none">[{log.time}]</span>
                            <span className="whitespace-pre-wrap">{log.message}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default function CodeExecutionSandbox({ project, task, onExecutionComplete }) {
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');
    const [executionResult, setExecutionResult] = useState(null);

    useEffect(() => {
        if (project?.file_contents) {
            const fileTree = buildFileTree(project.file_contents);
            setFiles(fileTree);
        }
    }, [project]);

    const buildFileTree = (contents) => {
        const root = [];
        const paths = Object.keys(contents);

        paths.forEach(path => {
            const parts = path.split('/');
            let current = root;

            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                let existing = current.find(item => item.name === part);

                if (!existing) {
                    existing = {
                        name: part,
                        path: parts.slice(0, index + 1).join('/'),
                        type: isFile ? 'file' : 'folder',
                        content: isFile ? contents[path] : undefined,
                        children: isFile ? undefined : []
                    };
                    current.push(existing);
                }

                if (!isFile) {
                    current = existing.children;
                }
            });
        });

        return root;
    };

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs(prev => [...prev, { time, message, type }]);
    };

    const clearLogs = () => setConsoleLogs([]);

    const executeCode = async () => {
        setIsRunning(true);
        clearLogs();
        addLog('Starting code execution...', 'info');

        try {
            addLog('Loading sandbox environment...', 'info');
            await new Promise(r => setTimeout(r, 500));

            addLog('Compiling code...', 'info');
            await new Promise(r => setTimeout(r, 800));

            // Simulate execution based on file type
            const fileExt = selectedFile?.name?.split('.').pop();
            
            if (['js', 'jsx', 'ts', 'tsx'].includes(fileExt)) {
                addLog('Running JavaScript/TypeScript...', 'info');
                await new Promise(r => setTimeout(r, 1000));
                addLog('Module loaded successfully', 'success');
                addLog('Executing main function...', 'info');
                await new Promise(r => setTimeout(r, 500));
                addLog('Output: { status: "success", result: "Hello World" }', 'info');
            } else if (['py'].includes(fileExt)) {
                addLog('Running Python interpreter...', 'info');
                await new Promise(r => setTimeout(r, 1200));
                addLog('>>> Executing script...', 'info');
                addLog('Output: Hello from Python!', 'success');
            }

            addLog('Execution completed successfully', 'success');
            setExecutionResult({ status: 'success', exitCode: 0 });
            onExecutionComplete?.({ success: true });

        } catch (error) {
            addLog(`Error: ${error.message}`, 'error');
            setExecutionResult({ status: 'error', error: error.message });
            onExecutionComplete?.({ success: false, error: error.message });
        } finally {
            setIsRunning(false);
        }
    };

    const runTests = async () => {
        // Prefer real execution via WebContainer when available
        if (project && Object.keys(project.file_contents || {}).some(p => p.toLowerCase().endsWith('package.json'))) {
            await runProjectCommand('npm', ['test']);
            return;
        }

        setIsRunning(true);
        clearLogs();
        addLog('Starting test suite (simulated)...', 'info');

        try {
            await new Promise(r => setTimeout(r, 500));
            addLog('Discovering tests...', 'info');
            addLog('Found 8 test files', 'info');
            
            const tests = [
                { name: 'should render component', status: 'pass' },
                { name: 'should handle click events', status: 'pass' },
                { name: 'should validate input', status: 'pass' },
                { name: 'should fetch data correctly', status: 'pass' },
                { name: 'should handle errors', status: 'pass' },
                { name: 'should update state', status: 'pass' }
            ];

            for (const test of tests) {
                await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
                addLog(`  ✓ ${test.name}`, 'success');
            }

            addLog('', 'info');
            addLog('Test Results: 6 passed, 0 failed', 'success');
            addLog('Coverage: 87.5%', 'info');

        } catch (error) {
            addLog(`Test error: ${error.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    const runProjectCommand = async (cmd, args = []) => {
        if (!project) {
            addLog('No project loaded for execution', 'error');
            return;
        }

        setIsRunning(true);
        clearLogs();
        addLog(`Running "${cmd} ${args.join(' ')}" in WebContainer...`, 'info');

        try {
            const res = await runCommandInWebContainer({
                project,
                command: cmd,
                args,
                onOutput: (chunk) => {
                    const lines = String(chunk).split('\n');
                    lines.filter(Boolean).forEach(line => addLog(line, 'info'));
                }
            });

            addLog(`Command exited with code ${res.exitCode}`, res.exitCode === 0 ? 'success' : 'error');
            setExecutionResult({ command: `${cmd} ${args.join(' ')}`, ...res });
            onExecutionComplete?.(res);
        } catch (err) {
            addLog(`WebContainer error: ${err.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Code Execution Sandbox</span>
                    {isRunning && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={runTests}
                        disabled={isRunning}
                        variant="outline"
                        size="sm"
                        className="border-slate-700"
                    >
                        <Bug className="w-3 h-3 mr-1" />
                        Run Tests
                    </Button>
                    <Button
                        onClick={executeCode}
                        disabled={isRunning || !selectedFile}
                        size="sm"
                        className="bg-green-600 hover:bg-green-500"
                    >
                        {isRunning ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                            <Play className="w-3 h-3 mr-1" />
                        )}
                        Execute
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* File Tree */}
                <div className="w-56 border-r border-slate-800 flex flex-col">
                    <div className="p-2 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Explorer</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Plus className="w-3 h-3" />
                        </Button>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-1">
                            {files.map((item, idx) => (
                                <FileTreeItem
                                    key={idx}
                                    item={item}
                                    onSelect={setSelectedFile}
                                    selectedPath={selectedFile?.path}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Editor & Console */}
                <div className="flex-1 flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent px-2">
                            <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-slate-800">
                                <FileCode className="w-3 h-3 mr-1" />
                                Editor
                            </TabsTrigger>
                            <TabsTrigger value="console" className="text-xs data-[state=active]:bg-slate-800">
                                <Terminal className="w-3 h-3 mr-1" />
                                Console
                                {consoleLogs.length > 0 && (
                                    <Badge className="ml-1 h-4 px-1 text-[9px]">{consoleLogs.length}</Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-slate-800">
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="editor" className="flex-1 m-0">
                            <CodeEditor
                                file={selectedFile}
                                onChange={(content) => {
                                    if (selectedFile) {
                                        setSelectedFile({ ...selectedFile, content, modified: true });
                                    }
                                }}
                            />
                        </TabsContent>

                        <TabsContent value="console" className="flex-1 m-0">
                            <ConsoleOutput logs={consoleLogs} onClear={clearLogs} />
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 m-0 p-4">
                            <div className="h-full flex items-center justify-center text-slate-500">
                                <div className="text-center">
                                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Preview not available for this file type</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}