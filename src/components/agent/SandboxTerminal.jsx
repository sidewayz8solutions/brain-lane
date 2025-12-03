import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Maximize2, Minimize2, Copy, Check, FileCode, Folder, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const commandSimulations = {
    'npm test': {
        output: [
            '\x1b[36m> project@1.0.0 test\x1b[0m',
            '\x1b[36m> jest --coverage\x1b[0m',
            '',
            '\x1b[32mPASS\x1b[0m  src/utils.test.js',
            '  ✓ should format date correctly (3ms)',
            '  ✓ should validate email (1ms)',
            '  ✓ should parse JSON safely (2ms)',
            '',
            '\x1b[32mPASS\x1b[0m  src/components/Button.test.js',
            '  ✓ renders correctly (15ms)',
            '  ✓ handles click events (8ms)',
            '  ✓ applies disabled state (4ms)',
            '',
            '----------|---------|----------|---------|---------|',
            'File      | % Stmts | % Branch | % Funcs | % Lines |',
            '----------|---------|----------|---------|---------|',
            'All files |   87.5  |   82.3   |   91.2  |   86.8  |',
            '----------|---------|----------|---------|---------|',
            '',
            '\x1b[32mTest Suites: 2 passed, 2 total\x1b[0m',
            '\x1b[32mTests:       6 passed, 6 total\x1b[0m',
            'Snapshots:   0 total',
            'Time:        2.341s'
        ],
        exitCode: 0
    },
    'npm run lint': {
        output: [
            '\x1b[36m> project@1.0.0 lint\x1b[0m',
            '\x1b[36m> eslint src/ --ext .js,.jsx,.ts,.tsx\x1b[0m',
            '',
            '\x1b[32m✓ No linting errors found in 24 files\x1b[0m'
        ],
        exitCode: 0
    },
    'npm run build': {
        output: [
            '\x1b[36m> project@1.0.0 build\x1b[0m',
            '\x1b[36m> vite build\x1b[0m',
            '',
            'vite v5.0.0 building for production...',
            '✓ 1247 modules transformed.',
            '',
            'dist/index.html                  0.45 kB │ gzip:  0.29 kB',
            'dist/assets/index-DiwrgTda.css  22.15 kB │ gzip:  4.82 kB',
            'dist/assets/index-A3zfJ7Dq.js  187.32 kB │ gzip: 61.24 kB',
            '',
            '\x1b[32m✓ built in 3.42s\x1b[0m'
        ],
        exitCode: 0
    },
    'pytest': {
        output: [
            '\x1b[36m============================= test session starts =============================\x1b[0m',
            'platform linux -- Python 3.11.0, pytest-7.4.0, pluggy-1.3.0',
            'rootdir: /workspace/project',
            'plugins: cov-4.1.0, asyncio-0.21.1',
            'collected 12 items',
            '',
            'tests/test_api.py \x1b[32m....\x1b[0m                                                  [ 33%]',
            'tests/test_models.py \x1b[32m....\x1b[0m                                              [ 66%]',
            'tests/test_utils.py \x1b[32m....\x1b[0m                                               [100%]',
            '',
            '---------- coverage: platform linux, python 3.11.0 ----------',
            'Name                 Stmts   Miss  Cover',
            '-----------------------------------------',
            'src/api.py              45      3    93%',
            'src/models.py           62      5    92%',
            'src/utils.py            28      2    93%',
            '-----------------------------------------',
            'TOTAL                  135     10    93%',
            '',
            '\x1b[32m============================== 12 passed in 1.23s ==============================\x1b[0m'
        ],
        exitCode: 0
    },
    'npm install': {
        output: [
            '\x1b[36madded 1247 packages in 12s\x1b[0m',
            '',
            '142 packages are looking for funding',
            '  run `npm fund` for details',
            '',
            'found 0 vulnerabilities'
        ],
        exitCode: 0
    },
    'git status': {
        output: [
            'On branch feature/ai-implementation',
            'Changes to be committed:',
            '  (use "git restore --staged <file>..." to unstage)',
            '\x1b[32m        modified:   src/components/Button.jsx\x1b[0m',
            '\x1b[32m        modified:   src/utils/helpers.js\x1b[0m',
            '\x1b[32m        new file:   src/components/NewFeature.jsx\x1b[0m',
            ''
        ],
        exitCode: 0
    },
    'git diff --stat': {
        output: [
            ' src/components/Button.jsx     | 15 ++++++++-------',
            ' src/utils/helpers.js          |  8 +++++---',
            ' src/components/NewFeature.jsx | 42 ++++++++++++++++++++++++++++++++++++++++++',
            ' 3 files changed, 55 insertions(+), 10 deletions(-)',
            ''
        ],
        exitCode: 0
    },
    'ls -la': {
        output: [
            'total 248',
            'drwxr-xr-x   12 user  staff    384 Dec  2 10:30 .',
            'drwxr-xr-x    5 user  staff    160 Dec  1 09:15 ..',
            '-rw-r--r--    1 user  staff    285 Dec  2 10:30 .gitignore',
            'drwxr-xr-x    8 user  staff    256 Dec  2 10:28 .git',
            '-rw-r--r--    1 user  staff   1245 Dec  2 10:30 package.json',
            '-rw-r--r--    1 user  staff 185432 Dec  2 10:28 package-lock.json',
            '-rw-r--r--    1 user  staff    892 Dec  1 09:15 README.md',
            'drwxr-xr-x    8 user  staff    256 Dec  2 10:30 src',
            'drwxr-xr-x    4 user  staff    128 Dec  1 09:15 tests',
            '-rw-r--r--    1 user  staff    456 Dec  1 09:15 vite.config.js'
        ],
        exitCode: 0
    },
    'cat package.json': {
        output: [
            '{',
            '  "name": "project",',
            '  "version": "1.0.0",',
            '  "scripts": {',
            '    "dev": "vite",',
            '    "build": "vite build",',
            '    "test": "jest --coverage",',
            '    "lint": "eslint src/"',
            '  },',
            '  "dependencies": {',
            '    "react": "^18.2.0",',
            '    "react-dom": "^18.2.0"',
            '  }',
            '}'
        ],
        exitCode: 0
    }
};

const parseAnsiColors = (text) => {
    const colorMap = {
        '32': 'text-green-400',
        '33': 'text-yellow-400',
        '31': 'text-red-400',
        '36': 'text-cyan-400',
        '35': 'text-purple-400'
    };
    
    const parts = [];
    const regex = /\x1b\[(\d+)m(.*?)(?=\x1b|$)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index), className: '' });
        }
        const colorCode = match[1];
        const content = match[2];
        if (colorCode === '0') {
            parts.push({ text: content, className: '' });
        } else {
            parts.push({ text: content, className: colorMap[colorCode] || '' });
        }
        lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), className: '' });
    }
    
    if (parts.length === 0) {
        return [{ text, className: '' }];
    }
    
    return parts;
};

export default function SandboxTerminal({ commands = [], onCommandComplete, project }) {
    const [history, setHistory] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [commandHistory, setCommandHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [copied, setCopied] = useState(false);
    const terminalRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [history]);

    useEffect(() => {
        if (commands.length > 0 && history.length === 0) {
            runCommands(commands);
        }
    }, [commands]);

    const runCommands = async (cmds) => {
        for (const cmd of cmds) {
            await executeCommand(cmd);
            await new Promise(r => setTimeout(r, 300));
        }
    };

    const executeCommand = async (cmd) => {
        setIsRunning(true);
        setCommandHistory(prev => [...prev, cmd]);
        setHistoryIndex(-1);
        
        setHistory(prev => [...prev, { type: 'command', content: cmd }]);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Handle special commands
        if (cmd === 'clear' || cmd === 'cls') {
            setHistory([]);
            setIsRunning(false);
            return 0;
        }

        if (cmd === 'help') {
            const helpOutput = [
                'Available commands:',
                '  npm test       - Run tests',
                '  npm run lint   - Run linter',
                '  npm run build  - Build project',
                '  npm install    - Install dependencies',
                '  pytest         - Run Python tests',
                '  git status     - Show git status',
                '  git diff --stat - Show changes',
                '  ls -la         - List files',
                '  clear          - Clear terminal',
                '  help           - Show this help'
            ];
            for (const line of helpOutput) {
                setHistory(prev => [...prev, { type: 'output', content: line }]);
            }
            setIsRunning(false);
            return 0;
        }

        const simulation = commandSimulations[cmd] || {
            output: [`\x1b[33mCommand not found: ${cmd}\x1b[0m`, 'Type "help" for available commands'],
            exitCode: 127
        };

        for (const line of simulation.output) {
            await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
            setHistory(prev => [...prev, { type: 'output', content: line }]);
        }

        const statusType = simulation.exitCode === 0 ? 'success' : 'error';
        setHistory(prev => [...prev, { 
            type: statusType, 
            content: `Exit code: ${simulation.exitCode}` 
        }]);

        setIsRunning(false);

        if (onCommandComplete) {
            onCommandComplete(cmd, simulation.exitCode);
        }

        return simulation.exitCode;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentCommand.trim() || isRunning) return;

        const cmd = currentCommand.trim();
        setCurrentCommand('');
        await executeCommand(cmd);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex + 1;
                if (newIndex < commandHistory.length) {
                    setHistoryIndex(newIndex);
                    setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCurrentCommand('');
            }
        }
    };

    const copyOutput = async () => {
        const text = history.map(h => h.content.replace(/\x1b\[\d+m/g, '')).join('\n');
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const focusInput = () => {
        inputRef.current?.focus();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-slate-950 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col",
                isMaximized ? "fixed inset-4 z-50" : "h-80"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <Terminal className="w-4 h-4 text-slate-400 ml-2" />
                    <span className="text-sm text-slate-400">Sandbox Terminal</span>
                    {project?.name && (
                        <span className="text-xs text-slate-600">• {project.name}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={copyOutput}
                    >
                        {copied ? (
                            <Check className="w-3 h-3 text-green-400" />
                        ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setIsMaximized(!isMaximized)}
                    >
                        {isMaximized ? (
                            <Minimize2 className="w-3 h-3 text-slate-400" />
                        ) : (
                            <Maximize2 className="w-3 h-3 text-slate-400" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setHistory([])}
                    >
                        <X className="w-3 h-3 text-slate-400" />
                    </Button>
                </div>
            </div>

            {/* Terminal content */}
            <div 
                ref={terminalRef}
                onClick={focusInput}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm cursor-text"
            >
                {/* Welcome message */}
                {history.length === 0 && (
                    <div className="text-slate-500 mb-4">
                        <p>Welcome to Sandbox Terminal</p>
                        <p className="text-xs">Type "help" for available commands</p>
                    </div>
                )}

                {/* History */}
                {history.map((entry, idx) => (
                    <div key={idx} className="mb-1 leading-relaxed">
                        {entry.type === 'command' && (
                            <div className="flex items-center gap-2">
                                <span className="text-green-400">❯</span>
                                <span className="text-white">{entry.content}</span>
                            </div>
                        )}
                        {entry.type === 'output' && (
                            <div className="text-slate-300 pl-4 whitespace-pre">
                                {parseAnsiColors(entry.content).map((part, i) => (
                                    <span key={i} className={part.className}>{part.text}</span>
                                ))}
                            </div>
                        )}
                        {entry.type === 'success' && (
                            <div className="text-green-400 pl-4 text-xs opacity-60">{entry.content}</div>
                        )}
                        {entry.type === 'error' && (
                            <div className="text-red-400 pl-4 text-xs">{entry.content}</div>
                        )}
                    </div>
                ))}

                {/* Input line */}
                <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
                    <span className="text-green-400">❯</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isRunning}
                        className="flex-1 bg-transparent text-white outline-none caret-cyan-400"
                        placeholder={isRunning ? "" : ""}
                        autoFocus
                    />
                    {isRunning && (
                        <div className="w-2 h-4 bg-cyan-400 animate-pulse" />
                    )}
                </form>
            </div>
        </motion.div>
    );
}